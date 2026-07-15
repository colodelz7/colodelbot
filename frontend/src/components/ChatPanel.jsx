import { useRef, useEffect, useState } from 'react';
import MessageRow from './MessageRow';
import { redimensionarImagem } from '../lib/utils';

const SUGESTOES = [
  { msg: 'Explique o que é uma API REST', label: 'O que é uma API REST?' },
  { msg: 'Quem foi campeão da última Copa do Mundo?', label: 'Última Copa do Mundo?' },
  { msg: 'Me dê uma dica pra produtividade estudando programação', label: 'Dica de produtividade' },
  { msg: 'Me conte uma curiosidade sobre o universo', label: 'Curiosidade do universo' },
];

export default function ChatPanel({ conversa, chat, onToast, onResetSono }) {
  const chatLogRef = useRef(null);
  const inputRef = useRef(null);
  const imageInputRef = useRef(null);
  const [texto, setTexto] = useState('');
  const [anexo, setAnexo] = useState(null); // { mimeType, data, previewUrl }

  const mensagens = conversa.messages;
  const streaming = chat.streamText !== null;

  useEffect(() => {
    if (chatLogRef.current) chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
  }, [mensagens.length, chat.streamText]);

  useEffect(() => {
    if (chatLogRef.current) chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
  }, [conversa.id]);

  function ajustarAltura(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  function onSubmit(e) {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    chat.enviarMensagem(t, anexo);
    setTexto('');
    setAnexo(null);
    if (inputRef.current) inputRef.current.style.height = 'auto';
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
    onResetSono();
  }

  async function onImageChange(e) {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    if (!arquivo.type.startsWith('image/')) { onToast('Só é possível anexar imagens'); return; }
    try {
      const { dataUrl, base64, mimeType } = await redimensionarImagem(arquivo);
      setAnexo({ mimeType, data: base64, previewUrl: dataUrl });
    } catch {
      onToast('Não consegui processar essa imagem');
    }
    e.target.value = '';
  }

  function onCopiar(texto) {
    navigator.clipboard.writeText(texto).then(() => onToast('Mensagem copiada'));
  }

  const temPerguntaDoUsuario = mensagens.some((m) => m.role === 'user');

  function onChatLogClick(e) {
    const botao = e.target.closest('.code-block__copy');
    if (!botao) return;
    const codigo = botao.closest('.code-block').querySelector('code').textContent;
    navigator.clipboard.writeText(codigo).then(() => onToast('Código copiado'));
  }

  return (
    <section className="chat-panel" aria-label="Conversa com o ColodelBot">
      <div className="chat-log" ref={chatLogRef} onClick={onChatLogClick}>
        {mensagens.map((msg, indice) => {
          const ehUltimoBot = msg.role === 'bot' && !msg.erro && indice === mensagens.length - 1 && !streaming;
          return (
            <MessageRow
              key={indice} msg={msg} indice={indice} ehUltimoBot={ehUltimoBot}
              onCopiar={onCopiar}
              onEditar={chat.confirmarEdicao}
              onRegenerar={chat.regenerar}
            />
          );
        })}
        {streaming && (
          <MessageRow
            msg={{ role: 'bot', text: chat.streamText, time: Date.now(), streaming: true }}
            indice={mensagens.length} ehUltimoBot={false}
            onCopiar={onCopiar} onEditar={() => {}} onRegenerar={() => {}}
          />
        )}
      </div>

      {!temPerguntaDoUsuario && (
        <div className="suggestions">
          {SUGESTOES.map((s) => (
            <button key={s.label} className="chip" onClick={() => chat.enviarMensagem(s.msg, null)}>{s.label}</button>
          ))}
        </div>
      )}

      {anexo && (
        <div className="image-preview">
          <img src={anexo.previewUrl} alt="Prévia da imagem anexada" />
          <button aria-label="Remover imagem" onClick={() => setAnexo(null)}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none"><path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
      )}

      <form className="composer" onSubmit={onSubmit}>
        <input type="file" ref={imageInputRef} accept="image/*" hidden onChange={onImageChange} />
        <button type="button" className="icon-btn composer__attach" aria-label="Anexar imagem" title="Anexar imagem" onClick={() => imageInputRef.current.click()}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d="M21 12.5L12.5 21C10 23.5 6 23.5 3.5 21C1 18.5 1 14.5 3.5 12L13 2.5C14.7 0.8 17.5 0.8 19.2 2.5C20.9 4.2 20.9 7 19.2 8.7L10.2 17.7C9.3 18.6 7.9 18.6 7 17.7C6.1 16.8 6.1 15.4 7 14.5L15 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <textarea
          ref={inputRef} className="composer__input" placeholder="Pergunte alguma coisa ao ColodelBot..."
          rows="1" maxLength={4000} autoComplete="off"
          value={texto}
          onChange={(e) => { setTexto(e.target.value); ajustarAltura(e.target); }}
          onKeyDown={onKeyDown}
        />
        <button type="submit" className={`composer__send${chat.aguardando ? ' is-sending' : ''}`} aria-label="Enviar mensagem" disabled={chat.aguardando}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><path d="M3 11.5L20.5 3L12.5 20.5L10.5 13L3 11.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round"/></svg>
        </button>
      </form>
    </section>
  );
}
