const SUBJECT_ACCENTS = {
  biology: "#2FA36A",
  chemistry: "#3E8FD9",
  physics: "#B573D9",
  english: "#D99A3E",
  logical_reasoning: "#D9613E",
};

export default function SubjectTabs({ subjectsStats, activeKey, onSelect }) {
  return (
    <nav className="subject-tabs">
      {subjectsStats.map((s) => {
        const active = s.key === activeKey;
        const accent = SUBJECT_ACCENTS[s.key] || "#3DDC97";
        return (
          <button
            key={s.key}
            className={`subject-tab ${active ? "is-active" : ""}`}
            style={{ "--tab-accent": accent }}
            onClick={() => onSelect(s.key)}
          >
            <span className="subject-tab-top">
              <span className="subject-tab-label">{s.label}</span>
              <span className="subject-tab-weight">{s.weightage_percent}% &middot; {s.mcqs} MCQs</span>
            </span>
            <span className="subject-tab-bar">
              <span
                className="subject-tab-bar-fill"
                style={{ width: `${s.completion_percent}%`, background: accent }}
              />
            </span>
            <span className="subject-tab-pct">{s.completion_percent}%</span>
          </button>
        );
      })}
    </nav>
  );
}

export { SUBJECT_ACCENTS };
