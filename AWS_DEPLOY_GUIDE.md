# Deploy na AWS EC2

Como o Interfone Digital roda em produção e como fazer deploy.

## Visão geral

| Item | Valor |
|---|---|
| Conta AWS | `699475938495` |
| Região | `us-east-2` (Ohio) |
| Instância | `i-05ea144341d4c18bc` (nome `interfone-digital`), Ubuntu 22.04 |
| IP público | dinâmico, sem Elastic IP (muda se a instância for parada e iniciada) |
| Domínio | `interfonedigital.duckdns.org` (DuckDNS) |
| Security group | `sg-01d896ae5e2ce34c5` |
| Código | clone git em `/home/ubuntu/interfone-digital` |
| Node.js | 18 |

```
navegador ──HTTPS──▶ nginx :443 ─┬─ /            → arquivos estáticos de dist/
                                 ├─ /socket.io/  → https://localhost:8000 (sinalização WebRTC)
                                 └─ /api/turn/   → https://localhost:8000/api/turn (credenciais TURN da Twilio)

supervisor (programa "meuapp") → node server/server.js, porta 8000
```

- **Frontend:** build do Vite em `dist/`, gerado no próprio servidor com `sudo npm run build`.
- **Backend:** `server/server.js`, gerenciado pelo supervisor
  (`/etc/supervisor/conf.d/app-node.conf`). Escuta em HTTPS na porta 8000 usando um
  certificado autoassinado (`cert.pem` e `key.pem` na raiz do clone); só o nginx
  fala com ele.
- **Variáveis de ambiente:** `server/.env`, carregado via `dotenv` e ignorado pelo git.
  Contém as credenciais da Twilio; veja [TWILIO_SETUP.md](TWILIO_SETUP.md).
- **nginx:** `/etc/nginx/sites-available/interfone.conf`.
- **Certificado público:** Let's Encrypt em `/etc/letsencrypt/live/interfonedigital.duckdns.org/`,
  renovado automaticamente pelo timer do certbot.

## Acesso

A chave `.pem` do key pair `interfone-digital` não é necessária: o acesso é feito por
**EC2 Instance Connect**, que autoriza sua chave SSH pública por 60 segundos.

### 1. Login na AWS

Requer AWS CLI 2.32.0 ou mais recente.

```bash
aws login --profile interfone --region us-east-2
aws sts get-caller-identity --profile interfone   # confere a conta 699475938495
```

As credenciais duram até 12 horas.

### 2. SSH na instância

```bash
P="--profile interfone --region us-east-2"
IP=$(aws ec2 describe-instances $P --instance-ids i-05ea144341d4c18bc \
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

aws ec2-instance-connect send-ssh-public-key $P \
  --instance-id i-05ea144341d4c18bc --instance-os-user ubuntu \
  --ssh-public-key file://$HOME/.ssh/id_rsa.pub

ssh -i ~/.ssh/id_rsa ubuntu@$IP    # dentro de 60 segundos
```

## Deploy

O deploy publica o que está no GitHub, não o que está na sua máquina. Faça push antes.

```bash
./deploy.sh            # deploy da main
./deploy.sh meu-branch # deploy de outro branch
```

O [deploy.sh](deploy.sh):

1. Confere as credenciais AWS e se o branch existe no `origin`.
2. Descobre o IP atual da instância e libera o SSH via Instance Connect.
3. No servidor, faz `git fetch`, `git checkout <branch>` e `git pull --ff-only`. Para
   o deploy se houver alterações não commitadas no clone.
4. Roda `npm install` apenas se `package.json` ou `package-lock.json` mudaram (raiz ou `server/`).
5. Roda `sudo npm run build` e `sudo supervisorctl restart meuapp`.
6. Testa `https://interfonedigital.duckdns.org/api/turn/` e falha se não responder 200.

O `server/.env` não é versionado, então o `git pull` não o altera.

Para usar outro profile, instância ou chave: `AWS_PROFILE`, `AWS_REGION`, `INSTANCE_ID`,
`SSH_KEY` e `DOMAIN` (veja o cabeçalho do script).

### Deploy manual

Equivalente ao script, já dentro da instância:

```bash
cd ~/interfone-digital
git pull
sudo npm run build                # só se o frontend mudou
sudo supervisorctl restart meuapp # só se o backend mudou
```

## Operação

```bash
sudo supervisorctl status meuapp
sudo supervisorctl restart meuapp
sudo tail -f /var/log/interfone-digital.out.log   # stdout do backend
sudo tail -f /var/log/interfone-digital.err.log   # stderr do backend
sudo tail -f /var/log/nginx/error.log
sudo nginx -t && sudo systemctl reload nginx
sudo certbot certificates                         # validade do certificado
```

Testes rápidos:

```bash
curl -sI https://interfonedigital.duckdns.org/            # 200
curl -s  https://interfonedigital.duckdns.org/api/turn/   # JSON com stun/turn da Twilio
```

`/api/turn` sem a barra final responde 301 para `/api/turn/`. O frontend já segue o redirect.

## Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| `/api/turn/` responde 500 | `server/.env` ausente ou credenciais da Twilio inválidas | Veja [TWILIO_SETUP.md](TWILIO_SETUP.md) e o `interfone-digital.err.log` |
| Chamadas não conectam entre redes diferentes | Sem servidores TURN (`/api/turn` falhando) | Corrija o `/api/turn` e confira o console do navegador |
| 502 no `/socket.io/` | Backend parado | `sudo supervisorctl status meuapp` e logs |
| SSH recusado ou timeout | Mais de 60 s entre o `send-ssh-public-key` e o `ssh`, ou IP mudou | Repita os dois comandos e consulte o IP de novo |
| Site fora do ar depois de reiniciar a instância | IP público mudou e o DuckDNS ainda aponta para o antigo | Atualize o IP no DuckDNS |

## Instância nova do zero

O [aws-setup.sh](aws-setup.sh) reproduz o setup de produção numa EC2 Ubuntu 22.04 nova:
pacotes, clone, certificado do backend, build, supervisor, nginx e certbot.

Ele foi escrito a partir da configuração atual de produção e ainda não foi testado numa
instância nova.

1. Crie a instância (Ubuntu 22.04) com um security group liberando TCP 22, 80 e 443.
2. Aponte o domínio no DuckDNS para o IP público dela.
3. Entre via SSH e rode:
   ```bash
   curl -fsSLO https://raw.githubusercontent.com/lauro-condomob/interfone-digital/main/aws-setup.sh
   chmod +x aws-setup.sh
   ./aws-setup.sh interfonedigital.duckdns.org https://github.com/lauro-condomob/interfone-digital.git
   ```
4. Crie o `server/.env` ([TWILIO_SETUP.md](TWILIO_SETUP.md)) e reinicie o `meuapp`.
5. Atualize `INSTANCE_ID` no [deploy.sh](deploy.sh) e a tabela no topo deste guia.
