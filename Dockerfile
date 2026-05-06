# Build stage
FROM golang:1.23-bookworm AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    libopus-dev \
    libopusfile-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the binary with CGo enabled
RUN CGO_ENABLED=1 GOOS=linux go build -o inti .

# Runtime stage
FROM debian:bookworm-slim

ARG APP_USER=inti
ARG APP_UID=1000
ARG APP_GID=1000

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libopus0 \
    libopusfile0 \
    wget \
    tesseract-ocr \
    tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid "${APP_GID}" "${APP_USER}" \
    && useradd --system --uid "${APP_UID}" --gid "${APP_GID}" --create-home --home-dir "/home/${APP_USER}" --shell /usr/sbin/nologin "${APP_USER}" \
    && install -d -o "${APP_UID}" -g "${APP_GID}" /app /app/config

# Copy binary from builder
COPY --from=builder --chown=${APP_UID}:${APP_GID} /app/inti .

# Copy web assets
COPY --from=builder --chown=${APP_UID}:${APP_GID} /app/web ./web

ENV INTI_CONFIG_DIR=/app/config

# Expose port
EXPOSE 8282

# Run the application
USER ${APP_UID}:${APP_GID}
CMD ["./inti", "serve"]
