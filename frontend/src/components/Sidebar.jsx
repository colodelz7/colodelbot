import { useState, useEffect, useRef } from 'react';
import ConversationItem from './ConversationItem';
import ContextMenu from './ContextMenu';

export default function Sidebar({ conv, onToast }) {
  const { state, trocarConversa, novaConversaAcao, moverParaLixeira, restaurarConversa,
    excluirDefinitivamente, alternarFixar, duplicarConversa, renomearConversa,
    exportarConversa, bulkDelete } = conv;

  const [termo, setTermo] = useState('');
  const [modoSelecao, setModoSelecao] = useState(false);
  const [selecionadas, setSelecionadas] = useState(new Set());
  const [trashOpen, setTrashOpen] = useState(false);
  const [menu, setMenu] = useState({ hidden: true, x: 0, y: 0, id: null });
  const menuRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!menu.hidden && menuRef.current && !menuRef.current.contains(e.target)) {
        setMenu((m) => ({ ...m, hidden: true }));
      }
    }
    function onKeyDown(e) { if (e.key === 'Escape') setMenu((m) => ({ ...m, hidden: true })); }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menu.hidden]);

  const termoLower = termo.trim().toLowerCase();
  const ativas = state.conversations.filter((c) => !c.deletedAt);
  const apagadas = state.conversations.filter((c) => c.deletedAt);
  const filtrar = (lista) => termoLower
    ? lista.filter((c) => c.title.toLowerCase().includes(termoLower) ||
        c.messages.some((m) => m.text && m.text.toLowerCase().includes(termoLower)))
    : lista;

  const fixadas = filtrar(ativas.filter((c) => c.pinned)).sort((a, b) => b.updatedAt - a.updatedAt);
  const recentes = filtrar(ativas.filter((c) => !c.pinned)).sort((a, b) => b.updatedAt - a.updatedAt);
  const lixeira = filtrar(apagadas).sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));

  function toggleSelect(id) {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function abrirMenu(x, y, id) {
    const larguraJanela = window.innerWidth, alturaJanela = window.innerHeight;
    setMenu({
      hidden: false, id,
      x: Math.min(x, larguraJanela - 178), y: Math.min(y, alturaJanela - 198),
    });
  }

  function onMenuAction(acao) {
    const id = menu.id;
    setMenu((m) => ({ ...m, hidden: true }));
    if (!id) return;
    if (acao === 'rename') {
      const conversa = state.conversations.find((c) => c.id === id);
      const novo = prompt('Novo nome da conversa:', conversa ? conversa.title : '');
      if (novo !== null) renomearConversa(id, novo);
    } else if (acao === 'pin') { alternarFixar(id, onToast); }
    else if (acao === 'duplicate') duplicarConversa(id, onToast);
    else if (acao === 'export') exportarConversa(id, onToast);
    else if (acao === 'delete') moverParaLixeira(id, onToast);
  }

  const menuConversa = state.conversations.find((c) => c.id === menu.id);

  function renderLista(lista, ehLixeira) {
    return lista.map((c) => (
      <ConversationItem
        key={c.id} conversa={c} ehLixeira={ehLixeira} ativa={c.id === state.activeId}
        modoSelecao={modoSelecao} selecionada={selecionadas.has(c.id)}
        onClick={trocarConversa} onToggleSelect={toggleSelect}
        onContextMenu={abrirMenu}
        onRestaurar={(id) => restaurarConversa(id, onToast)}
        onExcluirDefinitivo={(id) => excluirDefinitivamente(id, onToast)}
        onMoverLixeira={(id) => moverParaLixeira(id, onToast)}
      />
    ));
  }

  return (
    <aside className="sidebar" id="sidebar">
      <button className="new-chat" onClick={() => novaConversaAcao()}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true"><path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        Nova conversa
      </button>

      <div className="sidebar__search">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/><path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        <input type="text" placeholder="Buscar conversas..." autoComplete="off" value={termo} onChange={(e) => setTermo(e.target.value)} />
      </div>

      <button
        className={`select-mode-btn${modoSelecao ? ' is-active' : ''}`}
        onClick={() => { setModoSelecao((m) => !m); setSelecionadas(new Set()); }}
      >
        {modoSelecao ? 'Cancelar' : 'Selecionar'}
      </button>

      <div className="sidebar__scroll">
        <div className="sidebar__section">
          <div className="sidebar__section-title">FIXADAS</div>
          <div className="sidebar__list">{renderLista(fixadas, false)}</div>
        </div>
        <div className="sidebar__section">
          <div className="sidebar__section-title">CONVERSAS</div>
          <div className="sidebar__list">{renderLista(recentes, false)}</div>
        </div>
        <div className="sidebar__section">
          <button
            className={`sidebar__section-title sidebar__section-title--toggle${trashOpen ? ' is-open' : ''}`}
            onClick={() => setTrashOpen((o) => !o)}
          >
            <span>LIXEIRA</span>
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none"><path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          {trashOpen && <div className="sidebar__list">{renderLista(lixeira, true)}</div>}
        </div>
      </div>

      {modoSelecao && selecionadas.size > 0 && (
        <div className="bulk-bar">
          <span>{selecionadas.size} selecionada{selecionadas.size === 1 ? '' : 's'}</span>
          <button onClick={() => {
            bulkDelete([...selecionadas], onToast);
            setSelecionadas(new Set());
            setModoSelecao(false);
          }}>Excluir</button>
          <button onClick={() => { setModoSelecao(false); setSelecionadas(new Set()); }}>Cancelar</button>
        </div>
      )}

      <div className="sidebar__foot">
        <span className="sidebar__foot-dot" aria-hidden="true"></span>
        salvo neste navegador
      </div>

      <div ref={menuRef}>
        <ContextMenu x={menu.x} y={menu.y} hidden={menu.hidden} pinned={menuConversa?.pinned} onAction={onMenuAction} />
      </div>
    </aside>
  );
}
