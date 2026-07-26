export default function TopNav({ page, onChange }) {
  const tabs = [
    { key: "syllabus", label: "Syllabus Tracker" },
    { key: "challenge", label: "20-Day Challenge" },
  ];
  return (
    <div className="top-nav">
      <div className="top-nav-inner">
        <span className="top-nav-brand">MDCAT Preparation | 2026</span>
        <nav className="top-nav-tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`top-nav-tab ${page === t.key ? "is-active" : ""}`}
              onClick={() => onChange(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
