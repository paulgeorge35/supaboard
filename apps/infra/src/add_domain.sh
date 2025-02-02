#!/bin/bash
DOMAIN=$1

# Create Nginx config template
cat > /etc/nginx/sites-available/$DOMAIN <<EOL
server {
    listen 80;
    server_name $DOMAIN;
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOL

# Enable site
ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/

# Obtain SSL certificate
certbot --nginx --non-interactive --agree-tos -m admin@supaboard.app -d $DOMAIN

# Reload Nginx
nginx -s reload