const PRESETS = [
  { label: 'Padrão', value: '' },
  { label: 'Engraçado', value: 'Seja bem-humorado e use piadas leves nas respostas.' },
  { label: 'Formal', value: 'Seja formal, profissional e educado, evite gírias.' },
  { label: 'Direto', value: 'Seja extremamente direto e objetivo, sem rodeios.' },
  { label: 'Motivador', value: 'Seja motivacional e encorajador, como um mentor.' },
];

export default function SettingsModal({ open, onClose, settings, updateSettings, memories }) {
  if (!open) return null;
  const { memorias, remover, limpar } = memories;

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-label="Configurações">
        <div className="modal__head">
          <h2>Configurações</h2>
          <button className="icon-btn" aria-label="Fechar" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none"><path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="modal__body">
          <div className="modal__group">
            <label className="modal__label">Personalidade do ColodelBot</label>
            <div className="preset-grid">
              {PRESETS.map((p) => (
                <button
                  key={p.label} type="button"
                  className={`preset-btn${settings.personality === p.value ? ' is-selected' : ''}`}
                  onClick={() => updateSettings({ personality: p.value })}
                >{p.label}</button>
              ))}
            </div>
            <textarea
              className="modal__textarea" rows="3"
              placeholder="Ou escreva um estilo personalizado aqui..."
              value={settings.personality}
              onChange={(e) => updateSettings({ personality: e.target.value })}
            />
          </div>

          <div className="modal__group">
            <div className="modal__row">
              <label className="modal__label" htmlFor="soundToggle">Som ao responder</label>
              <label className="switch">
                <input
                  type="checkbox" id="soundToggle" checked={settings.soundOn}
                  onChange={(e) => updateSettings({ soundOn: e.target.checked })}
                />
                <span className="switch__track"><span className="switch__thumb"></span></span>
              </label>
            </div>
          </div>

          <div className="modal__group">
            <label className="modal__label">Memórias salvas (<span>{memorias.length}</span>)</label>
            <p className="modal__hint">Fatos que o ColodelBot aprendeu sobre você em conversas anteriores.</p>
            <div className="memory-list">
              {memorias.length === 0 ? (
                <div className="memory-empty">Nenhuma memória ainda. Converse um pouco que eu aprendo!</div>
              ) : memorias.map((fato, i) => (
                <div className="memory-item" key={i}>
                  <span>{fato}</span>
                  <button aria-label="Excluir memória" onClick={() => remover(i)}>
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none"><path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                </div>
              ))}
            </div>
            <button className="link-btn" onClick={limpar} disabled={memorias.length === 0}>Apagar todas as memórias</button>
          </div>
        </div>
      </div>
    </div>
  );
}
