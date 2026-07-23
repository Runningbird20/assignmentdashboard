# Canvas Dashboard

A minimal MVP that syncs assignments from the [Canvas LMS](https://www.instructure.com/canvas) API into a local database, displays them in a simple dashboard, and posts a Slack summary whenever new assignments are discovered.

No AI/LLMs are used anywhere in this project.

## Features

- Periodic (hourly) and on-demand sync from the Canvas REST API
- Assignments persisted to SQLite via SQLAlchemy
- Detection of newly discovered assignments, with a single Slack summary per sync
- A React dashboard with four views: **Due Today**, **Due This Week**, **Recently Added**, **Overdue**

## Architecture

```
backend/                     FastAPI application
  app/
    api/         routes + Pydantic response schemas
    canvas/      Canvas API client + response schemas
    database/    engine/session, ORM Base, repository
    models/      SQLAlchemy Assignment model
    scheduler/   APScheduler wrapper (startup + hourly sync)
    services/    sync service (Canvas -> DB -> Slack)
    slack/       Slack Incoming Webhook notifier
    utils/       time helpers
    config.py    settings loaded from .env
    main.py      app factory, CORS, lifespan
frontend/                    React + Vite + TypeScript + Tailwind
  src/
    api/         typed fetch client
    components/  AssignmentCard, Section
    pages/       Dashboard
docker-compose.yml
```

The layers are kept separate: the **API** talks to a **repository** and a **service**; the **service** orchestrates the **Canvas client**, the **repository**, and the **Slack notifier**. Database access lives entirely behind `AssignmentRepository`.

## Prerequisites

- Python 3.12+
- Node.js 20+
- A Canvas personal access token (Canvas → *Account* → *Settings* → *New Access Token*)
- (Optional) A Slack Incoming Webhook URL

## Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env        # then fill in your values
uvicorn app.main:app --reload
```

The API runs on http://localhost:8000 (interactive docs at http://localhost:8000/docs).
A sync runs immediately on startup and then every hour.

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The dashboard runs on http://localhost:5173 and talks to the backend at
`VITE_API_URL` (defaults to `http://localhost:8000`). Copy `.env.example` to
`.env` if you need to change it.

## Environment variables

Configured in `backend/.env` (see `backend/.env.example`):

| Variable               | Description                                              | Default              |
| ---------------------- | -------------------------------------------------------- | -------------------- |
| `CANVAS_API_URL`       | Base URL of your Canvas instance (no trailing `/api/v1`) | —                    |
| `CANVAS_ACCESS_TOKEN`  | Canvas personal access token                             | —                    |
| `SLACK_WEBHOOK_URL`    | Slack Incoming Webhook (blank disables notifications)    | —                    |
| `DATABASE_URL`         | SQLAlchemy database URL                                  | `sqlite:///canvas.db`|
| `SYNC_INTERVAL_HOURS`  | Hours between background syncs                           | `1`                  |

If Canvas is not configured, the app still starts and the sync is skipped with a
warning — so you can boot everything before filling in credentials.

## API endpoints

| Method | Path                    | Description                                    |
| ------ | ----------------------- | ---------------------------------------------- |
| GET    | `/health`               | `{ "status": "ok" }`                           |
| GET    | `/assignments`          | Every assignment                               |
| GET    | `/assignments/today`    | Due today (UTC)                                |
| GET    | `/assignments/week`     | Due within the next 7 days                     |
| GET    | `/assignments/recent`   | First discovered within the last 24 hours      |
| GET    | `/assignments/overdue`  | Due date already passed                        |
| POST   | `/sync`                 | Trigger a Canvas sync immediately              |

## How sync + notifications work

Each sync fetches active courses and their assignments. Any assignment whose
Canvas ID is not already in the database is inserted and collected into a
"newly discovered" list. Existing assignments are refreshed (name, due date,
`last_seen`). When the list is non-empty, a single Slack summary is posted:

```
📚 Canvas Update

3 new assignments found

• CS3510
  Homework 7
  Due Aug 2

• MATH1554
  Quiz 3
  Due Tomorrow

• APPH1040
  Reflection
  Due Friday
```

If no new assignments are found, no Slack message is sent.

## Docker Compose

```bash
cp backend/.env.example backend/.env   # fill in your values first
docker compose up --build
```

- Backend → http://localhost:8000
- Frontend → http://localhost:5173

The SQLite file is persisted to `backend/data/` via a mounted volume.

## Notes

- **Timezones:** Canvas timestamps are stored as naive UTC for consistent
  comparisons in SQLite; the date buckets (today/week/overdue) are evaluated in UTC.
- **"Recently Added"** uses a local `first_seen` column (when this app first saw
  the assignment), which is distinct from Canvas's own `created_at`.
- No authentication is implemented — the backend is assumed to run locally.
