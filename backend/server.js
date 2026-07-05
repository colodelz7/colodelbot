require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

const chatRouter = require("./routes/chat");

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// API
app.use("/api/chat", chatRouter);

// Frontend (estático) — assim você só precisa rodar este servidor
// e abrir http://localhost:3002 no navegador.
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");
app.use(express.static(FRONTEND_DIR));

app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log("");
  console.log("  ColodelBot rodando!");
  console.log(`  Abra no navegador: http://localhost:${PORT}`);
  console.log("");
  if (!process.env.GEMINI_API_KEY) {
    console.warn(
      "  ⚠ GEMINI_API_KEY não encontrada no .env — o chat não vai funcionar até você configurar."
    );
    console.warn("  Veja backend/.env.example para instruções.\n");
  }
});
