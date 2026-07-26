import { useState } from "react";
import { addDays, formatShortDate } from "../utils/date.js";

const PHASE_LABEL = {
  chapters: "Chapter day",
  revision: "Revision day",
  grand_test: "Grand test",
};

const PHASE_ACCENT = {
  chapters: "#3E8FD9",
  revision: "#D9992E",
  grand_test: "#D9613E",
};

export default function DayCard({ day, startDate, progress, onToggleTask, savingId, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);

  const total = day.tasks.length;
  const done = day.tasks.filter((t) => progress[t.id]).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const isDone = pct === 100;
  const accent = PHASE_ACCENT[day.phase] || "#3E8FD9";

  const dateLabel = formatShortDate(addDays(startDate, day.day_number - 1));

  return (
    <section className={`unit-card day-card ${isDone ? "unit-done" : ""}`}>
      <button className="unit-header" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className={`chevron ${open ? "chevron-open" : ""}`} aria-hidden="true">
          ▸
        </span>
        <span className="day-badge" style={{ background: accent }}>
          Day {day.day_number}
        </span>
        <span className="unit-name day-title">
          {PHASE_LABEL[day.phase]}
          <span className="day-date"> &middot; {dateLabel}</span>
          {day.approx_hours && <span className="day-hours"> &middot; {day.approx_hours}</span>}
        </span>
        <span className="unit-meta">
          <span className="unit-count">
            {done}/{total} tasks
          </span>
          <span className="unit-bar" aria-hidden="true">
            <span className="unit-bar-fill" style={{ width: `${pct}%`, background: accent }} />
          </span>
          <span className="unit-pct">{pct}%</span>
          {isDone && <span className="day-done-flag">✓ Done</span>}
        </span>
      </button>

      {open && (
        <div className="day-body">
          {day.focus && <p className="day-focus">{day.focus}</p>}
          <ul className="task-list">
            {day.tasks.map((task) => {
              const checked = !!progress[task.id];
              const isSaving = savingId === task.id;
              return (
                <li key={task.id} className={`task-row ${checked ? "task-done" : ""}`}>
                  <label className="task-checkbox">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={isSaving}
                      onChange={(e) => onToggleTask(task.id, e.target.checked)}
                    />
                    <span className="task-label">{task.label}</span>
                  </label>
                  {isSaving && <span className="saving-dot" title="Saving…" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
