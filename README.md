# Flowboard

A polished, real-time Kanban task board — built with React, TypeScript, and Supabase. Create tasks, drag them across `To Do → In Progress → In Review → Done`, assign teammates, tag with labels, comment, and track activity history, all backed by a guest (anonymous) account so every visitor gets their own private board.

**Live demo:** _add your Vercel URL here after deploying_
**Repo:** https://github.com/IbrahimTayeb/flowboard

---

## 1. Overview & design decisions

Flowboard is a single-page React app that talks directly to Supabase (Postgres + Auth + Realtime) from the client — no custom backend server. That keeps the stack small while still meeting every requirement: persistence, auth, RLS, and live updates.

**Stack**

| Layer | Choice | Why |
|---|---|---|
| Framework | React 19 + TypeScript + Vite | Fast dev loop, strict typing catches schema/UI drift early |
| Styling | Tailwind CSS v4 | Design tokens (`@theme`) give one source of truth for color/type/shadow, used to build a cohesive Linear/Notion-style system rather than ad-hoc utility soup |
| Drag & drop | `@dnd-kit` | Accessible, unopinionated, supports cross-container drag with a floating `DragOverlay` for the "lifted card" feel |
| State | Zustand (UI state) + hand-rolled hooks (server state) | The data itself lives in Supabase; hooks (`useTasks`, `useTeamMembers`, …) are thin wrappers that fetch + subscribe to Realtime + expose mutations. Zustand only holds ephemeral UI state (filters, modals, theme) — no need for a heavier data-fetching library at this scale |
| Backend | Supabase (Postgres, Auth, Realtime) | Meets the "Free Tier" requirement directly; RLS gives per-user data isolation without writing any server code |

**Design system.** Rather than defaulting to a generic component-library look, the palette, spacing, and shadows are defined once in [`src/index.css`](src/index.css) as CSS custom properties (`--color-brand-500`, `--shadow-card`, etc.), consumed as Tailwind v4 theme tokens. Both a light and dark theme are fully styled (auto-detected from the OS on first load, toggleable after that, persisted to `localStorage`). Every interactive surface (cards, columns, modals) uses consistent radii, shadow escalation on hover, and a single accent color (indigo/violet) so the UI reads as one system rather than a collage of defaults.

**Real-time model.** Every mutation writes to Supabase first; the UI also subscribes to Postgres change events (`supabase.channel(...).on('postgres_changes', …)`) on `tasks`, `comments`, `activity_log`, `task_assignees`, and `task_labels`. That means the board updates live if you open it in two tabs (or two guest sessions), not just "on drop" for the tab that made the change.

**Drag & drop mechanics.** Dragging updates local state immediately (optimistic) via `onDragOver`, so the card visually jumps columns before the network round-trip completes; the actual status/position write happens in `onDragEnd`. Column order is stored as a floating-point `position` column — inserting a card between two others just averages their positions, so a drop only ever needs to write the one moved row instead of re-indexing the whole column.

---

## 2. Database schema

Full SQL lives in [`supabase/schema.sql`](supabase/schema.sql) — paste it into the Supabase SQL Editor once. Summary:

```
team_members        id, user_id, name, color, avatar_url, created_at
labels               id, user_id, name, color, created_at
tasks                id, user_id, title, description, status, priority,
                     due_date, position, created_at, updated_at
task_assignees       task_id, member_id            (many-to-many)
task_labels          task_id, label_id             (many-to-many)
comments             id, task_id, user_id, author_name, body, created_at
activity_log         id, task_id, user_id, type, detail, created_at
```

Notes vs. the field list in the brief:

- `status` is constrained to `todo | in_progress | in_review | done`; `priority` to `low | normal | high`.
- The brief lists a single `assignee_id` — the "Additional Features" section then asks for *multiple* assignees per task, so this implements that as the superset: a `task_assignees` join table instead of a single FK column.
- Every table has `user_id` (or, for the two join tables, ownership derived via the parent `tasks.user_id`) and RLS policies of the form `using (auth.uid() = user_id)`, so Postgres itself — not app code — enforces that guests only ever see their own rows.
- `tasks.position` is a `double precision`, enabling O(1) reordering (see above).
- All five mutable tables are added to the `supabase_realtime` publication so client subscriptions receive live change events.

---

## 3. Setup — running locally

**Prerequisites:** Node 18+, a free [Supabase](https://supabase.com) account.

```bash
git clone <your-repo-url>
cd kanban-board
npm install
```

**Create the Supabase project:**

1. [supabase.com/dashboard](https://supabase.com/dashboard) → New project.
2. Authentication → Sign In / Providers → enable **Anonymous Sign-Ins** (off by default).
3. SQL Editor → paste all of [`supabase/schema.sql`](supabase/schema.sql) → Run.
4. Project Settings → API → copy the **Project URL** and **anon public** key.

**Configure the app:**

```bash
cp .env.example .env.local
# then edit .env.local:
#   VITE_SUPABASE_URL=https://<your-ref>.supabase.co
#   VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

**Run it:**

```bash
npm run dev       # starts Vite on http://localhost:5173
npm run build     # typecheck + production build to dist/
npm run preview   # serve the production build locally
```

On first load the app calls `supabase.auth.signInAnonymously()` automatically — no login screen, no signup form. Each browser/guest session gets its own `user_id`, and RLS makes sure that guest only ever sees rows it created. Opening the app in a second browser (or an incognito window) demonstrates the isolation: it starts with an empty board of its own.

**Deploying to Vercel:** `vercel` (or connect the GitHub repo in the Vercel dashboard) → set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Environment Variables in the Vercel project settings → deploy. Build command `npm run build`, output directory `dist` (Vercel's Vite preset detects this automatically).

---

## 4. Features

**Core board**
- Four columns (`To Do`, `In Progress`, `In Review`, `Done`), drag-and-drop via `@dnd-kit`, optimistic + realtime-synced.
- Create tasks with title, description, priority, due date, initial status, assignees, and labels in one modal.
- Task detail slide-over: inline-editable title/description/priority/due date/status.

**Team members & assignees** — Header → people icon opens a modal to add members (name + auto-assigned color, used for their avatar). Multi-select assignees per task; avatars stack on the card (`AvatarStack`, overflow shown as `+N`).

**Comments** — Per-task thread in the detail panel, chronological, each with author + relative timestamp (`date-fns`), stored in `comments` and streamed live.

**Activity log** — Every status change, edit, (re)assignment, label change, and comment automatically appends a row to `activity_log` (e.g. *"Moved from To Do → In Progress"*), rendered as a timeline with relative + absolute timestamps.

**Labels** — Header → tag icon manages a label set (name + color). Multi-select per task; board can be filtered to a single label.

**Due date urgency** — Cards get a badge: red "overdue" (past due, not done) or amber "due soon" (≤2 days out); `Done` tasks never show urgency. Logic in [`src/lib/dueDate.ts`](src/lib/dueDate.ts).

**Search & filtering** — Live search by title, plus independent filters for priority, assignee, and label, all combinable. Filtered-to-empty columns show "No matching tasks" rather than the misleading "add your first task" prompt.

**Summary stats** — Header shows total tasks, completed count, and overdue count, always reflecting the *unfiltered* board.

**States** — Dedicated skeleton loading state (shimmering column placeholders), a setup screen if Supabase env vars are missing or anonymous auth is disabled, an inline dismissible error banner for mutation failures, and distinct empty states for "no tasks yet" vs. "no tasks match your filters."

---

## 5. Tradeoffs & what I'd improve with more time

- **Position math uses the filtered/visible list.** When a filter is active, drag insertion computes neighbor positions from what's currently visible, not the full unfiltered column. Rare edge case, but with more time I'd recompute against the true column order.
- **No optimistic-failure rollback UI for every mutation** — failed writes surface via the error banner and a full refetch, rather than a per-card "retry" affordance.
- **Single assignee/label picker style** (toggle chips) rather than a searchable combobox — fine at team sizes of a handful of people, would want type-ahead at 20+.
- **No pagination/virtualization** — fine for a single guest's task list, would matter at hundreds of tasks per column.
- **No automated tests.** Given the time box, verification was manual (typecheck, production build, and an end-to-end pass in-browser against a real Supabase project: task creation, drag-and-drop persistence across reloads, comments, activity log, team/labels CRUD, filters, search, light/dark themes, mobile layout). I'd add Vitest + React Testing Library for the hooks (`useTasks` mutation logic, `dueDate` urgency calculation) and Playwright for the drag-and-drop flow next.
- **Realtime granularity** — the `tasks` subscription refetches the whole list on any change rather than patching a single row; simpler and correct, but not the most bandwidth-efficient at large scale.
- **Guest sessions are device/browser-local** — Supabase anonymous auth persists via `localStorage`, so clearing site data or switching browsers starts a fresh guest board. There's no "claim this account" upgrade path (Supabase supports linking an anonymous user to a real email/password later) — natural next step if this needed to survive across devices.
