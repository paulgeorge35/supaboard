#!/bin/sh

set -e

FILE_PATH="/data/coolify/proxy/dynamic/custom-domains.yaml"

# Ensure file exists and fix ownership/permissions
if [ -f "$FILE_PATH" ]; then
  echo "✅ Found $FILE_PATH. Fixing permissions..."
  chown 1001:1001 "$FILE_PATH" || true
  chmod 664 "$FILE_PATH" || true
else
  echo "⚠️ $FILE_PATH not found. Skipping permission fix."
fi

# Drop privileges and start the Bun app
echo "🚀 Starting Bun app as user 'bun'..."
exec su bun -c "bun run apps/infra/dist/index.js"
