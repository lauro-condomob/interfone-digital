# 📂 Configuração do GitHub para Deploy AWS

## 🚀 Passos para criar repositório no GitHub

### 1. Criar repositório no GitHub

1. **Acesse**: [GitHub.com](https://github.com)
2. **Clique** em "New repository" (ou "+" no topo da página)
3. **Configure**:
   - **Repository name**: `interfone`
   - **Description**: `Aplicação de videochamada WebRTC com React e Node.js`
   - **Visibility**: Public (ou Private se preferir)
   - **NÃO marque**: "Initialize with README" (já temos um)

### 2. Conectar repositório local

```bash
# Adicionar origem remota (substitua SEU_USUARIO pelo seu username do GitHub)
git remote add origin https://github.com/SEU_USUARIO/interfone.git

# Renomear branch para main (padrão moderno)
git branch -M main

# Fazer push inicial
git push -u origin main
```

### 3. Verificar upload

- Acesse: `https://github.com/SEU_USUARIO/interfone`
- Confirme que todos os arquivos estão lá
- README deve estar sendo exibido

### 4. Atualizar URLs nos scripts

Após criar o repositório, atualize as referências:

#### No arquivo `AWS_DEPLOY_GUIDE.md`:
```bash
# Substitua nas linhas que contêm:
wget -O aws-setup.sh https://raw.githubusercontent.com/seu-repo/interfone/main/aws-setup.sh

# Por:
wget -O aws-setup.sh https://raw.githubusercontent.com/SEU_USUARIO/interfone/main/aws-setup.sh
```

#### No arquivo `README.md`:
```bash
# Substitua:
git clone https://github.com/seu-usuario/interfone.git

# Por:
git clone https://github.com/SEU_USUARIO/interfone.git
```

### 5. Commit das correções

```bash
# Fazer as alterações acima, depois:
git add .
git commit -m "Fix: Update repository URLs to actual GitHub repo"
git push origin main
```

## 📋 URLs importantes após configuração

- **Repositório**: `https://github.com/SEU_USUARIO/interfone`
- **Clone HTTPS**: `https://github.com/SEU_USUARIO/interfone.git`
- **Clone SSH**: `git@github.com:SEU_USUARIO/interfone.git`
- **Raw files**: `https://raw.githubusercontent.com/SEU_USUARIO/interfone/main/`

## 🔧 Deploy após GitHub

Depois que o repositório estiver no GitHub:

1. **Configure EC2** usando o [Guia AWS](AWS_DEPLOY_GUIDE.md)
2. **Execute deploy** com `./deploy.sh`
3. **Monitore logs** para verificar funcionamento

## 🔒 Configuração de SSH (Opcional)

Para evitar digitar senha toda vez:

```bash
# Gerar chave SSH (se não tiver)
ssh-keygen -t ed25519 -C "lauro@condomob.net"

# Adicionar ao ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Adicionar chave pública ao GitHub
cat ~/.ssh/id_ed25519.pub
# Copie o output e cole em GitHub > Settings > SSH and GPG keys

# Alterar remote para SSH
git remote set-url origin git@github.com:SEU_USUARIO/interfone.git
```

## ✅ Checklist final

- [ ] Repositório criado no GitHub
- [ ] Código enviado (`git push`)
- [ ] URLs atualizadas nos arquivos
- [ ] README sendo exibido corretamente
- [ ] Scripts de deploy funcionando
- [ ] Pronto para deploy AWS! 🚀 