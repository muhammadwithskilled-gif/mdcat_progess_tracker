const OPTIONS = [
  { value: "not_started", label: "Not started" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
];

export default function StatusToggle({ status, onChange, disabled }) {
  return (
    <div className={`status-toggle status-${status}`} role="group" aria-label="Topic status">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          className={`status-btn status-btn-${opt.value} ${status === opt.value ? "is-active" : ""}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
