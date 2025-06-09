# 📞 Interfone Digital - Aplicação de Videochamada WebRTC

Uma aplicação moderna de videochamada desenvolvida com React e WebRTC, oferecendo comunicação em tempo real com vídeo, áudio e sistema de toque.

## ✨ Funcionalidades

- 📹 **Videochamadas em tempo real** com WebRTC
- 🔊 **Sistema de áudio** bidirecional
- 🔔 **Toque personalizado** para chamadas recebidas (MP3)
- 🆔 **IDs customizados** para identificação de usuários
- 📱 **Interface responsiva** e intuitiva
- 🔒 **Suporte HTTPS** para produção
- ☁️ **Deploy AWS** automatizado
- 🌐 **Configuração TURN** (Twilio ready)

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 18** + TypeScript
- **Styled Components** para estilização
- **WebRTC** para comunicação P2P
- **Socket.IO Client** para sinalização
- **Vite** para build e desenvolvimento

### Backend
- **Node.js 18+** 
- **Express** como servidor web
- **Socket.IO** para WebSocket
- **CORS** configurado para produção

### DevOps
- **AWS EC2** para hospedagem
- **Nginx** como proxy reverso
- **Let's Encrypt** para SSL gratuito
- **Systemd** para gerenciamento de serviços

## 📋 Pré-requisitos

- Node.js 16+ (recomendado 18+)
- NPM ou Yarn
- Navegador moderno com suporte WebRTC
- Câmera e microfone (para videochamadas)

## 🛠️ Instalação e Execução Local

### 1. Clonar o repositório
```bash
git clone https://github.com/seu-usuario/interfone.git
cd interfone
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Executar aplicação
```bash
# Comando único (servidor + cliente)
npm run dev:all

# Ou comandos separados
npm run server  # Terminal 1 - Servidor WebRTC (porta 8000)
npm run dev     # Terminal 2 - React App (porta 5173)
```

### 4. Acessar aplicação
- **Interface web**: https://localhost:5173
- **Servidor WebRTC**: https://localhost:8000

## 🔧 Como Usar

1. **Acesse** a aplicação no navegador
2. **Configure seu ID** único (ex: "joao123")
3. **Permita** acesso à câmera/microfone
4. **Abra em outra aba/dispositivo** com ID diferente
5. **Digite o ID do contato** e clique em "Ligar"
6. **Atenda a chamada** na outra tela
7. **Aproveite** a videochamada! 🎉

## ☁️ Deploy na AWS

### Pré-requisitos AWS
- Conta AWS
- Domínio registrado
- Cliente SSH

### Deploy Automático
```bash
# 1. Configurar EC2 (execute no servidor)
./aws-setup.sh

# 2. Fazer deploy (execute localmente)
./deploy.sh SEU_IP_PUBLICO seu-dominio.com
```

### Deploy Manual
Consulte o [**Guia Completo de Deploy AWS**](AWS_DEPLOY_GUIDE.md) para instruções detalhadas.

## 🔔 Sistema de Toque

O sistema inclui toque automático para chamadas recebidas:
- **Arquivo MP3**: `public/ringtone.mp3` (substitua por seu próprio)
- **Fallback sintético**: Oscilador Web Audio API
- **Controle automático**: Para quando chamada é atendida/rejeitada

## 🌐 Configuração TURN (Twilio)

Para produção em redes restritivas, configure servidores TURN:

1. **Crie conta** na [Twilio](https://www.twilio.com/)
2. **Configure credenciais** no arquivo `.env`
3. **Consulte** o [Guia Twilio](TWILIO_SETUP.md)

## 📁 Estrutura do Projeto

```
interfone/
├── src/
│   ├── components/
│   │   ├── VideoCall.tsx      # Componente principal
│   │   └── AudioIndicator.tsx # Indicador de áudio
│   ├── App.tsx                # App principal
│   └── main.tsx              # Entry point
├── server/
│   ├── server.js             # Servidor WebRTC
│   ├── package.json          # Deps do servidor
│   └── env.example           # Variáveis de ambiente
├── public/
│   └── ringtone.mp3          # Arquivo de toque
├── deploy.sh                 # Script de deploy
├── aws-setup.sh             # Setup do EC2
└── AWS_DEPLOY_GUIDE.md      # Guia completo
```

## 🔒 Segurança

- **HTTPS obrigatório** em produção
- **CORS configurado** para domínios específicos
- **Headers de segurança** implementados
- **Firewall configurado** no EC2
- **SSL gratuito** via Let's Encrypt

## 🛠️ Scripts Disponíveis

```bash
npm run dev         # Desenvolvimento React
npm run build       # Build para produção
npm run server      # Servidor WebRTC
npm run dev:all     # Ambos simultaneamente
npm run lint        # Verificar código
```

## 🐛 Solução de Problemas

### Câmera não funciona
- Verifique se está usando HTTPS
- Permita acesso à câmera no navegador
- Teste em localhost primeiro

### WebSocket não conecta
- Verifique se o servidor está rodando
- Confirme as portas 8000 e 5173
- Veja logs no console do navegador

### Deploy AWS falha
- Verifique configuração do domínio DNS
- Confirme security groups do EC2
- Teste conectividade SSH

## 💰 Custos Estimados

- **AWS EC2 t2.micro**: Grátis (primeiro ano) / $8.50/mês
- **Domínio**: $10-15/ano
- **SSL**: Gratuito (Let's Encrypt)
- **Twilio TURN**: $0.0001-0.0004/minuto

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/seu-usuario/interfone/issues)
- **Documentação**: [AWS Deploy Guide](AWS_DEPLOY_GUIDE.md)
- **Email**: lauro@condomob.net

---

**🎉 Desenvolvido com ❤️ por [Lauro Nolasco](https://github.com/seu-usuario)**
