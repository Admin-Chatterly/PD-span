# PD-span

Intelligence board for a FiveM police roleplay department: people (with or
without a known identity), organizations, notes, vehicles, cases, and the links
between them. A corkboard with strings, but searchable.

Stack: Next.js 16 (App Router, Server Actions) · Supabase (Postgres, Auth,
Storage) · Tailwind 4 + shadcn/ui · Vercel.

## Setup

### 1. Supabase project

Create a project at supabase.com (free tier is fine; Stockholm is the closest
region). Then:

- **Schema.** Open the SQL editor, paste the whole of
  `supabase/migrations/0001_init.sql`, run it. Alternatively use the CLI:
  `npx supabase link --project-ref <ref>` then `npx supabase db push`.
- **Auth.** Authentication → Sign In / Providers → Email: enabled.
  Authentication → Settings: turn **off** "Allow new users to sign up" so only
  accounts you create can log in. Add officers under Authentication → Users →
  Add user (tick auto-confirm). To give someone a callsign, set their user
  metadata to `{"callsign": "Unit 12"}` when creating them, or edit the
  `profiles` table afterwards.
- **Keys.** Project Settings → API: copy the project URL and the anon /
  publishable key.

Optional: `supabase/seed.sql` inserts a few fictional people, gangs, vehicles,
notes and a case so there is something to click on. Delete them when you are
done.

### 2. Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon or publishable key>
```

Set them in the Vercel project (Settings → Environment Variables) and in
`.env.local` for local development (see `.env.example`).

### 3. Deploy

The Vercel project is linked to this GitHub repository; pushes to `main`
deploy to production, other branches get preview URLs.

## Development

```
pnpm install
pnpm dev          # http://localhost:3000
pnpm check        # eslint + tsc
pnpm build
```

Schema changes go in a new file under `supabase/migrations/`. To validate the
whole schema against a throwaway local Postgres (needs `psql` and a server):

```
DATABASE_URL=postgresql://postgres@127.0.0.1:5432/pdspan_check pnpm db:check
```

This applies `supabase/dev/shim.sql` (stand-ins for Supabase's auth and storage
schemas), every migration, the seed, and the assertions in
`supabase/dev/checks.sql`. It drops the public schema first, so never point it
at a real project.

`lib/database.types.ts` is written by hand to match the migration. Once you
have a database URL you can regenerate it:
`SUPABASE_DB_URL=postgresql://... pnpm types:gen`.

## Data model

| Table | What it is |
| --- | --- |
| `people` | Suspects and persons of interest. Every field except `id` is optional; a row can be only a description. `status` is one of the values in `lib/constants.ts`. |
| `organizations` | Gangs, crews, cartels, businesses. |
| `memberships` | People ↔ organizations, with a role and a confirmed/suspected flag. |
| `associates` | Person ↔ person links, undirected, one row per pair. |
| `notes` | The intel log. Attaches to a person, an organization, a case, any mix, or nothing. Tags, source, confidence, and the author (from the session). |
| `vehicles` | Plates and models, optionally tied to a person. Plates are stored upper-case. |
| `cases` / `case_links` | An investigation and the people/organizations in it. |
| `evidence` | Images in the private `intel` storage bucket, attached to a person, organization or case. |
| `profiles` | One row per login, holding the officer's callsign. |

Views `people_overview`, `organizations_overview`, `cases_overview` back the
list pages. Functions: `search_all(term)` for global search, `merge_people(keep,
drop)` to fold a duplicate (for example an "unknown" entry that turns out to be
someone already on file) into another record, and `distinct_tags()` for the tag
filter.

## Access model

Every table has Row Level Security enabled. Only signed-in users (the
`authenticated` role) can read or write; the anon key sees nothing. The storage
bucket is private and files are served through short-lived signed URLs. The
site's proxy redirects anonymous visitors to `/login`, and every Server Action
checks the session again.
