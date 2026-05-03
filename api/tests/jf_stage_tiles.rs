//! 통합 테스트: DynamoDB Local + 실제 arcade-api 바이너리 e2e.
//!
//! 자동 셋업 우선순위:
//! 1. `DDB_ENDPOINT` 환경변수가 설정되어 있으면 그 엔드포인트를 사용 (DDB 직접 띄우지 않음)
//! 2. `DDB_LOCAL_JAR` 환경변수 또는 기본 경로(`/tmp/ddblocal/DynamoDBLocal.jar`)에
//!    DynamoDB Local jar가 있으면 자동 spawn
//! 3. 둘 다 없으면 테스트 SKIP (eprintln + early return)
//!
//! 테스트 바이너리 종료 시 자식 프로세스(java, arcade-api 둘 다)는
//! `kill_on_drop`으로 정리됨.

use std::path::PathBuf;
use std::time::Duration;

use serde_json::json;
use tokio::net::TcpStream;
use tokio::process::{Child, Command};

const SKIP_MSG: &str = "[skip] integration test requires DynamoDB Local — set DDB_ENDPOINT \
    or place DynamoDBLocal.jar at /tmp/ddblocal (DDB_LOCAL_JAR overrides)";

struct Setup {
    api_url: String,
    _ddb: Option<Child>,
    _api: Child,
}

#[tokio::test]
async fn integration() {
    let Some(setup) = setup_or_skip().await else {
        eprintln!("{}", SKIP_MSG);
        return;
    };

    // 1. health
    let res = reqwest::get(format!("{}/health", setup.api_url))
        .await
        .expect("health request");
    assert_eq!(res.status(), 200, "health endpoint should be 200");

    // 2. happy path: 첫 호출은 lazy gen
    let body = json!({ "stage": 1, "objects": 2 });
    let res = post(&setup.api_url, &body).await;
    assert_eq!(res.status(), 200, "first call should be 200 OK");
    let tiles: serde_json::Value = res.json().await.unwrap();
    let arr = tiles.as_array().expect("tiles must be array");
    // stage 1 + objects 2 = 2*3*1 = 6 tiles
    assert_eq!(arr.len(), 6, "stage 1 with 2 objects should produce 6 tiles");
    for tile in arr {
        let oid = tile["objectId"].as_u64().expect("objectId");
        assert!(oid < 2, "objectId {} must be < objects=2", oid);
        assert!(tile["id"].as_str().unwrap().starts_with("tile_"));
    }

    // 3. 두 번째 호출도 200 (캐시 hit이어야 빨라야 함)
    let started = std::time::Instant::now();
    let res = post(&setup.api_url, &body).await;
    let elapsed = started.elapsed();
    assert_eq!(res.status(), 200);
    assert!(
        elapsed < Duration::from_millis(500),
        "cache hit too slow: {elapsed:?}"
    );

    // 4. stage out of range
    let res = post(&setup.api_url, &json!({ "stage": 0, "objects": 2 })).await;
    assert_eq!(res.status(), 400);
    let err: serde_json::Value = res.json().await.unwrap();
    assert_eq!(err["code"], "stage_out_of_range");

    // 5. objects out of range
    let res = post(&setup.api_url, &json!({ "stage": 1, "objects": 99 })).await;
    assert_eq!(res.status(), 400);
    let err: serde_json::Value = res.json().await.unwrap();
    assert_eq!(err["code"], "objects_out_of_range");

    // 6. malformed json
    let res = reqwest::Client::new()
        .post(format!("{}/v1/jf/stage/tiles", setup.api_url))
        .header("content-type", "application/json")
        .body("not json")
        .send()
        .await
        .unwrap();
    assert_eq!(res.status(), 400);

    // 7. larger board
    let res = post(&setup.api_url, &json!({ "stage": 10, "objects": 6 })).await;
    assert_eq!(res.status(), 200);
    let tiles: serde_json::Value = res.json().await.unwrap();
    let arr = tiles.as_array().unwrap();
    // stage 10: setMultiplier=2, typeCount=6 → 6*3*2 = 36
    assert_eq!(arr.len(), 36);
    let max_obj = arr
        .iter()
        .map(|t| t["objectId"].as_u64().unwrap())
        .max()
        .unwrap();
    assert!(max_obj < 6, "max objectId {} must be < 6", max_obj);
}

async fn post(base: &str, body: &serde_json::Value) -> reqwest::Response {
    reqwest::Client::new()
        .post(format!("{}/v1/jf/stage/tiles", base))
        .json(body)
        .send()
        .await
        .expect("request send")
}

async fn setup_or_skip() -> Option<Setup> {
    let (ddb_endpoint, ddb_child) = ensure_ddb().await?;

    // Random TCP port for the api binary
    let listener = std::net::TcpListener::bind("127.0.0.1:0").ok()?;
    let api_port = listener.local_addr().ok()?.port();
    drop(listener);

    let bin = env!("CARGO_BIN_EXE_arcade-api");
    let api_child = Command::new(bin)
        .env("PORT", api_port.to_string())
        .env("DDB_ENDPOINT", &ddb_endpoint)
        .env("DDB_TABLE", "juicy-fruits-test")
        .env("AWS_REGION", "us-east-1")
        .env("AWS_ACCESS_KEY_ID", "fake")
        .env("AWS_SECRET_ACCESS_KEY", "fake")
        .env("RUST_LOG", "warn")
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .kill_on_drop(true)
        .spawn()
        .ok()?;

    // Wait for /health
    let api_url = format!("http://127.0.0.1:{}", api_port);
    if !wait_for_http(&format!("{}/health", api_url), 50).await {
        eprintln!("[setup] arcade-api failed to start within timeout");
        return None;
    }

    Some(Setup {
        api_url,
        _ddb: ddb_child,
        _api: api_child,
    })
}

async fn ensure_ddb() -> Option<(String, Option<Child>)> {
    if let Ok(ep) = std::env::var("DDB_ENDPOINT") {
        if !ep.is_empty() {
            return Some((ep, None));
        }
    }
    let jar = std::env::var("DDB_LOCAL_JAR")
        .ok()
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("/tmp/ddblocal/DynamoDBLocal.jar"));
    if !jar.exists() {
        return None;
    }
    let lib = jar
        .parent()
        .map(|p| p.join("DynamoDBLocal_lib"))
        .unwrap_or_else(|| PathBuf::from("/tmp/ddblocal/DynamoDBLocal_lib"));

    let listener = std::net::TcpListener::bind("127.0.0.1:0").ok()?;
    let port = listener.local_addr().ok()?.port();
    drop(listener);

    let mut cmd = Command::new("java");
    cmd.arg(format!("-Djava.library.path={}", lib.display()))
        .arg("-jar")
        .arg(jar)
        .arg("-inMemory")
        .arg("-port")
        .arg(port.to_string())
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .kill_on_drop(true);
    let child = cmd.spawn().ok()?;

    if !wait_for_tcp(port, 40).await {
        eprintln!("[setup] DynamoDB Local failed to bind on port {port}");
        return None;
    }

    Some((format!("http://127.0.0.1:{port}"), Some(child)))
}

async fn wait_for_tcp(port: u16, attempts: u32) -> bool {
    for _ in 0..attempts {
        if TcpStream::connect(("127.0.0.1", port)).await.is_ok() {
            return true;
        }
        tokio::time::sleep(Duration::from_millis(150)).await;
    }
    false
}

async fn wait_for_http(url: &str, attempts: u32) -> bool {
    for _ in 0..attempts {
        if let Ok(res) = reqwest::get(url).await {
            if res.status().is_success() {
                return true;
            }
        }
        tokio::time::sleep(Duration::from_millis(150)).await;
    }
    false
}
