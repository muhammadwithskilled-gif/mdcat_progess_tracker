import { useEffect, useState } from "react";
import api from "../api.js";

export default function CustomTaskBox() {
  const [tasks, setTasks] = useState([]);
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getCustomTasks();
        setTasks(data);
      } catch (e) {
        setError("Couldn't load your tasks.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sorted = [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1; // undone first
    return (a.time || "99:99").localeCompare(b.time || "99:99");
  });
  const doneCount = tasks.filter((t) => t.done).length;

  async function handleSave(e) {
    e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setError("");
    try {
      const created = await api.addCustomTask(trimmed, time);
      setTasks((prev) => [created, ...prev]);
      setLabel("");
      setTime("");
    } catch (e) {
      setError("Couldn't save that task. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(taskId, done) {
    setPendingId(taskId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done } : t)));
    try {
      await api.toggleCustomTask(taskId, done);
    } catch (e) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done: !done } : t)));
      setError("Couldn't save that change.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(taskId) {
    const prevTasks = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await api.deleteCustomTask(taskId);
    } catch (e) {
      setTasks(prevTasks);
      setError("Couldn't delete that task.");
    }
  }

  return (
    <section className="card custom-task-card">
      <h2 className="card-title">My Own Daily Tasks</h2>
      <p className="card-subtitle">
        {tasks.length === 0
          ? "Write your own task, set a time, and save it — it'll show up in the list below."
          : `${doneCount}/${tasks.length} done`}
      </p>

      <form className="custom-task-form" onSubmit={handleSave}>
        <input
          className="custom-task-input"
          placeholder="Write a task…"
          value={label}
          maxLength={200}
          onChange={(e) => setLabel(e.target.value)}
        />
        <input
          type="time"
          className="custom-task-time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          aria-label="Task time"
        />
        <button type="submit" className="btn-save" disabled={saving || !label.trim()}>
          {saving ? "Saving…" : "Save"}
        </button>
      </form>

      {loading ? (
        <p className="custom-task-empty">Loading…</p>
      ) : sorted.length === 0 ? (
        <p className="custom-task-empty">No tasks yet — add your first one above.</p>
      ) : (
        <ul className="task-list custom-task-list">
          {sorted.map((t) => (
            <li key={t.id} className={`task-row ${t.done ? "task-done" : ""}`}>
              <label className="task-checkbox">
                <input
                  type="checkbox"
                  checked={t.done}
                  disabled={pendingId === t.id}
                  onChange={(e) => handleToggle(t.id, e.target.checked)}
                />
                <span className="task-label">
                  {t.time && <span className="custom-task-time-tag">{t.time}</span>}
                  {t.label}
                </span>
              </label>
              <button
                type="button"
                className="custom-task-delete"
                onClick={() => handleDelete(t.id)}
                aria-label={`Delete "${t.label}"`}
                title="Delete task"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="custom-task-error">{error}</p>}
    </section>
  );
}
