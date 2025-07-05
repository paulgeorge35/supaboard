FROM oven/bun:1.2.18 AS builder

WORKDIR /app

# Install system deps needed for Prisma
RUN apt-get update && \
    apt-get install -y openssl libssl-dev pkg-config build-essential curl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy source
COPY . .

# Install deps
RUN bun install --use-workspaces

# Generate Prisma clients
ENV DATABASE_URL=${DATABASE_URL}

# Build the app
RUN bun run build --filter=@repo/infra

# Final image
FROM oven/bun:1.2.18 as runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8001

# System deps again
RUN apt-get update && \
    apt-get install -y openssl curl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create user
RUN groupadd -g 1001 nodejs || true
RUN useradd -r -u 1001 -g nodejs -d /app -s /bin/sh bun || true

# Copy built code
COPY --from=builder /app/apps/infra/dist ./apps/infra/dist
COPY --from=builder /app/apps/infra/src ./apps/infra/src
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock ./bun.lock
COPY --from=builder /app/node_modules ./node_modules

# Make sure custom-domains.yaml exists
RUN mkdir -p /data/coolify/proxy/dynamic && \
    touch /data/coolify/proxy/dynamic/custom-domains.yaml && \
    chmod 666 /data/coolify/proxy/dynamic/custom-domains.yaml

# Use unprivileged user
USER bun

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD bun --version || exit 1

CMD ["bun", "run", "apps/infra/dist/index.js"]
