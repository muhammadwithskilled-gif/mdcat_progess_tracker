const DIFFICULTY_TONE = {
  short: "tone-easy",
  moderate: "tone-mid",
  hard: "tone-hard",
};

function toneFor(label) {
  const l = label.toLowerCase();
  if (l.includes("hard")) return DIFFICULTY_TONE.hard;
  if (l.includes("moderate")) return DIFFICULTY_TONE.moderate;
  if (l.includes("short")) return DIFFICULTY_TONE.short;
  return "tone-mid";
}

const SUBJECT_LABELS = {
  biology: "Biology",
  chemistry: "Chemistry",
  physics: "Physics",
};

export default function ChapterTimingCard({ chapterTiming, subjectSummary }) {
  return (
    <section className="card">
      <h2 className="card-title">Remaining Chapters &amp; Difficulty</h2>
      <p className="card-subtitle">
        {subjectSummary.map((s) => `${s.subject} ${s.chapters_left}`).join(" · ")} — 31 chapters
        left in total.
      </p>
      <div className="chapter-timing-grid">
        {Object.entries(chapterTiming).map(([subjectKey, chapters]) => (
          <div className="chapter-timing-col" key={subjectKey}>
            <h3>{SUBJECT_LABELS[subjectKey] || subjectKey}</h3>
            <ul>
              {chapters.map((c, i) => (
                <li key={i}>
                  <span className="chapter-name">{c.name}</span>
                  <span className={`difficulty-tag ${toneFor(c.difficulty)}`}>{c.difficulty}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
