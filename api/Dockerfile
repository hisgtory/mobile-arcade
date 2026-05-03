FROM rust:1.93-slim-bookworm AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
 && rm -rf /var/lib/apt/lists/*

COPY Cargo.toml Cargo.lock* ./
RUN mkdir src && echo 'fn main() {}' > src/main.rs && cargo build --release && rm -rf src target/release/deps/arcade_api*

COPY src ./src
RUN cargo build --release


FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && useradd -r -u 1000 -m -d /home/app app

COPY --from=builder /app/target/release/arcade-api /usr/local/bin/arcade-api

USER app
ENV PORT=8080 \
    RUST_LOG=arcade_api=info,tower_http=info
EXPOSE 8080

CMD ["arcade-api"]
