# StudentOS

A personal productivity dashboard for college students: classes, assignments, a
monthly calendar and a personal to-do list in one place, with one-click import
of assignments from a Google Sheet.

- **Dashboard** — greeting, today's schedule, today's tasks, assignments due
  today and this week, upcoming events, and quick statistics.
- **Classes** — professor, location, meeting days/time, office hours and a
  color used everywhere the class appears. Can be bulk-imported from a
  GT Scheduler `.ics` export. Sections of the same course code (e.g. a
  lecture and its lab) are grouped into one stacked card, each tagged
  Lecture/Lab/Recitation/Exam. Each class has a Files tab for uploading
  syllabi, slides, and other documents, and a Notes tab with a simple
  markdown editor.
- **Assignments** — searchable, sortable table with status, priority, notes,
  and optional recurrence (daily/weekly/monthly).
- **To-dos** — personal tasks with drag-and-drop ordering and optional
  recurrence (daily/weekly/monthly).
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
| `UPLOAD_DIR` | `./uploads` | Where uploaded class files are stored |
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
   is needed — the backend fetches the sheet via its public CSV export.
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

## Importing from GT Scheduler

On the **Classes** page, **Import from GT Scheduler** accepts the `.ics`
calendar file exported from GT Scheduler and proposes classes to create.

This is a deterministic parse of a standard calendar format (via the
`icalendar` library) — **no OCR, no AI/LLM involved**. Each `VEVENT` becomes
a candidate class: `SUMMARY` is the course code, `DESCRIPTION` the course
title, `LOCATION` the room, and the weekly `RRULE` gives the meeting days.
Events that share a name and an identical meeting time (GT Scheduler
sometimes exports one weekly class as several single-day events) are merged
into one entry with combined days; events that share a name but have a
genuinely different time — a lecture and a separate recitation section
under the same course code, say — are kept as separate entries and
disambiguated by appending their meeting days, since every class needs a
unique name. The export doesn't include instructor names, so add those
manually if you'd like them. Nothing is written to the database until you
review and confirm — every field in the preview is editable and rows can be
excluded.

Whenever a course code shows up more than once (GT Scheduler blocks out a
course's lecture, lab, recitation, and exam as separate calendar events),
the import review requires you to label each one — **Lecture**, **Lab**,
**Recitation**, or **Exam** — before it lets you import; the "Import"
button is blocked until every repeated section has a type. On the Classes
page, sections sharing a course code are grouped into one card so the
lecture and its lab/recitation/exam show up together instead of as
separate, disconnected entries.

## Recurring To-dos & Assignments

To-dos and assignments can repeat daily, weekly, or every N days/weeks/months
(set "Repeat" in the create/edit form; a due date is required for a repeating
to-do since a next occurrence needs somewhere to roll forward to).

There's no separate template/instance model — a row *is* the current
occurrence. When its due date arrives, the backend creates the next
occurrence and clears `recurrence_frequency` on the old row, so the old row
becomes an ordinary, non-repeating, completed-in-place item and the new row
picks up the repeat icon. Because assignments have a `(class_id, name)`
uniqueness constraint, generated follow-ups get their due date appended to
the name (e.g. "Weekly Reflection (Jul 27)") to stay unique — the first,
user-created occurrence keeps its original name.

Generation happens opportunistically: every `GET /todos`, `GET /assignments`,
and `GET /dashboard` call checks for and creates any past-due next
occurrences before returning results, so the list is always current without
waiting on a background job. A scheduled job (APScheduler, same mechanism as
the Google Sheet auto-sync) also runs hourly as a backstop for occurrences
that would otherwise only advance the next time someone opens the app. Both
paths call the same `recurrence_service.generate_due_recurrences`, which
never raises — a failure is logged and rolled back rather than breaking a
read endpoint.

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
| POST | `/import/gt-schedule` | Parse a GT Scheduler .ics export (preview only) |
| GET/POST | `/files` | List (`?class_id=` filter, required) / upload a file |
| GET | `/files/{id}/download` | Download a file |
| DELETE | `/files/{id}` | Delete a file |
| GET/POST | `/notes` | List (`?class_id=` filter, required) / create a note |
| PUT/DELETE | `/notes/{id}` | Update / delete a note |

Interactive docs: `http://localhost:8000/docs`.

## Roadmap (architecture in place, not yet implemented)

Canvas API sync · Google Calendar sync · Slack/Discord notifications · grade
tracking · study timer · authentication · mobile app.
