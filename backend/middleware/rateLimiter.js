// Rate limiter simples em memória.
// Evita que a cota gratuita do Gemini seja consumida de forma abusiva.
// Não precisa de banco de dados nem de pacote externo: guarda as marcações
// de tempo de cada IP num Map e descarta as antigas a cada checagem.

const JANELA_MS = 10 * 60 * 1000; // janela de 10 minutos
const LIMITE_POR_JANELA = 45; // máximo de requisições por IP nessa janela (chat + título)

const historico = new Map();

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || "desconhecido";
  const agora = Date.now();

  const marcacoes = (historico.get(ip) || []).filter(
    (timestamp) => agora - timestamp < JANELA_MS
  );

  if (marcacoes.length >= LIMITE_POR_JANELA) {
    return res.status(429).json({
      erro:
        "Limite de mensagens atingido. Aguarde alguns minutos antes de continuar a conversa.",
    });
  }

  marcacoes.push(agora);
  historico.set(ip, marcacoes);
  next();
}

module.exports = rateLimiter;
