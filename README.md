# 🤖 ColodelBot

Assistente de IA conversacional com interface holográfica, powered by Google Gemini. Suporta streaming de respostas, upload de imagens, memória de longo prazo e personalidade configurável.

## 🛠️ Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite 5 |
| Backend | Node.js + Express |
| IA | Google Gemini Flash |
| Bibliotecas | Marked.js · DOMPurify |

## 📁 Estrutura

```
├── frontend/
│   ├── src/
│   │   ├── components/     # ChatPanel, Sidebar, RobotPanel, etc.
│   │   ├── hooks/          # useChat, useConversations, useSettings, etc.
│   │   ├── lib/            # api.js, markdown.js, utils.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── style.css       # Tema holográfico
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── backend/
    ├── server.js           # Servidor Express
    ├── routes/chat.js      # Endpoint da API de chat
    ├── services/
    │   └── geminiService.js  # Integração com Gemini + memória
    ├── middleware/
    │   └── rateLimiter.js  # Rate limiting de requisições
    ├── package.json
    ├── .gitignore
    └── .env                # Variáveis de ambiente necessárias
```

## 🚀 Rodando localmente

### ⚙️ Backend

```bash
cd backend
npm install
npm start
```

### 💻 Frontend

```bash
cd frontend
npm install
npm run dev
```
