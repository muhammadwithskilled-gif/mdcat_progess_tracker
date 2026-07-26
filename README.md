# MDCAT Prep Tracker

A full-stack study tracker for MDCAT 2025 built around two pages:

1. **Syllabus Tracker** — the official **PMDC MDCAT 2025 Curriculum** (Biology, Chemistry,
   Physics, English, Logical Reasoning), broken into 61 units and 240 trackable topics,
   each with a **Not started / Pending / Completed** status.
2. **20-Day Challenge** — your personal 20-day countdown plan (16 days to finish the
   remaining 31 chapters + 4 days of revision and subject tests), with a live countdown to
   test day, a checklist per day, and an auto-updating "days completed" counter.

- **Frontend:** React (Vite)
- **Backend:** Flask (REST API)
- **Database:** flat JSON files (`backend/data/*.json`) — no SQL/Mongo needed

---

## 1. Folder structure

```
mdcat-tracker/
├── backend/
│   ├── app.py                     # Flask app + REST API (syllabus + challenge)
│   ├── requirements.txt
│   ├── Procfile                    # for Railway (gunicorn start command)
│   ├── railway.json                # Railway build/deploy config
│   ├── .gitignore
│   └── data/
│       ├── syllabus.json           # curriculum content (subjects/units/topics)
│       ├── progress.json           # per-topic status, read/write at runtime
│       ├── challenge.json          # 20-day plan: routine, chapters, day tasks
│       ├── challenge_progress.json # per-task done/not-done, read/write at runtime
│       └── custom_tasks.json       # user-written free-form tasks, read/write at runtime
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── netlify.toml                # Netlify build + SPA redirect config
│   ├── .env.example
│   ├── .gitignore
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                 # page shell — switches between the 2 pages
│       ├── api.js                  # fetch wrapper for the Flask API
│       ├── styles.css
│       ├── utils/
│       │   └── date.js             # countdown + day-date helpers
│       ├── pages/
│       │   ├── SyllabusPage.jsx    # Page 1: syllabus tracker (5 subjects)
│       │   └── ChallengePage.jsx   # Page 2: 20-day challenge tracker
│       └── components/
│           ├── Header.jsx
│           ├── TopNav.jsx            # top switcher between the two pages
│           ├── ProgressRing.jsx
│           ├── SubjectTabs.jsx
│           ├── UnitAccordion.jsx
│           ├── TopicRow.jsx
│           ├── StatusToggle.jsx
│           ├── Toast.jsx
│           ├── CountdownBanner.jsx   # days-left-until-test + days-completed ring
│           ├── RoutineTable.jsx      # daily 24h routine reference
│           ├── CustomTaskBox.jsx     # free-form "write your own task" checklist
│           ├── ChapterTimingCard.jsx # remaining chapters + difficulty tags
│           └── DayCard.jsx           # one of the 20 tracked days + its checklist
│
└── README.md
```

---

## 2. Features

### Page 1 — Syllabus Tracker
- Full syllabus tree — 5 subjects → 61 units → 240 topics with official learning outcomes.
- Three-state tracking per topic: `Not started` / `Pending` / `Completed`, saved instantly
  (optimistic UI with automatic rollback + a toast if a save fails).
- Live progress rings/bars: overall header ring, per-subject tab bars, per-unit bars.
- Search across topics/outcomes, plus a status filter.
- Reset-all button (with confirm step).
- Each subject tab shows its official MDCAT weightage and MCQ count.

### Page 2 — 20-Day Challenge
- **Live countdown** to test day (16 August), recalculated automatically.
- **16-day chapter plan**, day-by-day, exactly as scheduled, each broken into individual
  checklist tasks.
- **Auto day-completion** — a day flips to "✓ Done" the moment every task inside it is
  checked, and the header's "days completed / 16" counter updates immediately.
- **Daily routine reference card** — your fixed 24-hour schedule (Fajr, study blocks, meals,
  MCQ practice, sleep) shown as a quick-glance table.
- **My Own Daily Tasks** — a free-form box under the routine card: write any task, set an
  optional time, hit Save, and it's added to a checklist you can tick off or delete. Saved
  to the backend so it survives refreshes and reopening the site.
- **Remaining chapters & difficulty reference** — every leftover chapter per subject tagged
  Short/Moderate/Hard.
- Filter days by phase (All / Chapter days / Revision).
- Reset-all button for the challenge, independent of the syllabus tracker's reset.

---

## 3. Running locally

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py                    # runs on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                      # runs on http://localhost:5173
```

The frontend defaults to calling `http://localhost:5000` — no `.env` needed for local dev.

---

## 4. API reference

### Syllabus tracker

| Method | Path                        | Description                                        |
|--------|-----------------------------|-----------------------------------------------------|
| GET    | `/api/health`               | Health check                                         |
| GET    | `/api/syllabus`             | Full subject → unit → topic tree                     |
| GET    | `/api/progress`             | `{ topic_id: status }` map                           |
| PUT    | `/api/progress/<topic_id>`  | Body `{"status": "completed"}` — update one topic    |
| POST   | `/api/progress/reset`       | Reset every topic to `not_started`                   |
| GET    | `/api/stats`                | Aggregated completion stats per subject + overall    |

Valid `status` values: `not_started`, `pending`, `completed`.

### 20-Day Challenge

| Method | Path                                | Description                                    |
|--------|-------------------------------------|-------------------------------------------------|
| GET    | `/api/challenge`                    | Full plan: routine, chapter timing, day tasks    |
| GET    | `/api/challenge-progress`           | `{ task_id: true/false }` map                    |
| PUT    | `/api/challenge-progress/<task_id>` | Body `{"done": true}` — toggle one task          |
| POST   | `/api/challenge-progress/reset`     | Reset every task to not done                     |
| GET    | `/api/challenge-stats`              | Per-day + overall days/tasks completed           |

### My Own Daily Tasks (custom, free-form)

| Method | Path                          | Description                                          |
|--------|-------------------------------|-------------------------------------------------------|
| GET    | `/api/custom-tasks`           | List all custom tasks (newest first)                   |
| POST   | `/api/custom-tasks`           | Body `{"label": "...", "time": "14:30"}` — create one  |
| PUT    | `/api/custom-tasks/<task_id>` | Body `{"done": true}` (and/or `label`, `time`) — update |
| DELETE | `/api/custom-tasks/<task_id>` | Remove a task                                          |

---

## 5. Deployment

### Step A — Push to GitHub

Push the whole `mdcat-tracker/` folder (both `backend/` and `frontend/`) to a single
GitHub repo, e.g. `mdcat-tracker`.

```bash
cd mdcat-tracker
git init
git add .
git commit -m "Initial commit: MDCAT prep tracker (syllabus + 20-day challenge)"
git branch -M main
git remote add origin https://github.com/<your-username>/mdcat-tracker.git
git push -u origin main
```

### Step B — Deploy the backend on Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Select your `mdcat-tracker` repo.
3. Set the **root directory** to `backend` (this repo has both frontend and backend, so
   Railway needs to know which folder to build).
4. Railway auto-detects Python via `requirements.txt` and uses the `Procfile`
   (`gunicorn app:app --bind 0.0.0.0:$PORT`) to start the server — no extra config needed.
5. Settings → Networking → **Generate Domain**. You'll get a URL like
   `https://mdcat-tracker-backend-production.up.railway.app`.
6. Test it: visit `https://<your-railway-url>/api/health` and
   `https://<your-railway-url>/api/challenge` — both should return JSON.

> **Note on the JSON "database":** Railway's filesystem is ephemeral on redeploys, so
> `progress.json` and `challenge_progress.json` will reset if you redeploy the service.
> Fine for personal use. To persist across redeploys, mount a
> [Railway Volume](https://docs.railway.app/reference/volumes) at `backend/data` — same
> file paths, no code changes.

### Step C — Deploy the frontend on Netlify

1. Go to [netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing
   project** → connect GitHub → pick your `mdcat-tracker` repo.
2. Set:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
   (Netlify usually picks these up automatically from `netlify.toml`.)
3. Under **Site settings → Environment variables**, add:
   - `VITE_API_URL` = `https://<your-railway-backend-url>` (no trailing slash)
4. Trigger a deploy. Netlify gives you a URL like `https://mdcat-tracker.netlify.app`.

### Step D — Allow the Netlify domain in CORS (optional hardening)

`app.py` uses `CORS(app)` which allows all origins by default. To lock it down once you
have your Netlify URL:

```python
CORS(app, origins=["https://mdcat-tracker.netlify.app"])
```

Commit, push, and Railway redeploys automatically.

---

## 6. Editing the plan later

- `backend/data/syllabus.json` — edit directly to change subjects/units/topics. Each topic
  needs an `id`, `name`, and `outcomes` array.
- `backend/data/challenge.json` — edit `test_date`, `start_date`, `daily_routine`,
  `chapter_timing`, or the `days` array (each day needs an `id`, `day_number`, `phase`,
  and a `tasks` array of `{id, label}`).
- If you change `test_date`, the countdown on the Challenge page updates automatically —
  no other code changes needed.
