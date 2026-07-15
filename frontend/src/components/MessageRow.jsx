import { useState } from 'react';
import { renderMarkdown } from '../lib/markdown';
import { formatarHora } from '../lib/utils';

export default function MessageRow({ msg, indice, ehUltimoBot, onCopiar, onEditar, onRegenerar }) {
  const ehUsuario = msg.role === 'user';
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState(msg.text);

  if (editando) {
    return (
      <div className={`msg-row msg-row--${ehUsuario ? 'user' : 'bot'}`}>
        <div className={`avatar avatar--${ehUsuario ? 'user' : 'bot'}`}>{ehUsuario ? 'EU' : 'CB'}</div>
        <div className="msg-col">
          <textarea className="msg-edit-area" value={rascunho} onChange={(e) => setRascunho(e.target.value)} autoFocus />
          <div className="msg-edit-actions">
            <button type="button" onClick={() => setEditando(false)}>Cancelar</button>
            <button type="button" className="primary" onClick={() => {
              const texto = rascunho.trim();
              if (!texto) return;
              setEditando(false);
              onEditar(indice, texto, msg.image || null);
            }}>Salvar e reenviar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`msg-row msg-row--${ehUsuario ? 'user' : 'bot'}`}>
      <div className={`avatar avatar--${ehUsuario ? 'user' : 'bot'}`}>{ehUsuario ? 'EU' : 'CB'}</div>
      <div className="msg-col">
        <div className={`msg msg--${msg.erro ? 'error' : ehUsuario ? 'user' : 'bot'}${msg.streaming ? ' msg--streaming' : ''}`}>
          {msg.image && <img className="msg__image" src={`data:${msg.image.mimeType};base64,${msg.image.data}`} alt="Imagem enviada" />}
          {ehUsuario || msg.erro
            ? <span className="msg__content">{msg.text}</span>
            : <span className="msg__content" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />}
          <span className="msg__meta">{formatarHora(msg.time)}{msg.edited ? ' · editada' : ''}</span>
        </div>
        <div className="msg-actions">
          <button aria-label="Copiar mensagem" onClick={() => onCopiar(msg.text)}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M16 8V6C16 4.9 15.1 4 14 4H6C4.9 4 4 4.9 4 6V14C4 15.1 4.9 16 6 16H8" stroke="currentColor" strokeWidth="1.6"/></svg>
          </button>
          {ehUsuario && (
            <button aria-label="Editar mensagem" onClick={() => setEditando(true)}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none"><path d="M4 20L4.6 16.8L16 5.4C16.6 4.8 17.6 4.8 18.2 5.4L18.6 5.8C19.2 6.4 19.2 7.4 18.6 8L7.2 19.4L4 20Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
            </button>
          )}
          {ehUltimoBot && (
            <button aria-label="Regenerar resposta" onClick={onRegenerar}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none"><path d="M4 12A8 8 0 1 1 6.5 17.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M4 8V13H9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
