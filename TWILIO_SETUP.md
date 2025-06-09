# Configuração TURN da Twilio

## 1. Criar Conta na Twilio

1. Acesse [https://www.twilio.com/](https://www.twilio.com/)
2. Crie uma conta gratuita
3. Vá para o Console da Twilio

## 2. Obter Credenciais

No Console da Twilio, você precisará:

1. **Account SID**: Encontre na página principal do console
2. **Auth Token**: Clique em "Show" ao lado do Auth Token

## 3. Configurar no Servidor

Edite o arquivo `/opt/interfone/server/.env` no seu EC2:

```bash
# Configurações TURN da Twilio
TWILIO_ACCOUNT_SID=seu_account_sid_aqui
TWILIO_AUTH_TOKEN=seu_auth_token_aqui
```

## 4. Integração com a API (TODO)

Para integrar completamente com a Twilio, você precisará instalar o SDK:

```bash
npm install twilio
```

E atualizar o endpoint `/api/turn-config` no `server.js`:

```javascript
import twilio from 'twilio';

// No endpoint /api/turn-config
app.get('/api/turn-config', async (req, res) => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return res.json({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    const token = await client.tokens.create({
      ttl: 3600 // 1 hora
    });

    const turnConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
          urls: token.ice_servers[0].urls,
          username: token.ice_servers[0].username,
          credential: token.ice_servers[0].credential
        }
      ]
    };

    res.json(turnConfig);
  } catch (error) {
    console.error('Erro ao obter configuração TURN:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});
```

## 5. Custos

- **Conta gratuita**: Inclui alguns créditos iniciais
- **TURN servers**: Cobrados por uso (geralmente muito baixo para aplicações pequenas)
- **Preços atuais**: Consulte a página de preços da Twilio

## 6. Teste

Após configurar, teste em diferentes redes (Wi-Fi, 4G) para verificar se o TURN está funcionando corretamente em cenários com NAT/Firewall restritivos. 