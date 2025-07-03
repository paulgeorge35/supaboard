# --- Build stage ---
FROM oven/bun:1.2.18 as builder

WORKDIR /app

# Install dependencies and build
COPY . .
RUN bun install
RUN bun run build

# --- Serve stage ---
FROM node:20-alpine as runner

# Install a lightweight static file server
RUN npm install -g serve

WORKDIR /app

# Copy only the built output
COPY --from=builder /app/dist ./dist

# Expose the port Vite preview uses by default
EXPOSE 4173

# Start the static file server
CMD ["serve", "-s", "dist", "-l", "4173"]
