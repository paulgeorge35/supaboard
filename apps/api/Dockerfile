FROM oven/bun:1.2.18 AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update -y && apt-get install -y openssl

# Copy entire repo (including packages, apps)
COPY . .

# Install deps with workspace linking
RUN bun install --use-workspaces

# Generate Prisma client without SQL validation (for build)
ENV DATABASE_URL="postgres://postgres:FnbwvTDtZyp42DJuPSfYTmuKWfOt3y5EnN6iWetDbP2b2wGJVE9CNAViiX4MkgN1@ockkkwswg80cks0g480sgw4c:5432/postgres"
RUN cd packages/database && bunx prisma generate

# Build database package first
RUN cd packages/database && bun run prebuild

# Build all packages first
RUN bun run build --filter=@repo/database
RUN bun run build --filter=@repo/eslint-config
RUN bun run build --filter=@repo/typescript-config

# Build the API
RUN bun run build --filter=@repo/api

# Production image, copy all the files and run the app
FROM oven/bun:1.2.18 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

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

USER bun

EXPOSE 8000

CMD ["bun", "run", "apps/api/dist/index.js"] 