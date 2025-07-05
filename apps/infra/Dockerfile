FROM oven/bun:1.2.18 AS builder

WORKDIR /app

# Install system dependencies needed for Prisma
RUN apt-get update && \
    apt-get install -y openssl libssl-dev pkg-config build-essential curl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy source
COPY . .

# Install deps
RUN bun install --use-workspaces

# Generate Prisma clients (assumes DATABASE_URL is passed during build or mocked)
ENV DATABASE_URL=${DATABASE_URL}

# Build the app
RUN bun run build --filter=@repo/infra

# --------------------
# Runner stage
# --------------------
FROM oven/bun:1.2.18 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8001

# Install system deps for runtime
RUN apt-get update && \
    apt-get install -y openssl curl procps && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create unprivileged user
RUN groupadd -g 1001 nodejs || true && \
    useradd -r -u 1001 -g nodejs -d /app -s /bin/sh bun || true

# Ensure the bun user can access the app directory
RUN chown -R bun:nodejs /app || true

# Copy built application
COPY --from=builder /app/apps/infra/dist ./apps/infra/dist
COPY --from=builder /app/apps/infra/src ./apps/infra/src
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock ./bun.lock
COPY --from=builder /app/node_modules ./node_modules

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD bun --version || exit 1

CMD ["bun", "run", "apps/infra/dist/index.js"]
