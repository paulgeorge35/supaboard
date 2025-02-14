#!/bin/bash
DOMAIN="$1"
LOG_FILE="/var/log/domain-setup.log"

# --------------------------
# Initialize Logging
# --------------------------
exec > >(tee -a "${LOG_FILE}") 2>&1
echo "=== Starting domain setup for ${DOMAIN} at $(date) ==="

# --------------------------
# Error Handling & Cleanup
# --------------------------
cleanup() {
  echo "=== Cleaning up on exit ==="
  rm -f "/etc/nginx/sites-enabled/${DOMAIN}"
  nginx -s reload >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

# --------------------------
# Remove existing configuration
# --------------------------
remove_existing_config() {
  if [ -f "/etc/nginx/sites-available/${DOMAIN}" ]; then
    echo "Removing existing Nginx configuration for ${DOMAIN}"
    rm -f "/etc/nginx/sites-available/${DOMAIN}"
    rm -f "/etc/nginx/sites-enabled/${DOMAIN}"
    nginx -s reload >/dev/null 2>&1 || true
  fi
}

validate_environment() {
  # Expected CNAME target (tenant's subdomain)
  local EXPECTED_CNAME="cname.supaboard.io"
  
  # 1. Verify CNAME exists and points to cname.supaboard.io
  local CNAME_RECORD=$(dig +short CNAME "${DOMAIN}" | sed 's/\.$//')
  
  if [ "$CNAME_RECORD" != "$EXPECTED_CNAME" ]; then
    echo "ERROR: Missing or incorrect CNAME record"
    echo "Required: ${DOMAIN} → CNAME → ${EXPECTED_CNAME}"
    echo "Found:    ${CNAME_RECORD:-none}"
    exit 1
  fi

#   # 2. Verify tenant.supaboard.io resolves to our IP
#   local TENANT_IP=$(dig +short A "$EXPECTED_CNAME" | tail -n1)
#   local SERVER_IP=$(curl -4s https://api.ipify.org)
  
#   if [ "$TENANT_IP" != "$SERVER_IP" ]; then
#     echo "ERROR: Tenant subdomain ${EXPECTED_CNAME} points to ${TENANT_IP}"
#     echo "Should point to server IP: ${SERVER_IP}"
#     exit 1
#   fi

#   # 3. Optional: Verify custom domain ultimately resolves correctly
#   local CUSTOM_IP=$(dig +short A "${DOMAIN}" | tail -n1)
#   if [ "$CUSTOM_IP" != "$SERVER_IP" ]; then
#     echo "WARNING: ${DOMAIN} currently resolves to ${CUSTOM_IP}"
#     echo "DNS propagation may take a few minutes"
#   fi
}

# --------------------------
# Main Execution
# --------------------------
validate_environment

# Remove any existing configuration
remove_existing_config

# Temporary ACME challenge config
echo "Creating temporary Nginx config"
cat > "/etc/nginx/sites-available/${DOMAIN}" <<EOL
server {
    listen 80;
    server_name ${DOMAIN};
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 403;
    }
}
EOL

ln -sf "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/"
nginx -t && nginx -s reload

# Certificate generation
echo "Generating SSL certificate"
certbot certonly --webroot --non-interactive --agree-tos \
  -m paultibulca@gmail.com -d "${DOMAIN}" \
  --webroot-path /var/www/certbot

# Final production config
echo "Creating production Nginx config"
cat > "/etc/nginx/sites-available/${DOMAIN}" <<EOL
server {
    listen 80;
    server_name ${DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name ${DOMAIN};
    
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    location = /favicon.ico {
        alias /var/www/supaboard/favicon.ico;
    }
    
    # Proxy API requests to your backend on port 8000
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Serve static files for your React app
    location / {
        root /var/www/supaboard;
        index index.html;
        # Try to serve the requested file, if not found fallback to index.html
        try_files \$uri \$uri/ /index.html;
    }
}
EOL

# Final reload
nginx -t && nginx -s reload
echo "=== Setup completed successfully ==="

# Disable cleanup trap after success
trap - EXIT INT TERM