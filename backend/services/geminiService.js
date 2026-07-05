// Serviço responsável por conversar com a API do Gemini (Google AI Studio).

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const PERSONA_BASE = `
Você é o ColodelBot, um assistente virtual de propósito geral. Você é
simpático, direto e fala em português do Brasil. Você pode responder
QUALQUER pergunta: dúvidas gerais, programação, curiosidades, esportes,
história, o que for.

Se dados reais forem fornecidos no contexto da mensagem, use-os na resposta
em vez de inventar números.

Mantenha as respostas curtas e objetivas (no máximo 2-3 parágrafos curtos),
a menos que o usuário peça uma explicação mais detalhada. Pode usar
markdown (negrito, listas, blocos de código) quando ajudar a organizar a
resposta.
`.trim();

const INSTRUCAO_MEMORIA = `
Se, e somente se, o usuário compartilhar uma informação pessoal ESTÁVEL
sobre si mesmo (nome, profissão, projeto em que trabalha, preferência
duradoura, etc — não um pedido pontual), adicione ao final da sua resposta,
em uma linha própria, exatamente neste formato:
[[MEM: resumo curto do fato em terceira pessoa]]
Use no máximo uma tag dessas por resposta. Nunca explique essa tag pro
usuário, nunca a mencione, e não use isso pra fatos triviais ou perguntas
únicas.
`.trim();

function montarInstrucaoSistema({ personalidade, memorias } = {}) {
  let instrucao = PERSONA_BASE + "\n\n" + INSTRUCAO_MEMORIA;

  if (Array.isArray(memorias) && memorias.length > 0) {
    const lista = memorias.map((m) => `- ${m}`).join("\n");
    instrucao += `\n\nFatos que você já sabe sobre este usuário:\n${lista}`;
  }

  if (personalidade && personalidade.trim()) {
    instrucao += `\n\nEstilo/personalidade pedido pelo usuário: ${personalidade.trim()}.`;
  }

  return instrucao;
}

function montarConteudo(historico, imagem) {
  return historico.map((msg, indice) => {
    const parts = [{ text: msg.text }];

    const ehUltima = indice === historico.length - 1;

    if (ehUltima && msg.role === "user" && imagem && imagem.data) {
      parts.push({
        inlineData: {
          mimeType: imagem.mimeType || "image/jpeg",
          data: imagem.data,
        },
      });
    }

    return {
      role: msg.role === "bot" ? "model" : "user",
      parts,
    };
  });
}

function extrairMemoria(texto) {
  const regex = /\n?\[\[MEM:\s*(.+?)\s*\]\]\s*$/i;
  const encontrado = texto.match(regex);

  if (!encontrado) {
    return { textoLimpo: texto, memoria: null };
  }

  return {
    textoLimpo: texto.replace(regex, "").trim(),
    memoria: encontrado[1],
  };
}

async function gerarRespostaStream(
  historico,
  { imagem, personalidade, memorias, onDelta } = {}
) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const erro = new Error(
      "GEMINI_API_KEY não configurada. Adicione sua chave no arquivo backend/.env."
    );
    erro.codigo = "SEM_API_KEY";
    throw erro;
  }

  const url = `${BASE_URL}/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const corpo = {
    contents: montarConteudo(historico, imagem),
    systemInstruction: {
      parts: [{ text: montarInstrucaoSistema({ personalidade, memorias }) }],
    },
    generationConfig: {
      temperature: 0.85,
      maxOutputTokens: 800,
    },
  };

  const resposta = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });

  if (!resposta.ok || !resposta.body) {
    const detalhes = await resposta.text().catch(() => "");

    const erro = new Error(
      `Erro ao chamar a API do Gemini (status ${resposta.status}): ${detalhes}`
    );

    erro.codigo = "ERRO_GEMINI";
    erro.status = resposta.status;
    throw erro;
  }

  const leitor = resposta.body.getReader();
  const decodificador = new TextDecoder();

  let buffer = "";
  let textoCompleto = "";

  function processarBlocoSse(bloco) {
    const linhasDados = bloco
      .split(/\r?\n/)
      .filter((linha) => linha.startsWith("data:"));

    for (const linhaDados of linhasDados) {
      const json = linhaDados.slice(5).trim();

      if (!json || json === "[DONE]") continue;

      try {
        const evento = JSON.parse(json);
        const partes = evento?.candidates?.[0]?.content?.parts || [];

        for (const parte of partes) {
          const trechoTexto = parte?.text;

          if (trechoTexto) {
            textoCompleto += trechoTexto;

            if (onDelta) {
              onDelta(trechoTexto);
            }
          }
        }
      } catch {
        // Ignora fragmentos inválidos sem derrubar a conversa.
      }
    }
  }

  while (true) {
    const { value, done } = await leitor.read();

    if (done) break;

    buffer += decodificador.decode(value, { stream: true });

    // Corrige o problema do stream vindo com \r\n\r\n em vez de apenas \n\n.
    buffer = buffer.replace(/\r\n/g, "\n");

    let indiceQuebra;

    while ((indiceQuebra = buffer.indexOf("\n\n")) !== -1) {
      const bloco = buffer.slice(0, indiceQuebra);
      buffer = buffer.slice(indiceQuebra + 2);

      processarBlocoSse(bloco);
    }
  }

  if (buffer.trim()) {
    processarBlocoSse(buffer);
  }

  if (!textoCompleto) {
    const erro = new Error(
      "O Gemini respondeu, mas nenhum texto foi encontrado no stream. Confira se o modelo configurado no .env está disponível para sua chave."
    );

    erro.codigo = "SEM_TEXTO";
    throw erro;
  }

  const { textoLimpo, memoria } = extrairMemoria(textoCompleto);

  return {
    texto: textoLimpo,
    memoria,
  };
}

async function gerarTitulo(mensagemUsuario, mensagemBot) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return null;

  const url = `${BASE_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const prompt = mensagemBot
    ? `Resuma o assunto da conversa abaixo em no máximo 4 palavras, sem pontuação final e sem aspas. Responda só com o título.

Usuário: ${mensagemUsuario}
Assistente: ${mensagemBot}

Título:`
    : `Resuma o assunto da mensagem abaixo em no máximo 4 palavras, sem pontuação final e sem aspas. Responda só com o título, sem explicações.

Mensagem: ${mensagemUsuario}

Título:`;

  try {
    const resposta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 20,
        },
      }),
    });

    if (!resposta.ok) return null;

    const dados = await resposta.json();
    const texto = dados?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!texto) return null;

    return texto.trim().replace(/^["'.]+|["'.]+$/g, "").slice(0, 42);
  } catch {
    return null;
  }
}

module.exports = {
  gerarRespostaStream,
  gerarTitulo,
};