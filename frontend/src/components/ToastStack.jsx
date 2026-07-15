export default function ToastStack({ toasts }) {
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div className={`toast${t.leaving ? ' is-leaving' : ''}`} key={t.id}>
          <span className="toast__dot"></span><span>{t.texto}</span>
        </div>
      ))}
    </div>
  );
}
