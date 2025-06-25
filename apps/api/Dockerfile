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
RUN bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN bun run generate

# Build the API
RUN bun run build --filter=@repo/api

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 bun

# Copy built application
COPY --from=builder --chown=bun:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=bun:nodejs /app/apps/api/src ./apps/api/src
COPY --from=builder --chown=bun:nodejs /app/packages ./packages
COPY --from=builder --chown=bun:nodejs /app/package.json ./package.json
COPY --from=builder --chown=bun:nodejs /app/bun.lock ./bun.lock

USER bun

EXPOSE 8000

CMD ["bun", "run", "apps/api/dist/index.js"] 