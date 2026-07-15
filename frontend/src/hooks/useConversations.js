import { useState, useCallback, useRef, useEffect } from 'react';
import {
  STORAGE_CONVERSAS, DIAS_ATE_PURGAR_LIXEIRA, gerarId, novaConversa, resumir,
} from '../lib/utils';

function carregar() {
  try {
    const bruto = localStorage.getItem(STORAGE_CONVERSAS);
    if (!bruto) return null;
    const dados = JSON.parse(bruto);
    if (!dados || !Array.isArray(dados.conversations)) return null;
    return dados;
  } catch { return null; }
}

function purgarLixeiraAntiga(state) {
  const limiteMs = DIAS_ATE_PURGAR_LIXEIRA * 24 * 60 * 60 * 1000;
  const agora = Date.now();
  const conversations = state.conversations.filter(
    (c) => !c.deletedAt || agora - c.deletedAt < limiteMs
  );
  let activeId = state.activeId;
  if (!conversations.some((c) => c.id === activeId)) {
    const disponivel = conversations.find((c) => !c.deletedAt);
    if (disponivel) {
      activeId = disponivel.id;
    } else {
      const conversa = novaConversa();
      conversations.push(conversa);
      activeId = conversa.id;
    }
  }
  return { activeId, conversations };
}

function estadoInicial() {
  const carregado = carregar();
  const conversaNova = novaConversa();

  if (carregado) {
    const purgado = purgarLixeiraAntiga(carregado);
    return { activeId: conversaNova.id, conversations: [...purgado.conversations, conversaNova] };
  }

  return { activeId: conversaNova.id, conversations: [conversaNova] };
}

export function useConversations() {
  const [state, setState] = useState(estadoInicial);
  const stateRef = useRef(state);
  stateRef.current = state;

  const persist = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try { localStorage.setItem(STORAGE_CONVERSAS, JSON.stringify(next)); } catch { /* cheio ou bloqueado */ }
      return next;
    });
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_CONVERSAS, JSON.stringify(stateRef.current)); } catch { /* cheio ou bloqueado */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const conversaAtiva = useCallback(() => {
    return state.conversations.find((c) => c.id === state.activeId) || state.conversations[0];
  }, [state]);

  const trocarConversa = useCallback((id) => {
    persist((prev) => ({ ...prev, activeId: id }));
  }, [persist]);

  const novaConversaAcao = useCallback(() => {
    const conversa = novaConversa();
    persist((prev) => ({ activeId: conversa.id, conversations: [...prev.conversations, conversa] }));
    return conversa;
  }, [persist]);

  const moverParaLixeira = useCallback((id, onToast) => {
    persist((prev) => {
      const conversations = prev.conversations.map((c) =>
        c.id === id ? { ...c, deletedAt: Date.now(), pinned: false } : c
      );
      let activeId = prev.activeId;
      if (activeId === id) {
        const proxima = conversations.find((c) => !c.deletedAt);
        if (proxima) activeId = proxima.id;
        else { const nova = novaConversa(); conversations.push(nova); activeId = nova.id; }
      }
      return { activeId, conversations };
    });
    onToast?.('Conversa movida pra lixeira');
  }, [persist]);

  const restaurarConversa = useCallback((id, onToast) => {
    persist((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) =>
        c.id === id ? { ...c, deletedAt: null, updatedAt: Date.now() } : c
      ),
    }));
    onToast?.('Conversa restaurada');
  }, [persist]);

  const excluirDefinitivamente = useCallback((id, onToast) => {
    persist((prev) => ({ ...prev, conversations: prev.conversations.filter((c) => c.id !== id) }));
    onToast?.('Conversa excluída definitivamente');
  }, [persist]);

  const alternarFixar = useCallback((id, onToast) => {
    let ficouFixada = false;
    persist((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) => {
        if (c.id !== id) return c;
        ficouFixada = !c.pinned;
        return { ...c, pinned: !c.pinned };
      }),
    }));
    setTimeout(() => onToast?.(ficouFixada ? 'Conversa fixada' : 'Conversa desafixada'), 0);
  }, [persist]);

  const duplicarConversa = useCallback((id, onToast) => {
    persist((prev) => {
      const original = prev.conversations.find((c) => c.id === id);
      if (!original) return prev;
      const copia = {
        ...original, id: gerarId(), title: original.title + ' (cópia)',
        pinned: false, deletedAt: null, createdAt: Date.now(), updatedAt: Date.now(),
        messages: original.messages.map((m) => ({ ...m })),
      };
      return { activeId: copia.id, conversations: [...prev.conversations, copia] };
    });
    onToast?.('Conversa duplicada');
  }, [persist]);

  const renomearConversa = useCallback((id, novoTitulo) => {
    if (!novoTitulo || !novoTitulo.trim()) return;
    persist((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) =>
        c.id === id ? { ...c, title: novoTitulo.trim().slice(0, 60), titleAuto: false } : c
      ),
    }));
  }, [persist]);

  const exportarConversa = useCallback((id, onToast) => {
    const conversa = stateRef.current.conversations.find((c) => c.id === id);
    if (!conversa) return;
    const linhas = [`# ${conversa.title}`, ''];
    for (const m of conversa.messages) {
      const autor = m.role === 'user' ? '**Você**' : '**ColodelBot**';
      const hora = new Date(m.time).toLocaleString('pt-BR');
      linhas.push(`${autor} · _${hora}_`, '', m.text, '');
    }
    const blob = new Blob([linhas.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversa.title.replace(/[^\w-]+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    onToast?.('Conversa exportada');
  }, []);

  const bulkDelete = useCallback((ids, onToast) => {
    persist((prev) => {
      const idsSet = new Set(ids);
      const conversations = prev.conversations.map((c) =>
        idsSet.has(c.id) ? { ...c, deletedAt: Date.now(), pinned: false } : c
      );
      let activeId = prev.activeId;
      if (idsSet.has(activeId)) {
        const proxima = conversations.find((c) => !c.deletedAt);
        if (proxima) activeId = proxima.id;
        else { const nova = novaConversa(); conversations.push(nova); activeId = nova.id; }
      }
      return { activeId, conversations };
    });
    onToast?.(`${ids.length} conversa(s) movida(s) pra lixeira`);
  }, [persist]);

  // ----- ações sobre mensagens dentro da conversa ativa -----

  const adicionarMensagem = useCallback((role, texto, extras = {}) => {
    persist((prev) => {
      const agora = Date.now();
      const conversations = prev.conversations.map((c) => {
        if (c.id !== prev.activeId) return c;
        const novoTitulo = (role === 'user' && c.titleAuto && c.title === 'Nova conversa')
          ? resumir(texto, 34) : c.title;
        return {
          ...c,
          title: novoTitulo,
          updatedAt: agora,
          messages: [...c.messages, { role, text: texto, time: agora, ...extras }],
        };
      });
      return { ...prev, conversations };
    });
  }, [persist]);

  const truncarMensagensAPartirDe = useCallback((indice) => {
    persist((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) =>
        c.id === prev.activeId ? { ...c, messages: c.messages.slice(0, indice) } : c
      ),
    }));
  }, [persist]);

  const removerUltimaMensagem = useCallback(() => {
    persist((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) =>
        c.id === prev.activeId ? { ...c, messages: c.messages.slice(0, -1) } : c
      ),
    }));
  }, [persist]);

  const setTituloConversa = useCallback((id, titulo) => {
    persist((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) =>
        (c.id === id && c.titleAuto) ? { ...c, title: titulo } : c
      ),
    }));
  }, [persist]);

  return {
    state, stateRef, conversaAtiva,
    trocarConversa, novaConversaAcao, moverParaLixeira, restaurarConversa,
    excluirDefinitivamente, alternarFixar, duplicarConversa, renomearConversa,
    exportarConversa, bulkDelete, adicionarMensagem, truncarMensagensAPartirDe,
    removerUltimaMensagem, setTituloConversa,
  };
}