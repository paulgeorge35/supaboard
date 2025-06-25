FROM oven/bun:1.2.2-alpine as base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY apps/client/package.json ./apps/client/
COPY packages/config-eslint/package.json ./packages/config-eslint/
COPY packages/config-typescript/package.json ./packages/config-typescript/

# Install dependencies
RUN bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the client
RUN bun run build --filter=@repo/client

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create a non-root user (bun user might already exist in the base image)
RUN addgroup -g 1001 -S nodejs || true
RUN adduser -S -D -H -h /app -s /bin/sh -u 1001 -G nodejs bun || true

# Copy built application and necessary files
COPY --from=builder --chown=bun:nodejs /app/apps/client/dist ./apps/client/dist
COPY --from=builder --chown=bun:nodejs /app/apps/client/package.json ./apps/client/package.json
COPY --from=builder --chown=bun:nodejs /app/apps/client/vite.config.ts ./apps/client/vite.config.ts
COPY --from=builder --chown=bun:nodejs /app/package.json ./package.json
COPY --from=builder --chown=bun:nodejs /app/bun.lock ./bun.lock
COPY --from=builder --chown=bun:nodejs /app/node_modules ./node_modules

USER bun

EXPOSE 3000

# Use Vite preview to serve the built files
CMD ["bun", "run", "--cwd", "apps/client", "serve", "--port", "3000", "--host", "0.0.0.0"] 