import { useEffect, useMemo, useState, useCallback } from "react";
import api from "../api.js";
import Header from "../components/Header.jsx";
import SubjectTabs, { SUBJECT_ACCENTS } from "../components/SubjectTabs.jsx";
import UnitAccordion from "../components/UnitAccordion.jsx";
import Toast from "../components/Toast.jsx";

export default function SyllabusPage() {
  const [syllabus, setSyllabus] = useState(null);
  const [progress, setProgress] = useState({});
  const [activeSubject, setActiveSubject] = useState("biology");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [filter, setFilter] = useState("all"); // all | pending | not_started | completed
  const [query, setQuery] = useState("");

  // ---- initial load ----------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const [syl, prog] = await Promise.all([api.getSyllabus(), api.getProgress()]);
        setSyllabus(syl);
        setProgress(prog);
        setActiveSubject(syl.subjects[0]?.key ?? "biology");
      } catch (e) {
        setError("Could not reach the backend API. Is the Flask server running?");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---- derived stats (computed client-side from progress + syllabus) ---
  const subjectsStats = useMemo(() => {
    if (!syllabus) return [];
    return syllabus.subjects.map((subject) => {
      let completed = 0,
        pending = 0,
        not_started = 0,
        total = 0;
      subject.units.forEach((unit) =>
        unit.topics.forEach((topic) => {
          const st = progress[topic.id] || "not_started";
          if (st === "completed") completed++;
          else if (st === "pending") pending++;
          else not_started++;
          total++;
        })
      );
      return {
        key: subject.key,
        label: subject.label,
        weightage_percent: subject.weightage_percent,
        mcqs: subject.mcqs,
        counts: { completed, pending, not_started, total },
        completion_percent: total ? Math.round((completed / total) * 1000) / 10 : 0,
      };
    });
  }, [syllabus, progress]);

  const overallStats = useMemo(() => {
    const totals = subjectsStats.reduce(
      (acc, s) => {
        acc.completed += s.counts.completed;
        acc.pending += s.counts.pending;
        acc.not_started += s.counts.not_started;
        acc.total += s.counts.total;
        return acc;
      },
      { completed: 0, pending: 0, not_started: 0, total: 0 }
    );
    return {
      ...totals,
      completion_percent: totals.total ? Math.round((totals.completed / totals.total) * 1000) / 10 : 0,
    };
  }, [subjectsStats]);

  const activeSubjectData = useMemo(
    () => syllabus?.subjects.find((s) => s.key === activeSubject),
    [syllabus, activeSubject]
  );

  const visibleUnits = useMemo(() => {
    if (!activeSubjectData) return [];
    const q = query.trim().toLowerCase();
    return activeSubjectData.units
      .map((unit) => {
        let topics = unit.topics;
        if (filter !== "all") {
          topics = topics.filter((t) => (progress[t.id] || "not_started") === filter);
        }
        if (q) {
          topics = topics.filter(
            (t) =>
              t.name.toLowerCase().includes(q) ||
              t.outcomes.some((o) => o.toLowerCase().includes(q))
          );
        }
        return { ...unit, topics };
      })
      .filter((unit) => unit.topics.length > 0);
  }, [activeSubjectData, filter, query, progress]);

  // ---- actions -----------------------------------------------------------
  const handleChangeStatus = useCallback(async (topicId, status) => {
    setSavingId(topicId);
    const prevStatus = progress[topicId];
    setProgress((p) => ({ ...p, [topicId]: status })); // optimistic update
    try {
      await api.setStatus(topicId, status);
    } catch (e) {
      setProgress((p) => ({ ...p, [topicId]: prevStatus })); // rollback
      setError("Couldn't save that change. Check your connection and try again.");
    } finally {
      setSavingId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  const handleReset = useCallback(async () => {
    if (!window.confirm("Reset ALL topics back to 'Not started'? This can't be undone.")) return;
    try {
      const fresh = await api.resetProgress();
      setProgress(fresh);
    } catch (e) {
      setError("Couldn't reset progress. Check your connection and try again.");
    }
  }, []);

  // ---- render --------------------------------------------------------------
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="pulse-dot" />
        <p>Loading MDCAT syllabus…</p>
      </div>
    );
  }

  if (!syllabus) {
    return (
      <div className="loading-screen">
        <p>{error || "Something went wrong."}</p>
      </div>
    );
  }

  const accent = SUBJECT_ACCENTS[activeSubject] || "#3DDC97";

  return (
    <>
      <Header overall={overallStats} onReset={handleReset} />

      <main className="main">
        <SubjectTabs subjectsStats={subjectsStats} activeKey={activeSubject} onSelect={setActiveSubject} />

        <div className="toolbar">
          <input
            className="search-input"
            placeholder="Search topics or learning outcomes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="filter-pills">
            {[
              { key: "all", label: "All" },
              { key: "not_started", label: "Not started" },
              { key: "pending", label: "Pending" },
              { key: "completed", label: "Completed" },
            ].map((f) => (
              <button
                key={f.key}
                className={`filter-pill ${filter === f.key ? "is-active" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="unit-list">
          {visibleUnits.length === 0 ? (
            <p className="empty-state">No topics match this filter/search in {activeSubjectData?.label}.</p>
          ) : (
            visibleUnits.map((unit, idx) => (
              <UnitAccordion
                key={unit.id}
                unit={unit}
                progress={progress}
                onChangeStatus={handleChangeStatus}
                savingId={savingId}
                accent={accent}
                defaultOpen={idx === 0}
              />
            ))
          )}
        </div>
      </main>

      <footer className="footer">
        <p>
          Built from the official PMDC MDCAT 2025 Curriculum &middot; 240 learning outcomes across 5 subjects
        </p>
      </footer>

      <Toast message={error} onDismiss={() => setError("")} />
    </>
  );
}
