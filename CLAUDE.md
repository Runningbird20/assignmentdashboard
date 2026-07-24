# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

StudentOS: a local-first productivity dashboard for college students (classes,
assignments, calendar, to-dos) with one-way import of assignments from a
Google Sheet. No accounts, no AI/LLM usage anywhere in the app itself.

## Commands

### Backend (Python 3.12, FastAPI)

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

python -m app.database.seed            # seed demo data (no-ops if data exists)
python -m app.database.seed --force     # drop all tables and reseed

uvicorn app.main:app --reload           # http://localhost:8000, docs at /docs
```

There is no test suite yet. Verify backend changes by running the server and
exercising endpoints with `curl`, or by writing a throwaway script that calls
the relevant `services/*.py` function directly against a `SessionLocal()`.

### Frontend (React 19 + TypeScript + Vite)

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
npm run build        # tsc (type-check) && vite build — this IS the type-check/lint gate
npm run preview
```

There is no separate lint or test command — `npm run build` running `tsc`
with `strict`, `noUnusedLocals`, and `noUnusedParameters` is the correctness
gate for the frontend. Always run it after frontend changes.

### Docker

```bash
docker compose up --build
# seed inside the container:
docker compose exec backend python -m app.database.seed
```

Backend on 8000, frontend on 5173, SQLite persisted in the `backend-data`
volume.

### Local port conflicts

Ports 8000/5173 may already be in use by something else on the machine. If
so, run the backend on another port (`uvicorn app.main:app --reload --port
8080`) and set `VITE_API_URL` accordingly in `frontend/.env` — **Vite only
reads `frontend/.env` at startup**, not the repo-root `.env` (that one is
only consumed by `docker-compose.yml`). Restart the Vite dev server after
changing it.

## Architecture

### Backend layering — routers are thin, services own everything

`routers/*.py` → `services/*.py` → `models/*.py`. Every router endpoint is a
few lines that calls a service function and wraps the result in a Pydantic
response schema; **all validation, duplicate-checking, and DB queries live in
`services/`, never in routers**. When adding an endpoint, add the logic to a
service first and keep the router a thin pass-through — this is the
established pattern across every existing router.

Domain errors are raised as exceptions (`NotFoundError`, `ConflictError`,
`SheetImportError` in `core/exceptions.py`), not returned as ad hoc JSON —
`register_exception_handlers` in `main.py` converts them to HTTP responses
centrally.

`api/router.py` aggregates all routers into one `api_router` included by
`main.py`. `api/deps.py` defines `DbSession` (an `Annotated[Session,
Depends(get_db)]`) used as the parameter type on every endpoint that touches
the DB.

### Data model

Four tables: `SchoolClass`, `Assignment` (FK to class, cascade-deletes with
its class), `Todo` (personal, unrelated to classes), `Event`. All use
`TimestampMixin` (`created_at`/`updated_at`). Enums (`AssignmentStatus`,
`Priority`, `EventType`) are Python `str` Enums stored as non-native SQLite
enums (see `models/enums.py` and the `values_callable`/`native_enum=False`
pattern in the model columns) so raw string values are stored, not
SQLAlchemy's default `ENUM.NAME` encoding.

`meeting_days` on `SchoolClass` is stored as a comma-separated string
(`"Mon,Wed,Fri"`) but exposed as a `list[str]` at the API boundary — the
split/join happens in `schemas/school_class.py` (a `field_validator`) and
`services/class_service.py` (`_to_column_values`), respectively. If you add a
field to `ClassCreate`/`ClassUpdate`, check whether it needs the same
transform.

Uniqueness is enforced at the service layer, not just the DB: class names are
unique case-insensitively (`class_service.find_by_name`), and assignment
names are unique per-class case-insensitively
(`assignment_service.find_duplicate`). Both raise `ConflictError` → HTTP 409.
Since a `Class` only has one `meeting_time`/`meeting_days` pair, a course
with multiple genuinely different meeting patterns (lecture + lab, say)
has to exist as multiple `Class` rows with distinct names — there's no way
to model "one course, several time slots" as a single row.

`SchoolClass.section_type` (`SectionType`: lecture/lab/recitation/exam/
other) distinguishes those rows when a course code repeats. There's no
Alembic in this project, so this column — the only schema change since the
app's initial build — was added via `database/migrations.py`, an idempotent
`ALTER TABLE ... ADD COLUMN` guarded by a `PRAGMA table_info` check, run
from `main.py`'s lifespan (after `Base.metadata.create_all`) and from
`database/seed.py`. Follow the same pattern for any future column addition
on an existing table — don't reach for `--force` reseeding, which would
discard real user data.

### Dashboard aggregation

`services/dashboard_service.py` is the one place that reads across all four
tables and computes "today", "this week", and stats in a single pass — it's
intentionally not decomposed into per-table endpoints on the frontend side.
If dashboard logic needs to change, change it here rather than duplicating
date-window logic elsewhere.

### Google Sheets import

`services/google_sheets.py` fetches rows via the sheet's public CSV export
endpoint — works for anything shared as "Anyone with the link can view",
zero setup, no API key. `services/import_service.py` then merges
those rows against existing `Assignment`s by `(class_id, name.lower())`:
unknown assignments are inserted, existing ones with a changed due date are
updated, identical ones are skipped, and unknown class names are
auto-created. This merge logic is what the scheduled auto-sync job
(`scheduler/jobs.py`, gated by `AUTO_SYNC_ENABLED`) also calls — keep them
sharing the same `sync_from_sheet` entry point rather than forking the logic.

### GT Scheduler .ics import

`services/ics_import_service.py` parses the `.ics` calendar file GT
Scheduler exports, using the `icalendar` library — a deterministic parse of
a standard format, not OCR/CV/AI (that was an earlier approach; it's been
replaced). Each `VEVENT`'s `SUMMARY` (course code) + `DESCRIPTION` (course
title) become the class name, `LOCATION` the room, and the weekly `RRULE`'s
`BYDAY` the meeting days.

Two merge/disambiguation passes matter here:
- GT Scheduler sometimes exports one weekly class as several single-day
  `VEVENT`s instead of one `VEVENT` with multiple `BYDAY` values (seen with
  its own recurring extracurricular entries, e.g. band). Events sharing a
  name **and** an identical meeting time are merged into one entry with
  combined `meeting_days`.
- Events sharing a name but with a **different** time (a lecture vs. a
  separate recitation section under the same course code) are kept as
  separate entries. `_flag_and_disambiguate_sections` groups the parsed
  results by the raw GT Scheduler course code (the `SUMMARY` field, tracked
  separately from the display `name` for exactly this purpose — see
  `_ParsedEvent.course_code`), and for any code appearing more than once:
  sets `needs_section_type=True` on every member, and disambiguates the
  otherwise-identical names by appending each one's meeting days.

There's no instructor field in this format, so `professor` is always
`None` from this path — the frontend leaves it editable per row.

The `POST /import/gt-schedule` route is preview-only — it never touches the
database. It returns `ParsedClassPreview` rows for the frontend
(`GtScheduleImportDialog.tsx`) to display as editable fields; only when the
user confirms does the frontend loop over rows and call the normal
`POST /classes` endpoint for each one (via the existing `useCreateClass`
mutation), so duplicate-name validation still applies per row. When a row
has `needs_section_type: true`, the dialog requires a `section_type`
selection before `handleImport` will proceed at all (blocks with an inline
error naming the offending row) — this is deliberately a hard block, not a
soft warning, since GT Scheduler gives no other signal for which block is
the lecture vs. the lab.

### Grouping classes by course code (Classes page)

`utils/courseCode.ts` extracts a course code from a class name by taking
everything before the first `:` (matching the "CODE: Title" convention used
by seed data, the sheet importer, and the .ics importer alike — see
`extractCourseCode`/`stripCourseCode`/`groupByCourseCode`). This is a naming
heuristic, not a stored relationship — there's no `course_code` column
anywhere; a class whose name doesn't contain a colon just ends up in its
own singleton group, which is harmless. `ClassesPage.tsx` renders a group of
one as a normal `ClassCard`; a group of two or more renders as
`ClassCardGroup.tsx` instead — one outer card with a shared header (code +
section count) and each class as a compact row inside, tagged with
`SectionTypeBadge` or an "Type not set" hint. If you rename a class such
that it no longer starts with `"{code}:"`, it silently drops out of its
group on next render — that's expected, not a bug to chase.

### Frontend data flow

Every server-state read/write goes through a TanStack Query hook in
`hooks/use*.ts`, which wraps a typed fetch function in `api/*.ts`, which
calls the shared `api` client in `api/client.ts` (adds base URL, JSON
headers, and normalizes error bodies into `ApiError`). Components never call
`fetch` directly. Mutations invalidate the relevant query keys on success
(see e.g. `useCreateAssignment` invalidating both `["assignments"]` and
`["dashboard"]`) — when adding a new mutation, check what else on the
dashboard/calendar needs to be invalidated alongside its own resource.

`hooks/useTodos.ts`'s `useReorderTodos` does optimistic cache updates
(`onMutate`/`onError` rollback) for drag-and-drop reordering — this is the
one hook that deviates from the simple invalidate-on-success pattern; follow
it if adding other reorderable/drag-and-drop lists.

Routing (`App.tsx`) is flat: every page mounts under a single `AppLayout`
(sidebar + navbar + `<Outlet />`). Sidebar-collapsed state and theme are
persisted via `useLocalStorage`/`useTheme`, not server state.

### UI kit

`components/ui/` is a small hand-rolled shadcn-style kit (not the shadcn CLI)
built on `class-variance-authority`, `tailwind-merge`, and Radix primitives
(only `Dialog` currently). `Select` is a styled native `<select>`, not a
Radix listbox — keep new dropdown-like inputs consistent with that unless
there's a reason to pull in another Radix primitive. Feature-specific
components live in per-domain folders (`components/classes/`,
`components/assignments/`, `components/todos/`, `components/calendar/`);
`components/shared/` is for cross-domain reusable pieces (badges, empty
states, confirm dialogs).

Tailwind v4 is configured via `@tailwindcss/vite` (no `tailwind.config.js`);
theme tokens (light/dark color pairs) are CSS custom properties in
`index.css` under `@theme inline`, referenced as `bg-background`,
`text-muted-foreground`, etc. Dark mode is a `.dark` class on `<html>`,
toggled by `useTheme` and applied pre-paint by an inline script in
`index.html` to avoid a flash.

### Roadmap / stretch goals

`ideas.md` (also referenced as `IDEAS.md`) has a fuller list, but the
short version: Canvas sync, Google Calendar sync, Slack/Discord
notifications, grade tracking, study timer, authentication, and a mobile
app are explicitly out of scope for now but the service-layer architecture
is meant to accommodate them as new `services/*.py` + `routers/*.py` pairs
without restructuring existing code. The Notes and Files tabs on the class
detail page are both real now (see below), as is recurrence for to-dos and
assignments (see below); only Upcoming Exams is still an intentional
stubbed placeholder — see `ClassDetailPage.tsx`.

### File uploads

Per-class file uploads (`ClassFile` model, `services/file_service.py`,
`routers/files.py`) follow the same layering as everything else, plus one
extra seam: `services/file_storage.py` is the *only* module that knows
where bytes actually live on disk (under `UPLOAD_DIR`, default `./uploads`,
generated `uuid4`-based filenames — never derived from the user's original
filename, so there's no path-traversal or collision risk). Swapping to
S3-compatible storage later means rewriting that one module; nothing else
(model, schema, router, frontend) references the filesystem directly.

`ClassFileRead` deliberately excludes `storage_key` — don't add it to the
API response, it's an internal detail. Downloads go through
`GET /files/{id}/download`, which streams from `file_storage.path()` with
the *original* filename in the `Content-Disposition` header.

Deleting a file removes both the DB row and its disk blob
(`file_service.delete_file`). Deleting a *class* cascades the `ClassFile`
rows via the ORM relationship, but that cascade only removes DB rows — disk
cleanup for a class's files is done explicitly in
`class_service.delete_class` (iterates `school_class.files` and calls
`file_storage.delete` before deleting the class). If you add another
cascade-deleted child model that owns disk/external resources, follow this
same pattern rather than relying on the ORM cascade alone.

### Per-class notes

`Note` (`models/note.py`) is the simplest CRUD model in the app — no
uniqueness constraint, no external storage, just `class_id`/`title`/`body`
following the exact same `services/note_service.py` → `routers/notes.py`
shape as assignments. `body` is stored as raw markdown text; there is
**no server-side markdown processing at all** — rendering happens entirely
client-side via `components/shared/Markdown.tsx`, a thin wrapper around
`react-markdown` with per-element Tailwind classes passed through its
`components` prop (there's no `@tailwindcss/typography` plugin installed,
so this is the styling mechanism, not a `prose` class). `react-markdown`
does not render raw embedded HTML by default, which is what makes this safe
against injected `<script>`/`<img onerror>` payloads in note bodies without
a separate sanitizer — don't add `rehype-raw` (or similar) to this pipeline
without also adding sanitization, or that safety property goes away.

`ClassNotesTab.tsx`'s list view intentionally does *not* render markdown for
the preview snippet — `previewText()` strips common markdown markers
(`#`, `*`, `_`, list bullets, link syntax) down to plain text instead. This
sidesteps needing to sanitize/clamp rendered HTML just for a one-line
preview; the full `Markdown` render only happens in `NoteFormDialog`'s
Write/Preview toggle and would be the place to add a read-only full-note
view later if the one-line list snippet stops being enough.

Like Files, notes are attached to `ClassDetailPage`'s `primarySection.id`
(the first section in a course's group) rather than aggregated across every
section's `class_id` — see the File uploads section above for why, and the
same caveat about deleting that particular section applies here too.

### Recurring to-dos and assignments

`recurrence_frequency` (`RecurrenceFrequency`: daily/weekly/monthly) and
`recurrence_interval` (default 1, e.g. "every 2 weeks") live directly on
`Todo` and `Assignment` — there is deliberately no separate
template/instance model. A row *is* the current occurrence; the logic in
`services/recurrence_service.py` (`generate_due_recurrences`) is a
"roll-forward": for every row whose `recurrence_frequency` is set and whose
due date has passed, it creates a new row for the next occurrence
(`_next_due_date`, using `dateutil.relativedelta` for calendar-correct
month math) and clears `recurrence_frequency` on the *old* row. Clearing
the old row's field is what makes repeated calls idempotent — a row that's
already rolled forward is no longer a candidate, so there's no dedupe
table or "last generated" timestamp to maintain.

Assignments have `UniqueConstraint("class_id", "name")`. A recurring
assignment reusing its exact name every cycle would violate that, so
`recurrence_service` appends the new due date to the name only on
*generated* follow-ups (e.g. "Weekly Reflection" → "Weekly Reflection
(Jul 27)") — the user's original row keeps the name they typed. Todos have
no such constraint and don't need this.

Generation is wired into two places, both calling the same function so
there's exactly one code path to reason about:

- **Opportunistically on read** — the first line of `list_todos`,
  `list_assignments`, and `get_dashboard` calls
  `recurrence_service.generate_due_recurrences(db)` before querying, so
  results are always current even if the scheduled job hasn't run yet.
- **A scheduled job** (`scheduler/jobs.py`,
  `generate_recurring_instances_job`) runs hourly via the same APScheduler
  instance used for Google Sheet auto-sync, as a backstop for occurrences
  that would otherwise only advance the next time someone hits a read
  endpoint.

`generate_due_recurrences` never raises — it wraps the actual work in
try/except, logs, and rolls back on failure. This runs on hot read paths
(every todos/assignments/dashboard fetch), so a bug in the recurrence logic
must degrade to "todos didn't roll forward this time" rather than a 500 on
otherwise-unrelated endpoints.

The frontend's `components/shared/RecurrenceFields.tsx` is a shared
"Repeat" control used by both `TodoFormDialog` and `AssignmentFormDialog`;
`utils/constants.ts`'s `describeRecurrence()` turns the frequency/interval
pair into copy like "Repeats every 2 weeks" for the `Repeat` icon's tooltip
in `TodoItem.tsx`/`AssignmentsTable.tsx`.
