export default function Toast({ message, kind = "error", onDismiss }) {
  if (!message) return null;
  return (
    <div className={`toast toast-${kind}`} role="status">
      <span>{message}</span>
      <button className="toast-close" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
