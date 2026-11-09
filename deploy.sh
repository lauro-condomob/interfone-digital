#!/bin/bash

# Deploy do Interfone Digital na EC2 de produção.
#
# O servidor roda a partir de um clone git em /home/ubuntu/interfone-digital:
#   - nginx serve o frontend estático de dist/
#   - supervisor (programa "meuapp") roda o backend server/server.js na porta 8000
#
# Este script entra na EC2 via EC2 Instance Connect (não precisa da chave .pem),
# atualiza o clone para o branch pedido, gera o build do frontend, reinicia o
# backend e testa o /api/turn.
#
# Uso: ./deploy.sh [BRANCH]          (padrão: main)
#
# Pré-requisito: credenciais AWS válidas no profile (padrão "interfone"):
#   aws login --profile interfone --region us-east-2
#
# Variáveis opcionais:
#   AWS_PROFILE  (padrão: interfone)
#   AWS_REGION   (padrão: us-east-2)
#   INSTANCE_ID  (padrão: i-05ea144341d4c18bc)
#   SSH_KEY      chave privada local; a .pub correspondente é enviada (padrão: ~/.ssh/id_rsa)
#   DOMAIN       (padrão: interfonedigital.duckdns.org)

set -euo pipefail

BRANCH="${1:-main}"
AWS_PROFILE="${AWS_PROFILE:-interfone}"
AWS_REGION="${AWS_REGION:-us-east-2}"
INSTANCE_ID="${INSTANCE_ID:-i-05ea144341d4c18bc}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_rsa}"
DOMAIN="${DOMAIN:-interfonedigital.duckdns.org}"
APP_DIR="/home/ubuntu/interfone-digital"
AWS_ARGS=(--profile "$AWS_PROFILE" --region "$AWS_REGION")

if [ ! -f "$SSH_KEY" ] || [ ! -f "$SSH_KEY.pub" ]; then
    echo "❌ Chave SSH não encontrada: $SSH_KEY (e $SSH_KEY.pub)"
    exit 1
fi

if ! aws sts get-caller-identity "${AWS_ARGS[@]}" > /dev/null 2>&1; then
    echo "❌ Sem credenciais AWS válidas no profile '$AWS_PROFILE'."
    echo "   Rode: aws login --profile $AWS_PROFILE --region $AWS_REGION"
    exit 1
fi

if ! git ls-remote --exit-code --heads origin "$BRANCH" > /dev/null 2>&1; then
    echo "❌ Branch '$BRANCH' não existe no origin. Faça push antes do deploy."
    exit 1
fi

# O IP público muda se a instância for parada/iniciada (não há Elastic IP),
# então ele é consultado a cada deploy.
EC2_HOST=$(aws ec2 describe-instances "${AWS_ARGS[@]}" --instance-ids "$INSTANCE_ID" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

if [ -z "$EC2_HOST" ] || [ "$EC2_HOST" = "None" ]; then
    echo "❌ A instância $INSTANCE_ID não tem IP público (está parada?)."
    exit 1
fi

echo "🚀 Deploy do branch '$BRANCH' em $INSTANCE_ID ($EC2_HOST)"

# Autoriza a chave pública local por 60 segundos.
aws ec2-instance-connect send-ssh-public-key "${AWS_ARGS[@]}" \
    --instance-id "$INSTANCE_ID" \
    --instance-os-user ubuntu \
    --ssh-public-key "file://$SSH_KEY.pub" > /dev/null

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new ubuntu@"$EC2_HOST" \
    "BRANCH='$BRANCH' APP_DIR='$APP_DIR' bash -s" << 'EOF'
set -euo pipefail
cd "$APP_DIR"

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    echo "❌ Há alterações locais não commitadas no servidor:"
    git status --short --untracked-files=no
    exit 1
fi

OLD_HEAD=$(git rev-parse HEAD)

echo "📥 Atualizando código..."
git fetch -q origin
git checkout -q "$BRANCH"
git pull -q --ff-only origin "$BRANCH"
NEW_HEAD=$(git rev-parse HEAD)
git log --oneline -1

changed() { git diff --quiet "$OLD_HEAD" "$NEW_HEAD" -- "$@" && return 1 || return 0; }

if changed package.json package-lock.json; then
    echo "📦 Instalando dependências do frontend..."
    npm install --no-audit --no-fund
fi

if changed server/package.json server/package-lock.json; then
    echo "📦 Instalando dependências do backend..."
    (cd server && npm install --omit=dev --no-audit --no-fund)
fi

if [ ! -f server/.env ]; then
    echo "⚠️  server/.env não existe: o /api/turn vai falhar sem as credenciais da Twilio."
fi

echo "🔨 Gerando build do frontend..."
sudo npm run build

echo "🔄 Reiniciando backend..."
sudo supervisorctl restart meuapp
sleep 3
sudo supervisorctl status meuapp
EOF

echo "🧪 Testando https://$DOMAIN/api/turn/ ..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/turn/")
if [ "$STATUS" = "200" ]; then
    echo "✅ Deploy concluído. /api/turn respondeu 200."
else
    echo "⚠️  Deploy feito, mas /api/turn respondeu $STATUS. Veja os logs:"
    echo "   ssh ... 'sudo tail -50 /var/log/interfone-digital.err.log'"
    exit 1
fi
