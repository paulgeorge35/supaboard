# --- Dev stage ---
FROM oven/bun:1.2.18

WORKDIR /app

# Copy entire monorepo (or only needed dirs if you want)
COPY . .

# Install deps
RUN bun install --use-workspaces

# Expose the dev server port
EXPOSE 4173

# Build the application first
RUN bun run --filter "@repo/client" build

# Healthcheck should use 127.0.0.1 or localhost
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=5 \
    CMD curl --fail http://127.0.0.1:4173 || exit 1

# Start the Vite preview server for @repo/client
CMD ["bun", "run", "--filter", "@repo/client", "serve"]
