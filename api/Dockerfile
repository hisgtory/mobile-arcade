# syntax=docker/dockerfile:1.7

# 1. cargo-chef 베이스: 의존성 그래프만 추출해 Docker 레이어 캐싱을 극대화
FROM rust:1.93-slim-bookworm AS chef
RUN cargo install cargo-chef --locked --version "^0.1"
WORKDIR /app

# 2. recipe.json 생성 (소스 변경되어도 deps 안 바뀌면 캐시 hit)
FROM chef AS planner
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo chef prepare --recipe-path recipe.json

# 3. 의존성만 먼저 컴파일 → 소스 수정해도 deps 재컴파일 안 함
FROM chef AS builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
 && rm -rf /var/lib/apt/lists/*
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

# 4. 실제 소스 빌드
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release --bin arcade-api

# 5. 슬림 런타임 이미지 (~80MB)
FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
 && rm -rf /var/lib/apt/lists/* \
 && useradd -r -u 1000 -m -d /home/app app

COPY --from=builder /app/target/release/arcade-api /usr/local/bin/arcade-api

USER app
WORKDIR /home/app

ENV PORT=8080 \
    RUST_LOG=arcade_api=info,tower_http=info

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -fsS "http://localhost:${PORT}/health" || exit 1

CMD ["arcade-api"]
