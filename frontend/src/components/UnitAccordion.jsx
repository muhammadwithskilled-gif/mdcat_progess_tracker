import { useState } from "react";
import TopicRow from "./TopicRow.jsx";

function unitCompletion(unit, progress) {
  const total = unit.topics.length;
  const completed = unit.topics.filter((t) => progress[t.id] === "completed").length;
  const pending = unit.topics.filter((t) => progress[t.id] === "pending").length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return { total, completed, pending, pct };
}

export default function UnitAccordion({ unit, progress, onChangeStatus, savingId, accent, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const { total, completed, pending, pct } = unitCompletion(unit, progress);
  const isDone = pct === 100;

  return (
    <section className={`unit-card ${isDone ? "unit-done" : ""}`}>
      <button className="unit-header" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className={`chevron ${open ? "chevron-open" : ""}`} aria-hidden="true">
          ▸
        </span>
        <span className="unit-name">{unit.name}</span>
        <span className="unit-meta">
          {pending > 0 && <span className="unit-pending-flag">{pending} pending</span>}
          <span className="unit-count">
            {completed}/{total} topics
          </span>
          <span className="unit-bar" aria-hidden="true">
            <span className="unit-bar-fill" style={{ width: `${pct}%`, background: accent }} />
          </span>
          <span className="unit-pct">{pct}%</span>
        </span>
      </button>

      {open && (
        <ul className="topic-list">
          {unit.topics.map((topic) => (
            <TopicRow
              key={topic.id}
              topic={topic}
              status={progress[topic.id] || "not_started"}
              onChange={onChangeStatus}
              savingId={savingId}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
