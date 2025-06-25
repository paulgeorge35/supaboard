FROM oven/bun:1.2.2-alpine as base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/config-eslint/package.json ./packages/config-eslint/
COPY packages/config-typescript/package.json ./packages/config-typescript/

# Install dependencies
RUN bun install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
ENV DATABASE_URL="postgres://postgres:FnbwvTDtZyp42DJuPSfYTmuKWfOt3y5EnN6iWetDbP2b2wGJVE9CNAViiX4MkgN1@ockkkwswg80cks0g480sgw4c:5432/postgres"
RUN bun run generate

# Build all packages first
RUN bun run build --filter=@repo/database
RUN bun run build --filter=@repo/eslint-config
RUN bun run build --filter=@repo/typescript-config

# Build the API
RUN bun run build --filter=@repo/api

# Production image, copy all the files and run the app
FROM base AS runner
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