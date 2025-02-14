#!/bin/bash
DOMAIN="$1"
LOG_FILE="/var/log/domain-removal.log"

# --------------------------
# Initialize Logging
# --------------------------
exec > >(tee -a "${LOG_FILE}") 2>&1
echo "=== Starting domain removal for ${DOMAIN} at $(date) ==="

# --------------------------
# Input Validation
# --------------------------
if [ -z "${DOMAIN}" ]; then
    echo "ERROR: Domain name is required"
    echo "Usage: $0 domain.com"
    exit 1
fi

# --------------------------
# Error Handling
# --------------------------
set -e  # Exit on any error

cleanup() {
    if [ $? -ne 0 ]; then
        echo "ERROR: Script failed with error at $(date)"
    fi
    echo "=== Completed domain removal process ==="
}

trap cleanup EXIT

# --------------------------
# Remove Nginx Configuration
# --------------------------
echo "Removing Nginx configuration files..."
if [ -f "/etc/nginx/sites-enabled/${DOMAIN}" ]; then
    rm -f "/etc/nginx/sites-enabled/${DOMAIN}"
    echo "Removed sites-enabled symlink"
fi

if [ -f "/etc/nginx/sites-available/${DOMAIN}" ]; then
    rm -f "/etc/nginx/sites-available/${DOMAIN}"
    echo "Removed sites-available configuration"
fi

# --------------------------
# Remove SSL Certificates
# --------------------------
echo "Removing SSL certificates..."
if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
    certbot delete --cert-name "${DOMAIN}" --non-interactive
    echo "Removed SSL certificates"
fi

# --------------------------
# Reload Nginx
# --------------------------
echo "Reloading Nginx configuration..."
nginx -t && nginx -s reload

echo "=== Successfully removed all configurations for ${DOMAIN} ===" 