#!/bin/bash

# Configuração inicial de uma EC2 nova (Ubuntu 22.04) para o Interfone Digital,
# reproduzindo o setup de produção:
#   - clone git em /home/ubuntu/interfone-digital
#   - backend (server/server.js, porta 8000) rodando via supervisor ("meuapp")
#   - nginx servindo dist/ e fazendo proxy de /socket.io/ e /api/turn/ para o backend
#   - certificado Let's Encrypt via certbot
#
# Rode na EC2, como o usuário ubuntu:
#   ./aws-setup.sh <DOMINIO> <URL_DO_REPO_GIT>
# Ex.: ./aws-setup.sh interfonedigital.duckdns.org https://github.com/lauro-condomob/interfone-digital.git
#
# Depois disso, crie server/.env com as credenciais da Twilio (veja TWILIO_SETUP.md)
# e use ./deploy.sh na sua máquina para os próximos deploys.

set -euo pipefail

DOMAIN="${1:-}"
REPO_URL="${2:-}"
APP_DIR="/home/ubuntu/interfone-digital"

if [ -z "$DOMAIN" ] || [ -z "$REPO_URL" ]; then
    echo "❌ Uso: ./aws-setup.sh <DOMINIO> <URL_DO_REPO_GIT>"
    exit 1
fi

echo "📦 Instalando pacotes..."
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx supervisor git openssl
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

echo "📥 Clonando o repositório..."
if [ ! -d "$APP_DIR/.git" ]; then
    git clone "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"
npm install --no-audit --no-fund   # o postinstall também instala server/

# O backend escuta em HTTPS na porta 8000 usando cert.pem/key.pem na raiz do clone.
# É um certificado autoassinado: só o nginx fala com ele, via localhost.
if [ ! -f cert.pem ] || [ ! -f key.pem ]; then
    echo "🔐 Gerando certificado autoassinado para o backend..."
    openssl req -x509 -newkey rsa:2048 -nodes -days 3650 \
        -keyout key.pem -out cert.pem -subj "/CN=localhost"
fi

echo "🔨 Gerando build do frontend..."
sudo npm run build

echo "⚙️ Configurando supervisor..."
sudo tee /etc/supervisor/conf.d/app-node.conf > /dev/null << EOF
[program:meuapp]
command=node $APP_DIR/server/server.js
directory=$APP_DIR/server
autostart=true
autorestart=true
stderr_logfile=/var/log/interfone-digital.err.log
stdout_logfile=/var/log/interfone-digital.out.log
user=ubuntu
environment=NODE_ENV="production",PORT="8000"
EOF
sudo supervisorctl reread
sudo supervisorctl update

echo "🌐 Configurando nginx..."
# O nginx (www-data) precisa atravessar /home/ubuntu para ler dist/.
chmod o+x /home/ubuntu

sudo tee /etc/nginx/sites-available/interfone.conf > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    root $APP_DIR/dist;
    index index.html;

    location /socket.io/ {
        proxy_pass https://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api/turn/ {
        proxy_pass https://localhost:8000/api/turn;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
sudo ln -sf /etc/nginx/sites-available/interfone.conf /etc/nginx/sites-enabled/interfone.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx

echo "🔒 Emitindo certificado Let's Encrypt..."
echo "   (o DNS de $DOMAIN já precisa apontar para o IP público desta instância)"
sudo certbot --nginx -d "$DOMAIN" --redirect

echo ""
echo "✅ Setup concluído."
echo "Próximos passos:"
echo "1. Crie $APP_DIR/server/.env com TWILIO_ACCOUNT_SID e TWILIO_AUTH_TOKEN (chmod 600)"
echo "2. sudo supervisorctl restart meuapp"
echo "3. Teste: curl https://$DOMAIN/api/turn/"
