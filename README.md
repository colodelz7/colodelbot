# 🤖 ColodelBot

Assistente de IA conversacional com interface holográfica, powered by Google Gemini. Suporta streaming de respostas, upload de imagens, memória de longo prazo e personalidade configurável.

## 🛠️ Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | HTML + CSS + JavaScript |
| Backend | Node.js + Express |
| IA | Google Gemini 2.5 Flash |
| Bibliotecas | Marked.js · Highlight.js |

## 📁 Estrutura

```
├── frontend/
│   ├── index.html          # Entrada da aplicação
│   ├── script.js        # Lógica do chat e UI
│   └── style.css       # Tema holográfico
└── backend/
    ├── server.js           # Servidor Express + serve o frontend
    ├── routes/chat.js      # Endpoint da API de chat
    ├── services/
    │   └── geminiService.js  # Integração com Gemini + memória
    ├── middleware/
    │   └── rateLimiter.js  # Rate limiting de requisições
    ├── package.json
    ├── .gitignore
    └── .env     # Variáveis de ambiente necessárias
```

## 🚀 Rodando localmente

```bash
npm install
npm start
```
