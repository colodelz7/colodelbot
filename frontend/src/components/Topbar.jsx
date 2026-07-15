export default function Topbar({ onToggleTheme, onToggleSidebar, onOpenSettings, statusTexto, busy }) {
  return (
    <header className="topbar">
      <div className="topbar__left">
        <button className="icon-btn sidebar-toggle" aria-label="Abrir conversas" onClick={onToggleSidebar}>
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" aria-hidden="true"><path d="M4 6H20M4 12H20M4 18H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </button>
        <div className="topbar__brand">
          <span className="topbar__dot" aria-hidden="true"></span>
          <span className="topbar__name">ColodelBot</span>
          <span className="topbar__tag">assistente virtual</span>
        </div>
      </div>
      <div className="topbar__right">
        <button className="icon-btn" aria-label="Alternar tema claro/escuro" title="Tema claro/escuro" onClick={onToggleTheme}>
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true"><path d="M12 3V5M12 19V21M5 12H3M21 12H19M6.3 6.3L4.9 4.9M19.1 19.1L17.7 17.7M6.3 17.7L4.9 19.1M19.1 4.9L17.7 6.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.7"/></svg>
        </button>
        <button className="icon-btn" aria-label="Configurações" title="Configurações" onClick={onOpenSettings}>
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true"><path d="M12 15.5A3.5 3.5 0 1 0 12 8.5A3.5 3.5 0 0 0 12 15.5Z" stroke="currentColor" strokeWidth="1.6"/><path d="M19.4 13.5C19.6 12.5 19.6 11.5 19.4 10.5L21.3 9L19.8 6.4L17.6 7.2C16.9 6.5 16 5.9 15.1 5.6L14.7 3.3H11.3L10.9 5.6C10 5.9 9.1 6.5 8.4 7.2L6.2 6.4L4.7 9L6.6 10.5C6.4 11.5 6.4 12.5 6.6 13.5L4.7 15L6.2 17.6L8.4 16.8C9.1 17.5 10 18.1 10.9 18.4L11.3 20.7H14.7L15.1 18.4C16 18.1 16.9 17.5 17.6 16.8L19.8 17.6L21.3 15L19.4 13.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
        </button>
        <div className="topbar__status">
          <span className={`status-dot${busy ? ' is-busy' : ''}${statusTexto === 'OFFLINE' ? ' is-offline' : ''}`}></span>
          <span>{statusTexto}</span>
        </div>
      </div>
    </header>
  );
}
