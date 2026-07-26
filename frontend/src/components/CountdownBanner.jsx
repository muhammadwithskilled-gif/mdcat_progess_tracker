import { useEffect, useState } from "react";
import ProgressRing from "./ProgressRing.jsx";
import { daysUntil } from "../utils/date.js";

export default function CountdownBanner({ testDate, daysCompleted, totalDays, onReset }) {
  const [remaining, setRemaining] = useState(() => daysUntil(testDate));

  useEffect(() => {
    const id = setInterval(() => setRemaining(daysUntil(testDate)), 60_000);
    return () => clearInterval(id);
  }, [testDate]);

  const pct = totalDays ? Math.round((daysCompleted / totalDays) * 100) : 0;
  const testDateLabel = new Date(`${testDate}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-text">
          <span className="eyebrow">MDCAT 2026 &middot; 20-Day Challenge | Future Doctor</span>
          <h1>
            {remaining > 0
              ? `${remaining} day${remaining === 1 ? "" : "s"} until test day`
              : remaining === 0
              ? "Test is today — good luck!"
              : "Test day has passed"}
          </h1>
          <p className="header-sub">
            Test scheduled for {testDateLabel}. You've completed{" "}
            <strong>{daysCompleted}</strong> of <strong>{totalDays}</strong> challenge days
            ({pct}%).
          </p>
          <button className="btn-ghost" onClick={onReset}>
            Reset challenge progress
          </button>
        </div>
        <ProgressRing
          percent={pct}
          size={104}
          stroke={10}
          color="#3DDC97"
          label={`${daysCompleted}/${totalDays}`}
          sublabel="days done"
        />
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
