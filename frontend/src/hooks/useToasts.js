import { useState, useCallback, useRef } from 'react';

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const mostrarToast = useCallback((texto) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, texto, leaving: false }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 220);
    }, 2600);
  }, []);

  return { toasts, mostrarToast };
}
