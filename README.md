# StudentOS

A personal productivity dashboard for college students: classes, assignments, a
monthly calendar and a personal to-do list in one place, with one-click import
of assignments from a Google Sheet.

- **Dashboard** — greeting, today's schedule, today's tasks, assignments due
  today and this week, upcoming events, and quick statistics.
- **Classes** — professor, location, meeting days/time, office hours and a
  color used everywhere the class appears.
- **Assignments** — searchable, sortable table with status, priority and notes.
- **To-dos** — personal tasks with drag-and-drop ordering.
- **Calendar** — month view combining class meetings, assignment due dates,
  to-dos and events; click anything for details.
- **Settings** — light/dark/system theme, Google Sheet URL, notification
  preferences.

No AI, no accounts — a fast local-first tool.

## Tech Stack

| Layer    | Technology |
| -------- | ---------- |
| Frontend | React 19, TypeScript, Vite, TailwindCSS v4, shadcn-style UI kit, React Router, TanStack Query |
| Backend  | Python 3.12, FastAPI, SQLAlchemy 2, SQLite, Pydantic v2, APScheduler |
| Infra    | Docker Compose |

## Project Structure

```
backend/
  app/
    api/          # Router aggregation + shared dependencies (DbSession)
    core/         # Settings (pydantic-settings) + domain exceptions
    database/     # Engine/session, declarative Base, seed script
    models/       # SQLAlchemy models: SchoolClass, Assignment, Todo, Event
    schemas/      # Pydantic request/response schemas
    services/     # Business logic: CRUD, dashboard, Google Sheets import
    routers/      # Thin FastAPI endpoint modules
    scheduler/    # APScheduler background jobs (sheet auto-sync)
    utils/        # Date helpers
frontend/
  src/
    api/          # Typed fetch client + one module per resource
    components/   # ui/ (shadcn-style kit), shared/, layout/, feature dirs
    hooks/        # TanStack Query hooks, theme, settings, localStorage
    layouts/      # App shell (sidebar + navbar + outlet)
    pages/        # One component per route
    types/        # API types mirrored from backend schemas
    utils/        # cn(), date formatting, constants
docker-compose.yml
.env.example
```

Routers stay thin: every endpoint delegates to a service, and services own all
database access. That keeps validation rules (duplicate class names, duplicate
assignments per class) in one place and leaves room for the planned
integrations (Canvas sync, Google Calendar, Slack/Discord notifications, grade
tracking, notes, uploads, auth) to land as new `services/` + `routers/`
modules without touching existing code.

## Running Locally

Backend (Python 3.12+):

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m app.database.seed        # demo data: 3 classes, 8 assignments, 5 todos, 2 events
uvicorn app.main:app --reload      # http://localhost:8000  (docs at /docs)
```

Frontend (Node 20.19+/22):

```bash
cd frontend
npm install
npm run dev                        # http://localhost:5173
```

Reseed from scratch any time with `python -m app.database.seed --force`.

> Port taken? If something else is on 8000, run
> `uvicorn app.main:app --reload --port 8080` and set
> `VITE_API_URL=http://localhost:8080` in `frontend/.env`.

### Docker

```bash
docker compose up --build
```

Backend on `http://localhost:8000`, frontend on `http://localhost:5173`. The
SQLite database lives in the `backend-data` volume. To seed demo data inside
Docker: `docker compose exec backend python -m app.database.seed`.

## Environment Variables

Copy `.env.example` to `.env` (Docker) or `backend/.env` (local uvicorn).
Everything has a sensible default.

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `DATABASE_URL` | `sqlite:///./studentos.db` | SQLAlchemy database URL |
| `CORS_ORIGINS` | localhost:5173 origins | Allowed frontend origins |
| `GOOGLE_SHEETS_API_KEY` | empty | Optional; enables the official Sheets API |
| `GOOGLE_SHEET_URL` | empty | Default/auto-sync sheet URL |
| `AUTO_SYNC_ENABLED` | `false` | Periodic background re-import |
| `SYNC_INTERVAL_MINUTES` | `60` | Auto-sync interval |
| `VITE_API_URL` | `http://localhost:8000` | API base URL for the frontend |

## Importing a Google Sheet

1. Keep a sheet whose **first row** has the headers `Class`,
   `Assignment Name`, `Due Date` (any extra columns are ignored):

   | Class | Assignment Name | Due Date |
   | ----- | --------------- | -------- |
   | CS 250: Data Structures | Problem Set 5 | 2026-08-01 |

2. Share it as **"Anyone with the link can view"** (File → Share). No API key
   is needed for this — the backend uses the sheet's CSV export. If you set
   `GOOGLE_SHEETS_API_KEY`, the official Sheets API v4 is used instead.
3. In the app, open **Assignments → Import Google Sheet** (or Settings), paste
   the URL and click Import. The URL is remembered for next time.

Import behavior:

- New rows become new assignments (status *Todo*, priority *Medium*).
- Rows matching an existing assignment (same class + name, case-insensitive)
  with a **changed due date** update that due date.
- Identical rows are skipped; classes named in the sheet that don't exist yet
  are created automatically.
- Rows with missing values or unparseable dates are reported, not imported.
  Dates may be `2026-08-01`, `8/1/2026`, `Aug 1 2026`, etc.

Set `GOOGLE_SHEET_URL` + `AUTO_SYNC_ENABLED=true` to have APScheduler re-import
the sheet every `SYNC_INTERVAL_MINUTES` in the background.

## REST API

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/health` | Liveness check |
| GET | `/dashboard` | Aggregated dashboard payload |
| GET/POST | `/classes` | List / create classes |
| GET/PUT/DELETE | `/classes/{id}` | Read / update / delete a class |
| GET/POST | `/assignments` | List (`?class_id=` filter) / create |
| PUT/DELETE | `/assignments/{id}` | Update / delete |
| GET/POST | `/todos` | List / create to-dos |
| PUT | `/todos/reorder` | Persist drag-and-drop order |
| PUT/DELETE | `/todos/{id}` | Update / delete |
| GET/POST | `/events` | List / create events |
| PUT/DELETE | `/events/{id}` | Update / delete |
| POST | `/import/google-sheet` | Run a sheet import |

Interactive docs: `http://localhost:8000/docs`.

## Roadmap (architecture in place, not yet implemented)

Canvas API sync · Google Calendar sync · Slack/Discord notifications · grade
tracking · study timer · per-class notes · document uploads · recurring tasks ·
authentication · mobile app.
