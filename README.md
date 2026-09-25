# IT Support Ticket System

A personal IT helpdesk for recording support requests, tracking investigation and resolution work, and keeping a searchable ticket history. The interface is in Vietnamese and is designed for one IT Support user, while the database keeps each user's records isolated for future multi-user use.

## Stack

- React 19, TypeScript, Vite, Tailwind CSS 4, React Router
- Supabase Auth, PostgreSQL, Row Level Security, and private Storage
- LocalStorage repository retained for offline development and one-time data import
- Vitest

## Local development

Use Node.js 20.19+ or 22.12+ (Vite 7 requirement).

```sh
npm install
cp .env.example .env.local
npm run dev
```

The app reads these Vite variables:

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

The publishable key is intended for browser use. Never put a Supabase secret or service-role key in a `VITE_` variable. When Supabase is not configured, Vite development mode opens the LocalStorage version and shows a setup notice. A production build without Supabase configuration shows a configuration message instead of crashing.

## Supabase setup

1. Create a Supabase project and copy its Project URL and **Publishable key** into `.env.local`. Keep the publishable key in the browser; do not use a secret or service-role key.
2. Enable Email/Password authentication. This app does not expose public signup. Create the first IT Support user from Supabase Dashboard → Authentication → Users.
3. Install and authenticate the Supabase CLI if it is not already available:

   ```sh
   npm install --save-dev supabase
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```

4. Review and apply the checked-in database migration:

   ```sh
   npx supabase db push --dry-run
   npx supabase db push
   ```

   `supabase/migrations/202609250001_initial_schema.sql` creates the profile, ticket, and ticket-history tables, ticket-number sequence and triggers, Row Level Security policies, and private attachment bucket/policies. Future schema changes should be added as new timestamped SQL migrations and applied through the CLI.
5. Restart the Vite development server after editing `.env.local`, then sign in at `/login`.

If the Supabase CLI was installed globally, use `supabase ...` in place of `npx supabase ...`. The checked-in `supabase/config.toml` is ready for the CLI; no schema setup in the Dashboard is required. The app uses only the signed-in user's JWT and relies on RLS for ticket and attachment access.

### Local Supabase stack (optional)

To run migrations against a local Supabase stack, install the CLI and Docker-compatible container runtime, then run `npx supabase start` and `npx supabase db reset`. Set `.env.local` to the local URL and publishable key printed by `supabase start` while developing against that stack.

## Data migration and backup

After the first Supabase login, the app checks the existing `it-support-ticket-system:v1` LocalStorage backup. If it finds valid tickets, it offers **Nhập vào tài khoản** or **Bỏ qua**. Import is merge-only: existing account tickets are never overwritten, duplicate legacy IDs or ticket numbers are skipped, and the browser backup is kept. A per-user local marker records that the import was completed or skipped.

Settings can export all account tickets to JSON and import an exported file or LocalStorage backup. Imports require confirmation and merge without replacing existing tickets.

## Development checks

```sh
npm test
npm run build
```

## Vercel deployment

1. Push this branch to GitHub when ready and import the repository in Vercel.
2. Use the Vite defaults: install command `npm install`, build command `npm run build`, output directory `dist`.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the Vercel project for the environments you will deploy, then redeploy.
4. Add the deployed site URL to Supabase Auth's allowed Site URL / redirect URL settings.

`vercel.json` rewrites client routes such as `/dashboard`, `/tickets`, `/tickets/IT-001`, and `/settings` to the Vite SPA entry point so direct loads and refreshes work.

## Repository layout

- `src/domain/`: ticket types, normalization, and validation
- `src/services/`: local and Supabase ticket/attachment repositories
- `src/auth/`: session restoration and protected routing
- `src/components/`: shared layout, controls, dialogs, feedback, history, and attachments
- `supabase/migrations/`: reproducible database schema and security policies
