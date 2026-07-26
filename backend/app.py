"""
MDCAT Syllabus Progress Tracker — Flask Backend
Data is stored in flat JSON files (data/syllabus.json, data/progress.json).
No external database required.
"""
import json
import os
import uuid
from datetime import datetime, timezone

from flask import Flask, jsonify, request
from flask_cors import CORS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
SYLLABUS_PATH = os.path.join(DATA_DIR, "syllabus.json")
PROGRESS_PATH = os.path.join(DATA_DIR, "progress.json")
CHALLENGE_PATH = os.path.join(DATA_DIR, "challenge.json")
CHALLENGE_PROGRESS_PATH = os.path.join(DATA_DIR, "challenge_progress.json")
CUSTOM_TASKS_PATH = os.path.join(DATA_DIR, "custom_tasks.json")

VALID_STATUSES = {"not_started", "pending", "completed"}
MAX_CUSTOM_TASK_LABEL_LEN = 200

app = Flask(__name__)
app.json.sort_keys = False  # preserve dict key order (e.g. chapter_timing subject order)
CORS(app)  # allow the Netlify-hosted frontend to call this API


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    tmp_path = path + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(tmp_path, path)  # atomic write — avoids corrupting the file


def get_syllabus():
    return load_json(SYLLABUS_PATH)


def get_progress():
    if not os.path.exists(PROGRESS_PATH):
        save_json(PROGRESS_PATH, {})
    return load_json(PROGRESS_PATH)


def get_challenge():
    return load_json(CHALLENGE_PATH)


def get_challenge_progress():
    if not os.path.exists(CHALLENGE_PROGRESS_PATH):
        save_json(CHALLENGE_PROGRESS_PATH, {})
    return load_json(CHALLENGE_PROGRESS_PATH)


def get_custom_tasks():
    if not os.path.exists(CUSTOM_TASKS_PATH):
        save_json(CUSTOM_TASKS_PATH, [])
    return load_json(CUSTOM_TASKS_PATH)


def compute_challenge_stats(challenge, progress):
    """Roll up per-day and overall completion for the 20-day challenge."""
    days_out = []
    days_completed = 0

    for day in challenge["days"]:
        total = len(day["tasks"])
        done = sum(1 for t in day["tasks"] if progress.get(t["id"], False))
        pct = round((done / total) * 100, 1) if total else 0
        is_done = total > 0 and done == total
        if is_done:
            days_completed += 1
        days_out.append({
            "id": day["id"],
            "day_number": day["day_number"],
            "phase": day["phase"],
            "tasks_done": done,
            "tasks_total": total,
            "completion_percent": pct,
            "is_done": is_done,
        })

    total_days = len(challenge["days"])
    total_tasks = sum(len(d["tasks"]) for d in challenge["days"])
    total_done_tasks = sum(1 for v in progress.values() if v)

    return {
        "total_days": total_days,
        "days_completed": days_completed,
        "days_percent": round((days_completed / total_days) * 100, 1) if total_days else 0,
        "total_tasks": total_tasks,
        "tasks_completed": total_done_tasks,
        "tasks_percent": round((total_done_tasks / total_tasks) * 100, 1) if total_tasks else 0,
        "days": days_out,
    }


def compute_stats(syllabus, progress):
    """Roll up per-subject and overall completion stats."""
    overall = {"completed": 0, "pending": 0, "not_started": 0, "total": 0}
    subjects_stats = []

    for subject in syllabus["subjects"]:
        s_counts = {"completed": 0, "pending": 0, "not_started": 0, "total": 0}
        for unit in subject["units"]:
            for topic in unit["topics"]:
                status = progress.get(topic["id"], "not_started")
                if status not in VALID_STATUSES:
                    status = "not_started"
                s_counts[status] += 1
                s_counts["total"] += 1
                overall[status] += 1
                overall["total"] += 1

        pct = round((s_counts["completed"] / s_counts["total"]) * 100, 1) if s_counts["total"] else 0
        subjects_stats.append({
            "key": subject["key"],
            "label": subject["label"],
            "weightage_percent": subject["weightage_percent"],
            "mcqs": subject["mcqs"],
            "counts": s_counts,
            "completion_percent": pct,
        })

    overall_pct = round((overall["completed"] / overall["total"]) * 100, 1) if overall["total"] else 0
    return {
        "overall": {**overall, "completion_percent": overall_pct},
        "subjects": subjects_stats,
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "time": datetime.now(timezone.utc).isoformat()})


@app.get("/api/syllabus")
def api_syllabus():
    """Full syllabus tree (subjects -> units -> topics)."""
    return jsonify(get_syllabus())


@app.get("/api/progress")
def api_get_progress():
    """Map of topic_id -> status."""
    return jsonify(get_progress())


@app.put("/api/progress/<topic_id>")
def api_update_progress(topic_id):
    """Update the status of a single topic. Body: {"status": "completed"}"""
    body = request.get_json(silent=True) or {}
    status = body.get("status")

    if status not in VALID_STATUSES:
        return jsonify({"error": f"status must be one of {sorted(VALID_STATUSES)}"}), 400

    syllabus = get_syllabus()
    valid_ids = {
        topic["id"]
        for subject in syllabus["subjects"]
        for unit in subject["units"]
        for topic in unit["topics"]
    }
    if topic_id not in valid_ids:
        return jsonify({"error": f"unknown topic_id '{topic_id}'"}), 404

    progress = get_progress()
    progress[topic_id] = status
    save_json(PROGRESS_PATH, progress)

    return jsonify({"topic_id": topic_id, "status": status})


@app.post("/api/progress/reset")
def api_reset_progress():
    """Reset ALL progress back to not_started."""
    syllabus = get_syllabus()
    progress = {
        topic["id"]: "not_started"
        for subject in syllabus["subjects"]
        for unit in subject["units"]
        for topic in unit["topics"]
    }
    save_json(PROGRESS_PATH, progress)
    return jsonify(progress)


@app.get("/api/stats")
def api_stats():
    """Aggregated completion stats per subject + overall."""
    syllabus = get_syllabus()
    progress = get_progress()
    return jsonify(compute_stats(syllabus, progress))


# ---------------------------------------------------------------------------
# 20-Day Challenge routes
# ---------------------------------------------------------------------------
@app.get("/api/challenge")
def api_challenge():
    """Full 20-day plan: daily routine, chapter timing, day-by-day tasks."""
    return jsonify(get_challenge())


@app.get("/api/challenge-progress")
def api_get_challenge_progress():
    """Map of task_id -> bool (done/not done)."""
    return jsonify(get_challenge_progress())


@app.put("/api/challenge-progress/<task_id>")
def api_update_challenge_progress(task_id):
    """Toggle a single day's task. Body: {"done": true}"""
    body = request.get_json(silent=True) or {}
    done = body.get("done")

    if not isinstance(done, bool):
        return jsonify({"error": "'done' must be a boolean"}), 400

    challenge = get_challenge()
    valid_ids = {t["id"] for day in challenge["days"] for t in day["tasks"]}
    if task_id not in valid_ids:
        return jsonify({"error": f"unknown task_id '{task_id}'"}), 404

    progress = get_challenge_progress()
    progress[task_id] = done
    save_json(CHALLENGE_PROGRESS_PATH, progress)

    return jsonify({"task_id": task_id, "done": done})


@app.post("/api/challenge-progress/reset")
def api_reset_challenge_progress():
    """Reset every task in the 20-day challenge back to not done."""
    challenge = get_challenge()
    progress = {t["id"]: False for day in challenge["days"] for t in day["tasks"]}
    save_json(CHALLENGE_PROGRESS_PATH, progress)
    return jsonify(progress)


@app.get("/api/challenge-stats")
def api_challenge_stats():
    """Per-day completion + overall days/tasks completed."""
    challenge = get_challenge()
    progress = get_challenge_progress()
    return jsonify(compute_challenge_stats(challenge, progress))


# ---------------------------------------------------------------------------
# Custom (user-written) daily tasks — a free-form to-do list with a time,
# shown in its own box under the Daily Routine card.
# ---------------------------------------------------------------------------
@app.get("/api/custom-tasks")
def api_get_custom_tasks():
    """List every custom task, most recently created first."""
    tasks = get_custom_tasks()
    return jsonify(sorted(tasks, key=lambda t: t.get("created_at", ""), reverse=True))


@app.post("/api/custom-tasks")
def api_create_custom_task():
    """Create a custom task. Body: {"label": "...", "time": "14:30"}"""
    body = request.get_json(silent=True) or {}
    label = (body.get("label") or "").strip()
    time_str = (body.get("time") or "").strip()

    if not label:
        return jsonify({"error": "'label' is required"}), 400
    if len(label) > MAX_CUSTOM_TASK_LABEL_LEN:
        return jsonify({"error": f"'label' must be under {MAX_CUSTOM_TASK_LABEL_LEN} characters"}), 400

    task = {
        "id": f"custom-{uuid.uuid4().hex[:10]}",
        "label": label,
        "time": time_str,       # "HH:MM" 24h, or "" if not set
        "done": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    tasks = get_custom_tasks()
    tasks.append(task)
    save_json(CUSTOM_TASKS_PATH, tasks)

    return jsonify(task), 201


@app.put("/api/custom-tasks/<task_id>")
def api_update_custom_task(task_id):
    """Update a custom task's done state (and optionally its label/time)."""
    body = request.get_json(silent=True) or {}
    tasks = get_custom_tasks()

    match = next((t for t in tasks if t["id"] == task_id), None)
    if match is None:
        return jsonify({"error": f"unknown task_id '{task_id}'"}), 404

    if "done" in body:
        if not isinstance(body["done"], bool):
            return jsonify({"error": "'done' must be a boolean"}), 400
        match["done"] = body["done"]

    if "label" in body:
        label = (body["label"] or "").strip()
        if not label:
            return jsonify({"error": "'label' cannot be empty"}), 400
        if len(label) > MAX_CUSTOM_TASK_LABEL_LEN:
            return jsonify({"error": f"'label' must be under {MAX_CUSTOM_TASK_LABEL_LEN} characters"}), 400
        match["label"] = label

    if "time" in body:
        match["time"] = (body["time"] or "").strip()

    save_json(CUSTOM_TASKS_PATH, tasks)
    return jsonify(match)


@app.delete("/api/custom-tasks/<task_id>")
def api_delete_custom_task(task_id):
    """Delete a custom task."""
    tasks = get_custom_tasks()
    remaining = [t for t in tasks if t["id"] != task_id]

    if len(remaining) == len(tasks):
        return jsonify({"error": f"unknown task_id '{task_id}'"}), 404

    save_json(CUSTOM_TASKS_PATH, remaining)
    return jsonify({"deleted": task_id})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
