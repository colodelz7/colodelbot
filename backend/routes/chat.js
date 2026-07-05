const express = require("express");
const { gerarRespostaStream, gerarTitulo } = require("../services/geminiService");
const rateLimiter = require("../middleware/rateLimiter");

const router = express.Router();

const TAMANHO_MAX_HISTORICO = 12;
const TAMANHO_MAX_IMAGEM_BASE64 = 4 * 1024 * 1024; // ~4MB em base64

// -----------------------------------------------------------------------
// POST /api/chat — streaming (SSE) da resposta do Gemini
// -----------------------------------------------------------------------

router.post("/", rateLimiter, async (req, res) => {
  const { mensagem, historico, imagem, personalidade, memorias } = req.body;

  if (!mensagem || typeof mensagem !== "string" || !mensagem.trim()) {
    return res.status(400).json({ erro: "Envie uma mensagem válida." });
  }

  if (mensagem.length > 4000) {
    return res.status(400).json({ erro: "Mensagem muito longa (máximo de 4000 caracteres)." });
  }

  if (imagem && imagem.data && imagem.data.length > TAMANHO_MAX_IMAGEM_BASE64) {
    return res.status(400).json({ erro: "Imagem muito grande. Tente uma menor." });
  }

  const historicoSeguro = Array.isArray(historico)
    ? historico.slice(-TAMANHO_MAX_HISTORICO)
    : [];

  const memoriasSeguras = Array.isArray(memorias) ? memorias.slice(0, 40) : [];

  const contextoCompleto = [
    ...historicoSeguro,
    { role: "user", text: mensagem.trim() },
  ];

  // cabeçalhos de streaming — sem buffer, mantém a conexão aberta
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const enviarEvento = (tipo, payload) => {
    res.write(`data: ${JSON.stringify({ tipo, ...payload })}\n\n`);
  };

  try {
    const { texto, memoria } = await gerarRespostaStream(contextoCompleto, {
      imagem,
      personalidade,
      memorias: memoriasSeguras,
      onDelta: (trecho) => enviarEvento("delta", { trecho }),
    });

    enviarEvento("fim", { textoCompleto: texto, memoria: memoria || null });
  } catch (erro) {
    console.error("Erro na rota /api/chat:", erro.message);

    let mensagemErro = "Não consegui falar com o Gemini agora. Tente novamente em instantes.";
    if (erro.codigo === "SEM_API_KEY") {
      mensagemErro =
        "Chave da API do Gemini não configurada no servidor. Veja o README para configurar.";
    }

    enviarEvento("erro", { mensagem: mensagemErro });
  } finally {
    res.end();
  }
});

// -----------------------------------------------------------------------
// POST /api/title — gera um título curto pra conversa (não-streaming)
// -----------------------------------------------------------------------

router.post("/title", rateLimiter, async (req, res) => {
  const { mensagemUsuario, mensagemBot } = req.body;

  if (!mensagemUsuario) {
    return res.status(400).json({ erro: "Faltam dados pra gerar o título." });
  }

  const titulo = await gerarTitulo(
    String(mensagemUsuario).slice(0, 500),
    mensagemBot ? String(mensagemBot).slice(0, 500) : null
  );

  res.json({ titulo });
});

module.exports = router;
