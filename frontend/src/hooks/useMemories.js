import { useState, useCallback } from 'react';
import { STORAGE_MEMORY } from '../lib/utils';

function carregar() {
  try {
    const bruto = localStorage.getItem(STORAGE_MEMORY);
    const dados = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(dados) ? dados : [];
  } catch { return []; }
}

function salvar(lista) {
  try { localStorage.setItem(STORAGE_MEMORY, JSON.stringify(lista)); } catch { /* ignora */ }
}

export function useMemories() {
  const [memorias, setMemorias] = useState(carregar);

  const adicionar = useCallback((fato, onToast) => {
    setMemorias((prev) => {
      if (!fato || prev.includes(fato)) return prev;
      const next = [...prev, fato];
      if (next.length > 60) next.shift();
      salvar(next);
      onToast?.(`Nova memória salva: "${fato.length > 44 ? fato.slice(0, 44) + '…' : fato}"`);
      return next;
    });
  }, []);

  const remover = useCallback((indice) => {
    setMemorias((prev) => {
      const next = prev.filter((_, i) => i !== indice);
      salvar(next);
      return next;
    });
  }, []);

  const limpar = useCallback(() => {
    setMemorias([]);
    salvar([]);
  }, []);

  return { memorias, adicionar, remover, limpar };
}
