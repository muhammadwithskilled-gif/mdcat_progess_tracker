import { useEffect, useMemo, useState, useCallback } from "react";
import api from "../api.js";
import CountdownBanner from "../components/CountdownBanner.jsx";
import RoutineTable from "../components/RoutineTable.jsx";
import CustomTaskBox from "../components/CustomTaskBox.jsx";
import ChapterTimingCard from "../components/ChapterTimingCard.jsx";
import DayCard from "../components/DayCard.jsx";
import Toast from "../components/Toast.jsx";

const PHASE_FILTERS = [
  { key: "all", label: "All 20 days" },
  { key: "chapters", label: "16 Chapter days" },
  { key: "revision", label: "Revision (17-19)" },
  { key: "grand_test", label: "Grand test (20)" },
];

export default function ChallengePage() {
  const [challenge, setChallenge] = useState(null);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [phaseFilter, setPhaseFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const [ch, prog] = await Promise.all([api.getChallenge(), api.getChallengeProgress()]);
        setChallenge(ch);
        setProgress(prog);
      } catch (e) {
        setError("Could not reach the backend API. Is the Flask server running?");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const daysCompleted = useMemo(() => {
    if (!challenge) return 0;
    return challenge.days.filter((day) => day.tasks.every((t) => progress[t.id])).length;
  }, [challenge, progress]);

  const visibleDays = useMemo(() => {
    if (!challenge) return [];
    if (phaseFilter === "all") return challenge.days;
    return challenge.days.filter((d) => d.phase === phaseFilter);
  }, [challenge, phaseFilter]);

  const nextIncompleteDayId = useMemo(() => {
    if (!challenge) return null;
    const found = challenge.days.find((day) => !day.tasks.every((t) => progress[t.id]));
    return found?.id ?? null;
  }, [challenge, progress]);

  const handleToggleTask = useCallback(async (taskId, done) => {
    setSavingId(taskId);
    const prev = progress[taskId];
    setProgress((p) => ({ ...p, [taskId]: done })); // optimistic update
    try {
      await api.setChallengeTask(taskId, done);
    } catch (e) {
      setProgress((p) => ({ ...p, [taskId]: prev })); // rollback
      setError("Couldn't save that change. Check your connection and try again.");
    } finally {
      setSavingId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  const handleReset = useCallback(async () => {
    if (!window.confirm("Reset ALL 20 days back to not-done? This can't be undone.")) return;
    try {
      const fresh = await api.resetChallengeProgress();
      setProgress(fresh);
    } catch (e) {
      setError("Couldn't reset progress. Check your connection and try again.");
    }
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="pulse-dot" />
        <p>Loading your 20-day challenge…</p>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="loading-screen">
        <p>{error || "Something went wrong."}</p>
      </div>
    );
  }

  return (
    <>
      <CountdownBanner
        testDate={challenge.test_date}
        daysCompleted={daysCompleted}
        totalDays={challenge.total_days}
        onReset={handleReset}
      />

      <main className="main">
        <div className="challenge-refs">
          <div className="challenge-refs-col">
            <RoutineTable routine={challenge.daily_routine} />
            <CustomTaskBox />
          </div>
          <ChapterTimingCard
            chapterTiming={challenge.chapter_timing}
            subjectSummary={challenge.subject_summary}
          />
        </div>

        <div className="toolbar">
          <h2 className="section-title">16-Day Chapter Plan + 4-Day Revision</h2>
          <div className="filter-pills">
            {PHASE_FILTERS.map((f) => (
              <button
                key={f.key}
                className={`filter-pill ${phaseFilter === f.key ? "is-active" : ""}`}
                onClick={() => setPhaseFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="unit-list">
          {visibleDays.map((day) => (
            <DayCard
              key={day.id}
              day={day}
              startDate={challenge.start_date}
              progress={progress}
              onToggleTask={handleToggleTask}
              savingId={savingId}
              defaultOpen={day.id === nextIncompleteDayId}
            />
          ))}
        </div>
      </main>

      <footer className="footer">
        <p>16 days to cover the syllabus + 4 days of revision &amp; subject tests before the Grand Test.</p>
      </footer>

      <Toast message={error} onDismiss={() => setError("")} />
    </>
  );
}
