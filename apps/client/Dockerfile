# --- Build stage ---
FROM oven/bun:1.2.18 AS builder

WORKDIR /app

# Copy entire repo (including packages, apps)
COPY . .

# Install deps with workspace linking
RUN bun install --use-workspaces

# Build your client app
RUN bun run --filter @repo/client build

# --- Serve stage ---
FROM node:20-alpine AS runner

RUN npm install -g serve

WORKDIR /app

COPY --from=builder /app/apps/client/dist ./dist

EXPOSE 4173

CMD ["serve", "-s", "dist", "-l", "4173"]
