#!/bin/bash

# Script de configuração inicial do EC2
# Execute este script no EC2 após a primeira conexão

set -e

echo "🚀 Configurando EC2 para aplicação Interfone..."

# 1. Atualizar sistema
echo "📦 Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js 18
echo "📋 Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Instalar nginx
echo "🌐 Instalando Nginx..."
sudo apt install -y nginx

# 4. Instalar certbot para SSL
echo "🔒 Instalando Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# 5. Configurar firewall
echo "🔥 Configurando firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# 6. Criar usuário para aplicação
echo "👤 Configurando usuário da aplicação..."
sudo useradd -r -s /bin/false interfone || true

# 7. Criar serviço systemd
echo "⚙️ Criando serviço systemd..."
sudo tee /etc/systemd/system/interfone.service > /dev/null << 'EOF'
[Unit]
Description=Interfone WebRTC Application
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/interfone/server
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# 8. Configurar Nginx como proxy reverso
echo "🔀 Configurando Nginx..."
sudo tee /etc/nginx/sites-available/interfone > /dev/null << 'EOF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;
    
    # Redirect all HTTP requests to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

    # SSL configuration (will be updated by certbot)
    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # WebSocket support
    location /socket.io/ {
        proxy_pass https://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API routes
    location /api/ {
        proxy_pass https://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location / {
        proxy_pass https://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 9. Recarregar systemd
sudo systemctl daemon-reload

# 10. Iniciar e habilitar nginx
sudo systemctl enable nginx
sudo systemctl start nginx

echo "✅ Configuração inicial do EC2 concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure seu domínio para apontar para este IP"
echo "2. Execute: sudo sed -i 's/DOMAIN_PLACEHOLDER/interfonedigital.duckdns.org/g' /etc/nginx/sites-available/interfone"
echo "3. Execute: sudo ln -sf /etc/nginx/sites-available/interfone /etc/nginx/sites-enabled/"
echo "4. Execute: sudo nginx -t && sudo systemctl reload nginx"
echo "5. Execute: sudo certbot --nginx -d interfonedigital.duckdns.org"
echo "6. Faça deploy da aplicação usando o script deploy.sh" 