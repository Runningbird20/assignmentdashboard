# Feature Ideas

Ideas for extending StudentOS beyond the current MVP. Each one notes rough
effort (S/M/L) and where it would live in the existing architecture
(`backend/app/services/` + `routers/` for backend, `frontend/src/pages/` +
`hooks/` for frontend) so any of these can be picked up independently.

## Academic Core

- **Grade tracking / GPA calculator** (M) — add a `Grade` model
  (assignment_id, points_earned, points_possible) and a per-class weighting
  scheme (e.g. "Homework 20%, Exams 50%, Participation 30%"). Surface a
  running grade estimate on the class detail page and a GPA card on the
  dashboard.
- **Study timer (Pomodoro)** (S) — pure frontend: a timer widget tied to a
  class or assignment, logging session length to a new `StudySession` model
  for the "time spent per class" stat below.
- **Exam countdown** (S) — the Event model already has `type: exam`; add a
  dashboard card that highlights the nearest exam with a day countdown.

## Integrations

- **Canvas API sync** (L) — the natural sibling to the Google Sheets import.
  A `canvas_service.py` using Canvas's REST API to pull assignments/due dates,
  matched into the same `Assignment` table via the same dedupe logic as
  `import_service.py`. This is the biggest lift on the roadmap since it needs
  OAuth or a personal access token flow.
- **Google Calendar sync (two-way)** (L) — push classes/assignments/events out
  as Calendar events, and optionally pull personal events in. Needs OAuth;
  start read-only (export via `.ics`, see below) before attempting two-way
  sync.
- **iCal (.ics) export** (S) — much cheaper than full Calendar sync: a
  `GET /calendar/export.ics` endpoint that serializes classes + assignments +
  events into a feed a phone's calendar app can subscribe to.
- **Slack / Discord notifications** (M) — a `notifications/` service with a
  pluggable channel interface (webhook URL in Settings), triggered by the
  existing scheduler for "due tomorrow" and "due today" digests.
- **Email digest** (S) — same idea as above, a scheduled job that emails a
  daily summary; reuses the dashboard aggregation logic in
  [dashboard_service.py](backend/app/services/dashboard_service.py).

## Productivity & UX

- **Command palette / global search** (M) — a `Cmd+K` overlay searching
  across classes, assignments and todos; pairs well with the existing
  `SearchBar` component pattern.
- **Keyboard shortcuts** (S) — `n` for new assignment, `g d` for dashboard,
  etc. — a small `useHotkeys` hook plus a shortcuts cheat-sheet in Settings.
- **Tags/labels** (M) — a many-to-many `Tag` model shared between assignments
  and todos, so things like "group project" or "reading" can cut across
  classes.
- **Natural-language quick add** (M) — parse "Essay due Friday 11pm high
  priority" into a payload client-side (no LLM — a small rule-based parser
  is enough) before opening the create form pre-filled.
- **Calendar week view** (S) — the calendar is month-only today
  ([CalendarPage.tsx](frontend/src/pages/CalendarPage.tsx)); a week view is a
  smaller data slice of the same `entriesByDay` map already built there.
- **Bulk actions on the assignments table** (S) — multi-select rows, bulk
  mark-complete or bulk delete.

## Data & Insights

- **Workload heatmap** (S) — a calendar-style heatmap (like GitHub's
  contribution graph) showing assignment density per day, useful for
  spotting a crunch week ahead of time.
- **Time-spent-per-class chart** (S) — once study sessions exist, a simple
  bar chart on the dashboard or a new Insights page.
- **Streak tracking for todos** (S) — "completed at least one todo N days in
  a row," a small motivational nudge on the dashboard.

## Collaboration & Accounts

- **Authentication** (L) — the biggest structural change: add a `User`
  model, scope every table by `user_id`, and add auth middleware. Do this
  before any multi-device or shared-data feature, since it changes the shape
  of nearly every service function's queries.
- **Shared classes / study groups** (L) — depends on auth; a join table
  letting multiple users see the same class's assignments (e.g. a study
  group splitting reading notes).
- **Shared todo lists** (M) — simpler version of the above, scoped to todos
  only (e.g. a roommate chore list).

## Mobile & Offline

- **PWA / installable app** (S) — add a manifest + service worker to the
  Vite build; mostly configuration, no architecture change.
- **Offline-first caching** (M) — TanStack Query already centralizes all
  data fetching, so persisting its cache (e.g. via
  `@tanstack/query-sync-storage-persister`) gets read-only offline support
  cheaply. Offline *writes* (queued mutations) are a bigger lift.
- **Push notifications** (M) — pairs naturally with a PWA; needs a service
  worker + the same "due tomorrow" logic already planned for Slack/email.

## Suggested order

If picking a next milestone, a reasonable sequence given what's already
built:

1. iCal export (cheap, immediately useful, no OAuth) — the Notes and Files
   tabs are both done now, only Upcoming Exams is left stubbed
2. Tags + command palette (UX polish, no new integrations)
3. Slack/email due-date digests (reuses the existing scheduler)
4. Grade tracking (biggest standalone feature request students usually ask for)
5. Authentication (do this before any collaboration feature)
6. Canvas sync / Google Calendar sync (highest effort, highest payoff)
