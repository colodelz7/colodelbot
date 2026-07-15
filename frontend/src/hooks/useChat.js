import { useState, useCallback } from 'react';
import { enviarMensagemStream, gerarTitulo } from '../lib/api';
import { TAMANHO_MAX_HISTORICO, resumir, FRASES_RATE_LIMIT } from '../lib/utils';

export function useChat({ conv, robot, memories, settings, mostrarToast }) {
  const [aguardando, setAguardando] = useState(false);
  const [streamText, setStreamText] = useState(null); // texto parcial em construção

  // Recebe os dados da mensagem já prontos (não relê o estado da conversa,
  // que pode ainda não ter sido atualizado no momento da chamada).
  const solicitarResposta = useCallback(async (mensagemTexto, imagem, historicoAnterior, conversaId) => {
    const historicoParaEnviar = historicoAnterior.slice(-TAMANHO_MAX_HISTORICO)
      .map((m) => ({ role: m.role, text: m.text }));

    setAguardando(true);
    robot.marcarAguardando(true);
    robot.resetarTimerSono();
    robot.setRobotState('pensando');
    setStreamText('');

    try {
      const textoFinal = await enviarMensagemStream({
        mensagem: mensagemTexto,
        historico: historicoParaEnviar,
        imagem: imagem ? { mimeType: imagem.mimeType, data: imagem.data } : undefined,
        personalidade: settings.personality,
        memorias: memories.memorias,
      }, {
        onDelta: (acumulado) => {
          robot.setRobotState('falando');
          setStreamText(acumulado);
        },
        onFim: (textoCompleto, memoria) => {
          if (memoria) memories.adicionar(memoria, mostrarToast);
        },
      });

      robot.setRobotState('falando');
      setStreamText(null);
      conv.adicionarMensagem('bot', textoFinal);
      robot.setSpeech(resumir(textoFinal, 90));
      robot.setMood('feliz');
      robot.setRobotState('idle');
      robot.tocarBip();
      robot._dispararFaiscas?.();

      // gera título só na primeira troca (nenhuma mensagem de usuário antes desta)
      if (historicoAnterior.filter((m) => m.role === 'user').length === 0) {
        gerarTitulo(mensagemTexto, null).then((titulo) => {
          if (titulo) conv.setTituloConversa(conversaId, titulo);
        });
      }
    } catch (erro) {
      setStreamText(null);
      const mensagemErro = erro.message || 'Não consegui me conectar agora.';
      conv.adicionarMensagem('bot', mensagemErro, { erro: true });
      if (erro.codigo === 'RATE_LIMIT') {
        robot.setMood('bravo');
        robot.setSpeech(FRASES_RATE_LIMIT[Math.floor(Math.random() * FRASES_RATE_LIMIT.length)]);
      } else {
        robot.setMood('triste');
        robot.setSpeech('Ops, deu ruim aqui 🔧');
      }
      robot.setRobotState('idle');
    } finally {
      setAguardando(false);
      robot.marcarAguardando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv, robot, memories, settings, mostrarToast]);

  const enviarMensagem = useCallback((texto, imagem, extras = {}) => {
    if (aguardando || !texto || !texto.trim()) return;
    const textoLimpo = texto.trim();
    const conversa = conv.conversaAtiva();
    const conversaId = conversa.id;
    const historicoAnterior = conversa.messages; // estado ANTES de adicionar a nova mensagem

    conv.adicionarMensagem('user', textoLimpo, { image: imagem || undefined, edited: extras.edited || undefined });
    solicitarResposta(textoLimpo, imagem, historicoAnterior, conversaId);
  }, [aguardando, conv, solicitarResposta]);

  const confirmarEdicao = useCallback((indice, novoTexto, imagemOriginal) => {
    conv.truncarMensagensAPartirDe(indice);
    const conversa = conv.conversaAtiva();
    const historicoAnterior = conversa.messages.slice(0, indice);
    const conversaId = conversa.id;
    const textoLimpo = novoTexto.trim();
    conv.adicionarMensagem('user', textoLimpo, { image: imagemOriginal || undefined, edited: true });
    solicitarResposta(textoLimpo, imagemOriginal, historicoAnterior, conversaId);
  }, [conv, solicitarResposta]);

  const regenerar = useCallback(() => {
    if (aguardando) return;
    const conversa = conv.conversaAtiva();
    const ultima = conversa.messages[conversa.messages.length - 1];
    if (!ultima || ultima.role !== 'bot') return;
    const penultima = conversa.messages[conversa.messages.length - 2];
    if (!penultima || penultima.role !== 'user') return;

    const historicoAnterior = conversa.messages.slice(0, -2); // tudo antes da pergunta+resposta
    conv.removerUltimaMensagem();
    solicitarResposta(penultima.text, penultima.image || null, historicoAnterior, conversa.id);
  }, [aguardando, conv, solicitarResposta]);

  return { aguardando, streamText, enviarMensagem, confirmarEdicao, regenerar };
}