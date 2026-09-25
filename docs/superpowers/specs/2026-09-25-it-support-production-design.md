# IT Support Ticket System Production Design

## Purpose

Turn the existing personal IT Support ticket app into a polished Vietnamese helpdesk that persists tickets safely in Supabase while preserving the current browser data for an explicit, repeatable migration. Keep the current React/Vite application and its working ticket workflows as the foundation.

## Architecture

- Keep ticket rules and page behavior behind a `TicketRepository` boundary. Use a localStorage adapter for development fallback, import, and backup compatibility, and a Supabase adapter for configured authenticated sessions.
- Configure Supabase only from `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (accept the legacy anon variable as fallback). The browser never receives a service-role key. A missing configuration must render a useful setup message; development may continue in explicit local mode.
- Restore Supabase sessions before rendering protected routes. Route unauthenticated users to `/login`; route authenticated users to `/dashboard`.
- Use reproducible SQL migrations for profiles, tickets, history, RLS, ticket number generation, and a private attachment bucket. Ticket writes, activity, and storage access remain scoped to `auth.uid()`.
- Paginate ticket queries, debounce search, and centralize Vietnamese errors, dates, labels, toasts, and confirmation dialogs.

## Data and migration

- Persist workflow values as `low|medium|high|critical` and `new|investigating|waiting|resolved|closed`; translate existing PascalCase browser values during import.
- Use a database sequence plus a serialized insert trigger to allocate collision-free `IT-001` style numbers, while retaining legacy numbers whenever available.
- Log creation and meaningful changed fields in `ticket_history`; display the timeline on the detail page.
- Import local tickets as a merge: never overwrite existing cloud rows, retain the local backup, show the count before import, and record an account-scoped completion/skip marker only after the operation completes.
- Store optional attachments in a private bucket at a user/ticket-scoped path with file type and size limits.

## Interface

- Retain the existing sidebar/page structure and refine it with a compact light theme, Inter, shared control heights, accessible custom selects, responsive navigation, stable loading/empty/error states, and Vietnamese copy.
- Add auth, useful dashboard attention items, server-side ticket filters/search/pagination, detail history and attachments, and account/data settings.
- Keep signup disabled in the app; accounts can be provisioned through Supabase Auth until signup is intentionally enabled.

## Delivery and verification

- Add `.env.example`, correct secret ignores, SQL migrations, Vercel SPA rewrites, and complete setup/deployment documentation.
- Cover local repository behavior, validation, filtering, label/date formatting, and migration behavior with Vitest; run `npm test` and `npm run build` before reporting completion.
- Do not commit or push changes.
