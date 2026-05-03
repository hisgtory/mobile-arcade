use std::net::SocketAddr;
use std::time::Duration;

use aws_config::BehaviorVersion;
use aws_sdk_dynamodb::config::retry::RetryConfig;
use aws_sdk_dynamodb::config::timeout::TimeoutConfig;
use axum::Router;
use tower_http::compression::CompressionLayer;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::EnvFilter;

mod error;
mod jf;
mod routes;
mod state;

use crate::jf::repo::VariantRepo;
use crate::state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("arcade_api=info,tower_http=info")),
        )
        .init();

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let state = build_state().await?;

    let app = Router::new()
        .merge(routes::router(state))
        .layer(CompressionLayer::new())
        .layer(TraceLayer::new_for_http())
        .layer(cors);

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(8080);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));

    let listener = tokio::net::TcpListener::bind(addr).await?;
    tracing::info!("listening on http://{addr}");

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

async fn build_state() -> anyhow::Result<AppState> {
    let table = std::env::var("DDB_TABLE").unwrap_or_else(|_| "juicy-fruits".into());
    let endpoint = std::env::var("DDB_ENDPOINT").ok();

    let mut loader = aws_config::defaults(BehaviorVersion::latest())
        .retry_config(RetryConfig::standard().with_max_attempts(3))
        .timeout_config(
            TimeoutConfig::builder()
                .operation_timeout(Duration::from_millis(1_500))
                .operation_attempt_timeout(Duration::from_millis(600))
                .build(),
        );
    if let Some(ep) = endpoint.as_ref() {
        loader = loader.endpoint_url(ep);
    }
    let config = loader.load().await;
    let client = aws_sdk_dynamodb::Client::new(&config);
    tracing::info!(table, endpoint = endpoint.as_deref().unwrap_or("<aws default>"), "ddb configured");

    if endpoint.is_some() {
        // 로컬 dev에서만 테이블 자동 생성. 운영은 IaC로 관리.
        ensure_table(&client, &table).await;
    }

    Ok(AppState {
        variants: VariantRepo::new(client, table),
    })
}

async fn ensure_table(client: &aws_sdk_dynamodb::Client, table: &str) {
    use aws_sdk_dynamodb::types::{
        AttributeDefinition, BillingMode, KeySchemaElement, KeyType, ScalarAttributeType,
    };

    if client.describe_table().table_name(table).send().await.is_ok() {
        return;
    }

    let res = client
        .create_table()
        .table_name(table)
        .billing_mode(BillingMode::PayPerRequest)
        .attribute_definitions(
            AttributeDefinition::builder()
                .attribute_name("pk")
                .attribute_type(ScalarAttributeType::S)
                .build()
                .unwrap(),
        )
        .attribute_definitions(
            AttributeDefinition::builder()
                .attribute_name("sk")
                .attribute_type(ScalarAttributeType::S)
                .build()
                .unwrap(),
        )
        .key_schema(
            KeySchemaElement::builder()
                .attribute_name("pk")
                .key_type(KeyType::Hash)
                .build()
                .unwrap(),
        )
        .key_schema(
            KeySchemaElement::builder()
                .attribute_name("sk")
                .key_type(KeyType::Range)
                .build()
                .unwrap(),
        )
        .send()
        .await;

    match res {
        Ok(_) => tracing::info!(table, "created table (local dev)"),
        Err(e) => tracing::warn!(table, error = %e, "ensure_table failed"),
    }
}

async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c().await.ok();
    };

    #[cfg(unix)]
    let terminate = async {
        let mut sig = tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("install SIGTERM handler");
        sig.recv().await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }

    tracing::info!("shutting down");
}
