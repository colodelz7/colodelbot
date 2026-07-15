export const API_BASE = import.meta.env.VITE_API_BASE || '';

export async function gerarTitulo(mensagemUsuario, mensagemBot) {
  try {
    const resposta = await fetch(`${API_BASE}/api/chat/title`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensagemUsuario, mensagemBot }),
    });
    const dados = await resposta.json().catch(() => ({}));
    return dados.titulo || null;
  } catch {
    return null;
  }
}

/**
 * Envia mensagem e consome o streaming SSE de /api/chat.
 * callbacks: { onDelta(trecho), onFim(textoCompleto, memoria), onErro(mensagem) }
 */
export async function enviarMensagemStream({ mensagem, historico, imagem, personalidade, memorias }, callbacks) {
  const { onDelta, onFim } = callbacks;

  const resposta = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mensagem, historico, imagem, personalidade, memorias }),
  });

  if (resposta.status === 429) {
    const dados = await resposta.json().catch(() => ({}));
    const erro = new Error(dados.erro || 'Limite de mensagens atingido.');
    erro.codigo = 'RATE_LIMIT';
    throw erro;
  }

  if (!resposta.ok || !resposta.body) {
    const dados = await resposta.json().catch(() => ({}));
    throw new Error(dados.erro || 'Não consegui falar com o Gemini agora.');
  }

  const leitor = resposta.body.getReader();
  const decodificador = new TextDecoder();
  let buffer = '';
  let textoAcumulado = '';

  while (true) {
    const { value, done } = await leitor.read();
    if (done) break;
    buffer += decodificador.decode(value, { stream: true });

    let corte;
    while ((corte = buffer.indexOf('\n\n')) !== -1) {
      const bloco = buffer.slice(0, corte);
      buffer = buffer.slice(corte + 2);

      const linhaDados = bloco.split('\n').find((l) => l.startsWith('data:'));
      if (!linhaDados) continue;
      const jsonTexto = linhaDados.slice(5).trim();
      if (!jsonTexto) continue;

      let evento;
      try { evento = JSON.parse(jsonTexto); } catch { continue; }

      if (evento.tipo === 'delta') {
        textoAcumulado += evento.trecho;
        onDelta?.(textoAcumulado, evento.trecho);
      } else if (evento.tipo === 'fim') {
        textoAcumulado = evento.textoCompleto || textoAcumulado;
        onFim?.(textoAcumulado, evento.memoria || null);
      } else if (evento.tipo === 'erro') {
        throw new Error(evento.mensagem);
      }
    }
  }

  if (!textoAcumulado) throw new Error('O ColodelBot não respondeu nada. Tenta de novo.');
  return textoAcumulado;
}
