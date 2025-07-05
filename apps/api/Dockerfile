FROM oven/bun:1.2.18 AS builder

WORKDIR /app

# Install OpenSSL + necessary dev libraries for Prisma
RUN apt-get update -y && \
    apt-get install -y openssl libssl-dev pkg-config build-essential && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy entire repo (including packages, apps)
COPY . .

# Install deps with workspace linking
RUN bun install --use-workspaces

# Generate Prisma client without SQL validation (for build)
ENV DATABASE_URL="postgres://postgres:FnbwvTDtZyp42DJuPSfYTmuKWfOt3y5EnN6iWetDbP2b2wGJVE9CNAViiX4MkgN1@ockkkwswg80cks0g480sgw4c:5432/supaboard?connection_limit=20&pool_timeout=20"
RUN cd packages/database && bunx prisma generate

# Build database package first
RUN cd packages/database && bun run prebuild

# Build the API
RUN bun run build --filter=@repo/api

# Production image, copy all the files and run the app
FROM oven/bun:1.2.18 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

# Install OpenSSL and curl for Prisma runtime and health checks
RUN apt-get update -y && \
    apt-get install -y openssl curl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create a non-root user (bun user might already exist in the base image)
RUN addgroup -g 1001 -S nodejs || true
RUN adduser -S -D -H -h /app -s /bin/sh -u 1001 -G nodejs bun || true

# Copy built application and packages
COPY --from=builder --chown=bun:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=bun:nodejs /app/apps/api/src ./apps/api/src
COPY --from=builder --chown=bun:nodejs /app/packages ./packages
COPY --from=builder --chown=bun:nodejs /app/package.json ./package.json
COPY --from=builder --chown=bun:nodejs /app/bun.lock ./bun.lock
COPY --from=builder --chown=bun:nodejs /app/node_modules ./node_modules

# Create .env file in packages/database
RUN echo "NODE_ENV=production" > ./packages/database/.env

USER bun

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD bun --version && curl -f http://localhost:8000/health || exit 1

CMD ["bun", "run", "apps/api/dist/index.js"] 