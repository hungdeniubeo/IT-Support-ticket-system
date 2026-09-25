# IT Support Ticket System Production Implementation Plan

> **For agentic workers:** Execute this plan task-by-task in the current session. Steps use checkbox syntax for tracking.

**Goal:** Deliver a secure, polished Vietnamese IT ticket app using Supabase for authenticated cloud persistence while preserving local ticket data for explicit migration and fallback.

**Architecture:** Extend the existing domain and repository boundary, add a Supabase adapter and SQL migrations, then connect auth, history, storage, and the refined UI through those services. Keep the local adapter compatible with current v1 storage and normalize legacy values only when importing.

**Tech Stack:** React 19, TypeScript, Vite, React Router 7, Vitest, Supabase JS, PostgreSQL RLS, Supabase Storage, Tailwind CSS 4.

**Spec:** `docs/superpowers/specs/2026-09-25-it-support-production-design.md`

## Global Constraints

- Use only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the browser; never add a service-role key.
- Preserve the current localStorage ticket backup and merge imports without overwriting cloud records.
- Keep all ticket, profile, history, and attachment access scoped to the signed-in user through RLS.
- Use Vietnamese interface copy and lower-case persisted workflow values.
- Do not commit or push.

## Review Focus

- A malformed or older localStorage value must not erase the retained backup; test importing valid old-format tickets while leaving source bytes unchanged.
- A duplicate ticket number must never overwrite an existing cloud ticket; test the merge result and completion-marker behavior.
- Search punctuation must not alter the PostgREST filter expression; test escaping or normalization in the query helper.
- An unauthenticated session restore must never render protected content; verify route gating and the initial loading state.
- A file with the correct extension but an invalid MIME type or oversize payload must be rejected before upload; test the attachment validator.

---

### Task 1: Domain, local compatibility, and pure ticket behavior

**Files:**
- Modify: `src/domain/ticket.ts`
- Modify: `src/services/ticketRepository.ts`
- Create: `src/lib/ticketFilters.ts`
- Create: `src/lib/ticketValidation.ts`
- Create: `src/services/localMigration.ts`
- Modify: `src/lib/labels.ts`, `src/lib/dates.ts`
- Test: `src/services/ticketRepository.test.ts`
- Test: `src/services/localMigration.test.ts`
- Test: `src/lib/ticketFilters.test.ts`, `src/lib/ticketValidation.test.ts`, `src/lib/dates.test.ts`

**Interfaces:**
- Produce lower-case workflow types, paginated `TicketQuery` / `TicketPage`, `TicketHistoryEntry`, dashboard summary, and import result types.
- Produce pure `filterTickets`, `validateTicket`, and local migration inspection/marker helpers.
- Keep `createLocalTicketRepository(storage, now)` and the existing v1 storage key compatible.

- [x] Write tests for lower-case labels, local filtering/search/sort, ticket required-field validation, Vietnamese date formatting, old local storage decoding, account-scoped migration markers, and no-overwrite import behavior.
- [x] Run focused tests and confirm the new behavior is absent before implementation.
- [x] Implement the domain and local-adapter behavior exercised by those tests; normalize legacy statuses/priorities without mutating the stored source during inspection.
- [x] Re-run focused tests, `rtk npm test` (21 passed), and `rtk npm run build` (passed).

### Task 2: Supabase client, SQL schema, repositories, and attachments

**Files:**
- Create: `src/lib/supabase.ts`, `src/lib/database.types.ts`, `src/lib/errors.ts`
- Create: `src/services/supabaseTicketRepository.ts`, `src/services/activeTicketRepository.ts`, `src/services/supabaseAttachmentRepository.ts`
- Create: `src/services/attachmentValidation.ts` and its test
- Create: `supabase/migrations/202609250001_initial_schema.sql`
- Modify: `package.json`, `package-lock.json`
- Test: Supabase row mapping/query helper tests and attachment validation tests

**Interfaces:**
- Supabase ticket repository implements paginated search, exact dashboard counts, CRUD, history reads, full export, and merge-only import.
- Attachment service implements list, upload, signed URL, and delete using the current user's session.
- SQL migration owns sequence-safe ticket numbering, updated timestamps, meaningful history triggers, profiles, ticket/history RLS, and private bucket policies.

- [ ] Write failing tests for PostgREST search escaping, legacy-to-database row mapping, attachment extension/MIME/size rules, and friendly error mapping.
- [ ] Run the focused tests and confirm expected red results.
- [ ] Install `@supabase/supabase-js`; implement config-safe Supabase initialization and repository adapters with no service-role credential path.
- [ ] Add the complete SQL migration, including sequence-backed identifiers, auth profile trigger, least-privilege grants, RLS policies, history trigger, and user/ticket-scoped storage policies.
- [ ] Run focused tests, inspect the migration for ownership/policy coverage, and run `supabase db lint` only if the Supabase CLI is available; report unavailable remote access honestly.

### Task 3: Authentication, routing, shared feedback, and design system

**Files:**
- Create: `src/auth/AuthProvider.tsx`, `src/auth/ProtectedRoute.tsx`
- Create: `src/pages/LoginPage.tsx`, `src/components/ConfigNotice.tsx`, `src/components/ToastProvider.tsx`, `src/components/ConfirmDialog.tsx`, `src/components/Select.tsx`, `src/components/ActionMenu.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`, `src/components/AppLayout.tsx`, `src/components/FormFields.tsx`, `src/components/Button.tsx`, `src/styles.css`, `index.html`
- Test: auth-gating / form validation tests where practical

**Interfaces:**
- Auth context exposes session, user, loading/configuration state, sign-in, and sign-out.
- Protected routes wait for session restoration and preserve local fallback only when Supabase configuration is absent in development.
- Shared select, toast, dialog, and menu components provide the common accessible controls used by all pages.

- [ ] Add tests for auth/config state decisions and ticket form validation before changing route/page behavior.
- [ ] Run those tests to confirm the missing behavior.
- [ ] Implement login-only Supabase Auth, loading gate, `/login` redirect, `/dashboard` redirect, missing-config message, accessible reusable controls, and a responsive sidebar.
- [ ] Apply Inter, consistent typography/control tokens, visible focus styles, and reduced-motion-aware transitions.
- [ ] Run focused tests and `rtk npm run build` to catch route and type integration errors.

### Task 4: Ticket workflow, history, migration UI, and settings

**Files:**
- Modify: `src/hooks/useTickets.ts`, `src/pages/DashboardPage.tsx`, `src/pages/TicketsPage.tsx`, `src/pages/TicketCreatePage.tsx`, `src/pages/TicketDetailPage.tsx`, `src/pages/SettingsPage.tsx`, `src/pages/KnowledgePage.tsx`
- Modify: `src/components/TicketTable.tsx`, `src/components/TicketBadges.tsx`, `src/components/FormFields.tsx`
- Create: `src/components/LocalMigrationPrompt.tsx`, `src/components/AttachmentPanel.tsx`, `src/components/TicketHistory.tsx`

**Interfaces:**
- Hooks consume repository query/dashboard methods and surface stable loading/error states.
- Ticket pages consume shared select/dialog/toast services; detail displays repository history and private attachments.
- Settings export all cloud/local tickets and merge a selected JSON backup only after user confirmation.

- [ ] Add tests for migration inspection/import results and workflow filtering before page changes.
- [ ] Run focused tests and confirm the expected failures.
- [ ] Implement dashboard attention, debounced server search, filters, pagination, validated create/edit, dirty-navigation warning, activity timeline, attachment upload/open/delete, and settings import/export.
- [ ] Verify each visible loading, error, empty, success, and destructive confirmation state uses Vietnamese copy.
- [ ] Run `rtk npm test` and `rtk npm run build`.

### Task 5: Deployment configuration and handoff docs

**Files:**
- Create: `.env.example`, `vercel.json`
- Modify: `.gitignore`, `README.md`

- [ ] Add secret-safe environment examples and ignore `.env`, `.env.local`, and `.env.*.local` while allowing `.env.example`.
- [ ] Add Vercel SPA rewrite and document Supabase project/auth setup, migrations, local development, tests/build, environment variables, and deployment.
- [ ] Run final `rtk npm test` and `rtk npm run build`; inspect `rtk git diff --check` and `rtk git status --short`.
- [ ] Report implemented behavior, migration SQL/RLS, test/build results, Supabase and Vercel setup still needed, and exact next Git commands without executing them.
