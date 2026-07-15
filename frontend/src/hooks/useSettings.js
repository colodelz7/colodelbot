import { useState, useCallback } from 'react';
import { STORAGE_SETTINGS } from '../lib/utils';

function carregar() {
  try {
    const bruto = localStorage.getItem(STORAGE_SETTINGS);
    const dados = bruto ? JSON.parse(bruto) : {};
    return {
      theme: dados.theme === 'light' ? 'light' : 'dark',
      personality: typeof dados.personality === 'string' ? dados.personality : '',
      soundOn: dados.soundOn !== false,
    };
  } catch {
    return { theme: 'dark', personality: '', soundOn: true };
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(carregar);

  const update = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(next)); } catch { /* ignora */ }
      return next;
    });
  }, []);

  return [settings, update];
}
