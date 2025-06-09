# 🚀 Guia Completo de Deploy na AWS EC2

## 📋 Pré-requisitos

- Conta AWS
- Domínio registrado (ex: GoDaddy, Namecheap, Route53)
- Cliente SSH (Linux/Mac terminal, Windows PowerShell/PuTTY)

---

## 🏗️ Fase 1: Configuração da AWS

### 1.1 Criar Instância EC2

1. **Faça login no AWS Console**: https://console.aws.amazon.com/
2. **Vá para EC2**: Serviços → EC2
3. **Launch Instance**:
   - **Name**: `interfone-app`
   - **AMI**: Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Instance type**: t2.micro (Free tier eligible)
   - **Key pair**: Create new key pair
     - Name: `interfone-key`
     - Type: RSA
     - Format: .pem
     - **Download the key** (guarde em ~/.ssh/)
   - **Network settings**:
     - Create security group
     - Allow SSH (port 22) from your IP
     - Allow HTTP (port 80) from anywhere
     - Allow HTTPS (port 443) from anywhere
   - **Storage**: 8 GB (free tier)

4. **Launch instance**

### 1.2 Configurar Security Group

Após criar a instância, configure as regras:

```
Type        Protocol    Port Range    Source
SSH         TCP         22           Your IP/32
HTTP        TCP         80           0.0.0.0/0
HTTPS       TCP         443          0.0.0.0/0
Custom TCP  TCP         8000         0.0.0.0/0  (temporário para teste)
```

### 1.3 Obter IP Público

- Anote o **Public IPv4 address** da sua instância
- Exemplo: `54.123.45.67`

---

## 🌐 Fase 2: Configuração do Domínio

### 2.1 Configurar DNS

No seu provedor de domínio, configure:

```
Type    Name    Value           TTL
A       @       54.123.45.67    300
A       www     54.123.45.67    300
```

### 2.2 Verificar Propagação

```bash
# Teste se o DNS propagou
nslookup seu-dominio.com
ping seu-dominio.com
```

---

## 💻 Fase 3: Configuração do Servidor

### 3.1 Conectar ao EC2

```bash
# Configurar permissões da chave
chmod 400 ~/.ssh/interfone-key.pem

# Conectar ao servidor
ssh -i ~/.ssh/interfone-key.pem ubuntu@SEU_IP_PUBLICO
```

### 3.2 Executar Configuração Inicial

No servidor EC2, execute:

```bash
# Download do script de configuração
wget -O aws-setup.sh https://raw.githubusercontent.com/seu-repo/interfone/main/aws-setup.sh

# Dar permissão de execução
chmod +x aws-setup.sh

# Executar configuração
./aws-setup.sh
```

### 3.3 Configurar Domínio no Nginx

```bash
# Substituir placeholder pelo seu domínio
sudo sed -i 's/DOMAIN_PLACEHOLDER/seu-dominio.com/g' /etc/nginx/sites-available/interfone

# Ativar site
sudo ln -sf /etc/nginx/sites-available/interfone /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar nginx
sudo systemctl reload nginx
```

### 3.4 Configurar SSL com Let's Encrypt

```bash
# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Seguir as instruções do certbot
# Escolha opção 2 (redirect HTTP to HTTPS)
```

---

## 🚀 Fase 4: Deploy da Aplicação

### 4.1 Preparar Arquivos Localmente

No seu computador local:

```bash
# Tornar script executável
chmod +x deploy.sh

# Fazer build da aplicação
npm run build

# Executar deploy
./deploy.sh SEU_IP_PUBLICO seu-dominio.com
```

### 4.2 Verificar Deploy

```bash
# Conectar ao servidor
ssh -i ~/.ssh/interfone-key.pem ubuntu@SEU_IP_PUBLICO

# Verificar status do serviço
sudo systemctl status interfone

# Ver logs em tempo real
sudo journalctl -f -u interfone
```

---

## 🔧 Fase 5: Configuração da Twilio (Opcional)

### 5.1 Configurar Credenciais

```bash
# No servidor EC2, edite o arquivo .env
sudo nano /opt/interfone/server/.env

# Adicione suas credenciais da Twilio
TWILIO_ACCOUNT_SID=seu_account_sid
TWILIO_AUTH_TOKEN=seu_auth_token

# Reiniciar serviço
sudo systemctl restart interfone
```

---

## ✅ Fase 6: Teste e Verificação

### 6.1 Testes Básicos

1. **Acesse**: `https://seu-dominio.com`
2. **Verifique**:
   - ✅ Site carrega com HTTPS
   - ✅ Não há erros de certificado
   - ✅ Conecta ao WebSocket
   - ✅ Funcionalidades de videochamada

### 6.2 Testes de Conectividade

```bash
# Teste HTTPS
curl -I https://seu-dominio.com

# Teste API
curl https://seu-dominio.com/api/turn-config

# Teste WebSocket (do navegador)
# DevTools > Console:
# io('https://seu-dominio.com')
```

---

## 🛠️ Manutenção e Monitoramento

### Comandos Úteis

```bash
# Ver logs da aplicação
sudo journalctl -f -u interfone

# Reiniciar aplicação
sudo systemctl restart interfone

# Verificar status dos serviços
sudo systemctl status interfone nginx

# Atualizar aplicação
./deploy.sh SEU_IP_PUBLICO seu-dominio.com

# Backup
sudo tar -czf /backup/interfone-$(date +%Y%m%d).tar.gz /opt/interfone
```

### Monitoramento

- **Logs de acesso**: `/var/log/nginx/access.log`
- **Logs de erro**: `/var/log/nginx/error.log`
- **Logs da aplicação**: `sudo journalctl -u interfone`

---

## 💰 Custos Estimados

### AWS EC2 (t2.micro)
- **Free Tier**: 750 horas/mês grátis (primeiro ano)
- **Após free tier**: ~$8.50/mês

### Certificado SSL
- **Let's Encrypt**: Gratuito

### Domínio
- **Variável**: $10-15/ano

### Twilio TURN
- **Conta gratuita**: Créditos iniciais
- **Produção**: ~$0.0001-0.0004 por minuto

---

## 🆘 Solução de Problemas

### Problema: Site não carrega
```bash
# Verificar nginx
sudo systemctl status nginx
sudo nginx -t

# Verificar DNS
nslookup seu-dominio.com
```

### Problema: WebSocket não conecta
```bash
# Verificar aplicação
sudo systemctl status interfone
sudo journalctl -u interfone --since "10 minutes ago"

# Verificar portas
sudo netstat -tlnp | grep :8000
```

### Problema: SSL não funciona
```bash
# Verificar certificado
sudo certbot certificates

# Renovar certificado
sudo certbot renew --dry-run
```

---

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs** primeiro
2. **Consulte a documentação** da AWS
3. **Teste localmente** antes de fazer deploy
4. **Mantenha backups** regulares

**🎉 Sua aplicação de videochamada estará disponível em `https://seu-dominio.com`!** 