#!/bin/bash

# Script de Deploy para AWS EC2
# Uso: ./deploy.sh [IP_DO_EC2] [NOME_DO_DOMINIO]

set -e

EC2_IP=$1
DOMAIN=$2

if [ -z "$EC2_IP" ] || [ -z "$DOMAIN" ]; then
    echo "❌ Uso: ./deploy.sh [IP_DO_EC2] [NOME_DO_DOMINIO]"
    echo "Exemplo: ./deploy.sh 54.123.45.67 meuinterfone.com"
    exit 1
fi

echo "🚀 Iniciando deploy para AWS EC2..."
echo "📍 IP do EC2: $EC2_IP"
echo "🌐 Domínio: $DOMAIN"

# 1. Build da aplicação React
echo "🔨 Building aplicação React..."
npm run build

# 2. Criar arquivo de produção
echo "📦 Preparando arquivos para produção..."
tar -czf interfone-deploy.tar.gz \
    dist/ \
    server/ \
    package.json \
    README.md

# 3. Upload para EC2
echo "📤 Uploading para EC2..."
scp -i ~/.ssh/interfone-key.pem interfone-deploy.tar.gz ubuntu@$EC2_IP:~/

# 4. Deploy no servidor
echo "🔧 Executando deploy no servidor..."
ssh -i ~/.ssh/interfone-key.pem ubuntu@$EC2_IP << EOF
    # Parar serviços existentes
    sudo systemctl stop interfone || true
    
    # Backup da versão anterior
    sudo mv /opt/interfone /opt/interfone-backup-\$(date +%Y%m%d-%H%M%S) || true
    
    # Extrair nova versão
    sudo mkdir -p /opt/interfone
    sudo tar -xzf interfone-deploy.tar.gz -C /opt/interfone
    sudo chown -R ubuntu:ubuntu /opt/interfone
    
    # Instalar dependências
    cd /opt/interfone/server
    npm install --production
    
    # Configurar variáveis de ambiente
    sudo tee /opt/interfone/server/.env > /dev/null << EOL
PORT=8000
NODE_ENV=production
DOMAIN=$DOMAIN
SSL_KEY_PATH=/etc/ssl/private/privkey.pem
SSL_CERT_PATH=/etc/ssl/certs/fullchain.pem
# TODO: Adicionar suas credenciais da Twilio
# TWILIO_ACCOUNT_SID=your_account_sid
# TWILIO_AUTH_TOKEN=your_auth_token
EOL
    
    # Iniciar serviço
    sudo systemctl start interfone
    sudo systemctl enable interfone
    
    # Limpeza
    rm ~/interfone-deploy.tar.gz
EOF

# 5. Limpeza local
rm interfone-deploy.tar.gz

echo "✅ Deploy concluído!"
echo "🌐 Sua aplicação estará disponível em: https://$DOMAIN"
echo "📋 Para verificar logs: ssh -i ~/.ssh/interfone-key.pem ubuntu@$EC2_IP 'sudo journalctl -f -u interfone'" 