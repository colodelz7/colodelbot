import { tempoRelativo } from '../lib/utils';

const ICONES = {
  code: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none"><path d="M9 6L3 12L9 18M15 6L21 12L15 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  image: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="10" r="1.6" fill="currentColor"/><path d="M21 16L15.5 11L6 20" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  chat: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none"><path d="M4 5H20V16H8L4 20V5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
};

function iconeDaConversa(conversa) {
  if (conversa.messages.some((m) => m.image)) return ICONES.image;
  const primeira = conversa.messages.find((m) => m.role === 'user');
  if (primeira && /código|function|bug|javascript|python|programa|api|html|css|sql|git|typescript|react|node/i.test(primeira.text)) {
    return ICONES.code;
  }
  return ICONES.chat;
}

export default function ConversationItem({
  conversa, ehLixeira, ativa, modoSelecao, selecionada,
  onClick, onToggleSelect, onContextMenu, onRestaurar, onExcluirDefinitivo, onMoverLixeira,
}) {
  return (
    <div
      className={`conv-item${ativa ? ' is-active' : ''}${ehLixeira ? ' conv-item--trashed' : ''}`}
      style={{ position: 'relative' }}
      onClick={() => {
        if (ehLixeira) return;
        if (modoSelecao) onToggleSelect(conversa.id);
        else onClick(conversa.id);
      }}
      onContextMenu={(e) => {
        if (ehLixeira) return;
        e.preventDefault();
        onContextMenu(e.clientX, e.clientY, conversa.id);
      }}
    >
      {modoSelecao && !ehLixeira && (
        <input
          type="checkbox" className="conv-item__checkbox" checked={selecionada}
          onClick={(e) => e.stopPropagation()}
          onChange={() => onToggleSelect(conversa.id)}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
        <div className="conv-item__row">
          <span className="conv-item__icon" dangerouslySetInnerHTML={{ __html: iconeDaConversa(conversa) }} />
          <span className="conv-item__title">{conversa.title}</span>
          {conversa.pinned && !ehLixeira && (
            <span className="conv-item__pin">
              <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M12 2L14 8L20 9L15.5 13L17 20L12 16.5L7 20L8.5 13L4 9L10 8Z"/></svg>
            </span>
          )}
        </div>
        <span className="conv-item__time">
          {ehLixeira ? `apagada ${tempoRelativo(conversa.deletedAt)}` : tempoRelativo(conversa.updatedAt)}
        </span>
      </div>

      <div className="conv-item__actions">
        {ehLixeira ? (
          <>
            <button aria-label="Restaurar conversa" onClick={(e) => { e.stopPropagation(); onRestaurar(conversa.id); }}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none"><path d="M4 12A8 8 0 1 1 6.5 17.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M4 8V13H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button aria-label="Excluir definitivamente" onClick={(e) => { e.stopPropagation(); onExcluirDefinitivo(conversa.id); }}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none"><path d="M5 6H19M9 6V4H15V6M7 6L8 20H16L17 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </>
        ) : (
          <button aria-label="Mover pra lixeira" onClick={(e) => { e.stopPropagation(); onMoverLixeira(conversa.id); }}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none"><path d="M5 6H19M9 6V4H15V6M7 6L8 20H16L17 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}
      </div>
    </div>
  );
}
