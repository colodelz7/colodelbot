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
│   ├── js/script.js        # Lógica do chat e UI
│   └── css/style.css       # Tema holográfico
└── backend/
    ├── server.js           # Servidor Express + serve o frontend
    ├── routes/chat.js      # Endpoint da API de chat
    ├── services/
    │   └── geminiService.js  # Integração com Gemini + memória
    ├── middleware/
    │   └── rateLimiter.js  # Rate limiting de requisições
    ├── package.json
    ├── .gitignore
    └── .env.example        # Variáveis de ambiente necessárias
```

## 🚀 Rodando localmente

```bash
cd backend
npm install
cp .env.example .env
# preencha o .env com sua chave do Gemini
npm start
```

Acesse `http://localhost:3002` — o backend já serve o frontend automaticamente.

## ⚙️ Variáveis de Ambiente

```env
GEMINI_API_KEY=sua_chave_aqui
GEMINI_MODEL=gemini-2.5-flash
PORT=3002
```

Obtenha sua chave gratuitamente em [aistudio.google.com](https://aistudio.google.com/apikey).

## 👨‍💻 Autor

Desenvolvido por **Guilherme Colodel** — [github.com/colodelz7](https://github.com/colodelz7)