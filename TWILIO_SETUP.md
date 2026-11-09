# Configuração TURN da Twilio

O backend expõe `GET /api/turn`, que usa a API Network Traversal da Twilio
(`client.tokens.create()`) para gerar servidores STUN/TURN com credenciais
temporárias. O frontend ([VideoCall.tsx](src/components/VideoCall.tsx)) busca
essa lista ao carregar a página e a usa no `RTCPeerConnection`.

Sem as credenciais, o `/api/turn` responde **500**. Nesse caso o frontend usa só
STUN do Google, e chamadas entre redes com NAT restritivo (4G, redes corporativas)
podem não conectar.

## 1. Obter as credenciais

No [Console da Twilio](https://console.twilio.com/), copie:

- **Account SID**
- **Auth Token** (clique em "Show")

## 2. Configurar na EC2

As credenciais ficam em `server/.env` dentro do clone de produção. O arquivo é
carregado pelo `server.js` via `dotenv` e está no `.gitignore`.

```bash
# Na sua máquina: crie o arquivo localmente (fora do repositório)
cat > /tmp/twilio.env << 'EOF'
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EOF

# Libere seu acesso SSH por 60 s via EC2 Instance Connect e copie o arquivo
aws ec2-instance-connect send-ssh-public-key --profile interfone --region us-east-2 \
  --instance-id i-05ea144341d4c18bc --instance-os-user ubuntu \
  --ssh-public-key file://$HOME/.ssh/id_rsa.pub
scp -i ~/.ssh/id_rsa /tmp/twilio.env ubuntu@<IP>:/home/ubuntu/interfone-digital/server/.env
rm /tmp/twilio.env

# Na EC2
chmod 600 ~/interfone-digital/server/.env
sudo supervisorctl restart meuapp
```

O `deploy.sh` faz `git pull` no clone, então o `.env` (ignorado pelo git)
continua lá entre deploys.

## 3. Testar

```bash
curl -s https://interfonedigital.duckdns.org/api/turn/
```

Deve responder 200 com um servidor `stun:global.stun.twilio.com:3478` e servidores
`turn:global.turn.twilio.com` (UDP 3478, TCP 3478 e TCP 443), cada um com `username`
e `credential`.

No navegador, o console registra `✅ TURN funcionando!` quando um candidato
`relay` é gerado, ou seja, quando as credenciais TURN foram aceitas. Para
confirmar que a chamada de fato passa pelo relay, faça uma chamada entre redes
diferentes (por exemplo, Wi-Fi e 4G) e veja em `chrome://webrtc-internals` o par
de candidatos selecionado.

## Custos

A Twilio cobra o tráfego que passa pelos servidores TURN, por GB. Consulte a
[página de preços](https://www.twilio.com/stun-turn/pricing).
