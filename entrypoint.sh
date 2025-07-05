#!/bin/sh

# Ensure file exists and has writable permissions
if [ ! -f /data/coolify/proxy/dynamic/custom-domains.yaml ]; then
  echo "# auto-created" > /data/coolify/proxy/dynamic/custom-domains.yaml
fi

chmod 666 /data/coolify/proxy/dynamic/custom-domains.yaml

exec "$@"
