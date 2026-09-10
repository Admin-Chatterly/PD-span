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

- **Schema.** Open the SQL editor and run every file in `supabase/migrations/`
  in name order, each pasted whole. Alternatively use the CLI:
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
`.env.local` for local development (see `.env.example`). In Vercel, tick
**Production, Preview and Development** for each variable, otherwise branch
previews run without a database; variables only take effect on a new
deployment, so redeploy after adding them. The server also accepts the
Supabase integration's names (`SUPABASE_URL`, `SUPABASE_ANON_KEY`). An
unconfigured deployment shows a setup notice on the login page instead of
failing.

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

`pnpm db:check:postgrest` goes one step further and runs the app's own data
layer, and the query shapes its Server Actions use, through a real PostgREST on
that database. This is the check that catches what TypeScript cannot: embedded
selects, foreign-key hints, `or()` and `contains()` filters, RPC argument names
and error codes.

```
POSTGREST_BIN=/path/to/postgrest \
DATABASE_URL=postgresql://postgres@127.0.0.1:5432/pdspan_check \
pnpm db:check:postgrest
```

The binary is a single static file from the
[PostgREST releases](https://github.com/PostgREST/postgrest/releases); the Linux
asset is named `postgrest-<version>-linux-static-x86-64.tar.xz`. The same script
runs against the live project when `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `E2E_EMAIL` and `E2E_PASSWORD` are set:
`pnpm exec tsx supabase/dev/postgrest-check.ts`. It cleans up everything it
creates.

`lib/database.types.ts` is written by hand to match the migration. Once you
have a database URL you can regenerate it:
`SUPABASE_DB_URL=postgresql://... pnpm types:gen`.

## Data model

| Table | What it is |
| --- | --- |
| `people` | Suspects and persons of interest. Every field except `id` is optional; a row can be only a description. `status` is one of the values in `lib/constants.ts`. |
| `organizations` | Gangs, crews, cartels, businesses. |
| `memberships` | People ↔ organizations, with a role and a confirmed/suspected flag. Managed from either side. |
| `associates` | Person ↔ person links, undirected, one row per pair. |
| `notes` | The intel log. Attaches to a person, an organization, a case, any mix, or nothing at all, which is how a tip gets recorded before anyone knows who it is about. Tags, source, confidence, and the author (from the session). Browse and filter them all at `/intel`. |
| `vehicles` | Plates and models, optionally tied to a person. Plates are stored upper-case. |
| `cases` / `case_links` | An investigation and the people and organizations in it, each with a role in that case. A link points at exactly one of the two, which the database enforces. |
| `evidence` | Either an uploaded image in the private `intel` bucket or an external link (Medal.tv clips, YouTube, Streamable, image URLs), attached to a person, organization or case. Clip links play inline; uploads render through short-lived signed URLs and never become public. |
| `profiles` | One row per login, holding the officer's callsign. |

Deleting an organization keeps the intel: notes are detached rather than
deleted, and members keep their own records. Memberships, case links and
evidence attached to the organization go with it.

Tags live only on notes, so every tag filter in the app resolves through them:
`/intel?tag=x` for the intel itself, `/people?tag=x` and `/organizations?tag=x`
for everyone with a note carrying that tag.

Ctrl+K (or cmd+K) opens one search across people, aliases, descriptions,
plates, territories, note bodies and tags, grouped by kind. Results that have no
page of their own, a vehicle or a note, open the record they belong to.

`/board` draws the corkboard: people and organizations as nodes, memberships
and associate links as edges, laid out by a force simulation and clickable
through to each record. A graph of the whole server is unreadable, so the board
is scoped to one case or one organization by default, with everyone on file
available deliberately. Edges are only drawn between nodes that are on the
board, so a link never points at something off screen.

Views `people_overview`, `organizations_overview`, `cases_overview` back the
list pages. Functions: `search_all(term)` for global search, `merge_people(keep,
drop)` to fold a duplicate (for example an "unknown" entry that turns out to be
someone already on file) into another record, and `distinct_tags()` for the tag
filter.

## Access model

Every table has Row Level Security enabled. Only signed-in users (the
`authenticated` role) can read or write; the anon key sees nothing. The storage
bucket is private: uploads go straight from the browser to Storage, so a large
image never passes through the server, and they are only ever read back through
signed URLs minted per request. The
site's proxy redirects anonymous visitors to `/login`, and every Server Action
checks the session again.
