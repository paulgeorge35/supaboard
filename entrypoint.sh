#!/bin/sh

set -e

FILE_PATH="/data/coolify/proxy/dynamic/custom-domains.yaml"
DIR_PATH="/data/coolify/proxy/dynamic"

# Ensure directory exists and has proper permissions
if [ -d "$DIR_PATH" ]; then
  echo "✅ Found directory $DIR_PATH. Fixing permissions..."
  chown -R 1001:1001 "$DIR_PATH" || true
  chmod -R 755 "$DIR_PATH" || true
else
  echo "⚠️ Directory $DIR_PATH not found. Creating it..."
  mkdir -p "$DIR_PATH"
  chown -R 1001:1001 "$DIR_PATH" || true
  chmod -R 755 "$DIR_PATH" || true
fi

# Also ensure the parent directory has proper permissions
PARENT_DIR="/data/coolify/proxy"
if [ -d "$PARENT_DIR" ]; then
  echo "🔧 Fixing parent directory permissions..."
  chown -R 1001:1001 "$PARENT_DIR" || true
  chmod -R 755 "$PARENT_DIR" || true
fi

# Ensure file exists and fix ownership/permissions
if [ -f "$FILE_PATH" ]; then
  echo "✅ Found $FILE_PATH. Fixing permissions..."
  chown 1001:1001 "$FILE_PATH" || true
  chmod 664 "$FILE_PATH" || true
else
  echo "⚠️ $FILE_PATH not found. Creating it..."
  touch "$FILE_PATH"
  chown 1001:1001 "$FILE_PATH" || true
  chmod 664 "$FILE_PATH" || true
fi

# Debug: Show current permissions
echo "🔍 Current file permissions:"
ls -la "$FILE_PATH" || echo "Could not list file permissions"
echo "🔍 Current directory permissions:"
ls -la "$DIR_PATH" || echo "Could not list directory permissions"

# Drop privileges and start the Bun app
echo "🚀 Starting Bun app as user 'bun'..."
exec su bun -c "bun run apps/infra/dist/index.js"
