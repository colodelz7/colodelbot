export default function ContextMenu({ x, y, hidden, pinned, onAction }) {
  if (hidden) return null;
  return (
    <div className="context-menu" style={{ left: x, top: y }}>
      <button onClick={() => onAction('rename')}>Renomear</button>
      <button onClick={() => onAction('pin')}>{pinned ? 'Desafixar' : 'Fixar'}</button>
      <button onClick={() => onAction('duplicate')}>Duplicar</button>
      <button onClick={() => onAction('export')}>Exportar (.md)</button>
      <button className="context-menu__danger" onClick={() => onAction('delete')}>Excluir</button>
    </div>
  );
}
