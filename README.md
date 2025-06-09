# Aplicação de Videochamada com WebRTC

Esta é uma aplicação de videochamada desenvolvida com React e WebRTC, permitindo comunicação em tempo real com vídeo e áudio entre usuários.

## Tecnologias Utilizadas

- React
- TypeScript
- WebRTC (simple-peer)
- Socket.IO
- Styled Components
- Vite

## Funcionalidades

- Videochamadas em tempo real
- Comunicação por áudio
- Interface intuitiva e responsiva
- Botões para iniciar, atender e encerrar chamadas

## Como Executar

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor e o cliente:
   ```bash
   npm run dev:all
   ```
4. Acesse a aplicação em `http://localhost:5173`

## Estrutura do Projeto

- `src/components/VideoCall.tsx`: Componente principal da videochamada
- `server.js`: Servidor Socket.IO para sinalização WebRTC
- `src/App.tsx`: Componente raiz da aplicação

## Requisitos

- Node.js
- Navegador moderno com suporte a WebRTC
- Câmera e microfone

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
