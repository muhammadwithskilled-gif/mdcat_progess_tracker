// Base URL of the Flask backend.
// In production (Netlify) set VITE_API_URL as an env var to your Railway URL,
// e.g. https://mdcat-tracker-backend.up.railway.app
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getSyllabus: () => request("/api/syllabus"),
  getProgress: () => request("/api/progress"),
  getStats: () => request("/api/stats"),
  setStatus: (topicId, status) =>
    request(`/api/progress/${encodeURIComponent(topicId)}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
  resetProgress: () => request("/api/progress/reset", { method: "POST" }),

  // 20-Day Challenge
  getChallenge: () => request("/api/challenge"),
  getChallengeProgress: () => request("/api/challenge-progress"),
  getChallengeStats: () => request("/api/challenge-stats"),
  setChallengeTask: (taskId, done) =>
    request(`/api/challenge-progress/${encodeURIComponent(taskId)}`, {
      method: "PUT",
      body: JSON.stringify({ done }),
    }),
  resetChallengeProgress: () => request("/api/challenge-progress/reset", { method: "POST" }),

  // Custom (user-written) daily tasks
  getCustomTasks: () => request("/api/custom-tasks"),
  addCustomTask: (label, time) =>
    request("/api/custom-tasks", { method: "POST", body: JSON.stringify({ label, time }) }),
  toggleCustomTask: (taskId, done) =>
    request(`/api/custom-tasks/${encodeURIComponent(taskId)}`, {
      method: "PUT",
      body: JSON.stringify({ done }),
    }),
  deleteCustomTask: (taskId) =>
    request(`/api/custom-tasks/${encodeURIComponent(taskId)}`, { method: "DELETE" }),
};

export default api;
