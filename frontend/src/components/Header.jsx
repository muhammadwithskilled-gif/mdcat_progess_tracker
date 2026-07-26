import ProgressRing from "./ProgressRing.jsx";

export default function Header({ overall, onReset }) {
  const pct = overall?.completion_percent ?? 0;
  const total = overall?.total ?? 0;
  const completed = overall?.completed ?? 0;

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-text">
          <span className="eyebrow">MDCAT 2026 &middot; PMDC Curriculum</span>
          <h1>Syllabus Readiness Monitor</h1>
          <p className="header-sub">
            {completed} of {total} learning outcomes cleared across Biology, Chemistry,
            Physics, English &amp; Logical Reasoning.
          </p>
          <button className="btn-ghost" onClick={onReset}>
            Reset all progress
          </button>
        </div>
        <ProgressRing percent={pct} size={104} stroke={10} color="#3DDC97" />
      </div>
      <svg className="ecg-divider" viewBox="0 0 1200 40" preserveAspectRatio="none">
        <polyline
          points="0,20 260,20 285,20 300,4 315,36 330,20 360,20 1200,20"
          fill="none"
          stroke="#3DDC97"
          strokeWidth="2"
          opacity="0.55"
        />
      </svg>
    </header>
  );
}
