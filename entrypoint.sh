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
  chmod 777 "$FILE_PATH" || true
else
  echo "⚠️ $FILE_PATH not found. Creating it..."
  touch "$FILE_PATH"
  chown 1001:1001 "$FILE_PATH" || true
  chmod 777 "$FILE_PATH" || true
fi

# Also try to make the file world-writable as a fallback
echo "🔧 Setting world-writable permissions as fallback..."
chmod 777 "$FILE_PATH" || true

# If the above doesn't work, try removing and recreating the file
echo "🔧 Testing file write access..."
if ! echo "test" > "$FILE_PATH" 2>/dev/null; then
  echo "⚠️ Cannot write to file, attempting to remove and recreate..."
  rm -f "$FILE_PATH" || true
  touch "$FILE_PATH"
  chown 1001:1001 "$FILE_PATH" || true
  chmod 777 "$FILE_PATH" || true
  echo "test" > "$FILE_PATH" || echo "❌ Still cannot write to file"
fi

# Final attempt: make the entire directory world-writable
echo "🔧 Making directory world-writable as last resort..."
chmod -R 777 "$DIR_PATH" || true
chmod 777 "$FILE_PATH" || true

# Debug: Show current permissions
echo "🔍 Current file permissions:"
ls -la "$FILE_PATH" || echo "Could not list file permissions"
echo "🔍 Current directory permissions:"
ls -la "$DIR_PATH" || echo "Could not list directory permissions"

# Debug: Show current user and groups
echo "🔍 Current user info:"
id || echo "Could not get user info"
echo "🔍 Current working directory:"
pwd || echo "Could not get working directory"

# Drop privileges and start the Bun app
echo "🚀 Starting Bun app as user 'bun'..."
exec su bun -c "bun run apps/infra/dist/index.js"
