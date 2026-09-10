/**
 * Exercises the app's data layer and the query shapes its Server Actions use
 * through a real PostgREST. Catches what TypeScript cannot: embedded selects,
 * foreign-key hints, or() filters, RPC argument names, and error codes.
 *
 * Two modes:
 *  - local: scripts/postgrest-check.sh starts PostgREST on the local Postgres
 *    with the seed applied and mints a JWT; every assertion runs.
 *  - live: with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *    E2E_EMAIL and E2E_PASSWORD set, it signs in to the real project and runs
 *    the shape and mutation checks (exact seed counts are skipped). Everything
 *    it creates is deleted again.
 */
import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import { getDashboardData } from "@/lib/data/dashboard"
import { getCaseDetail, listCases } from "@/lib/data/cases"
import { getOrganizationDetail, listOrganizations } from "@/lib/data/organizations"
import {
  idsTaggedWith,
  listNoteTargets,
  listNotes,
  listTagSuggestions,
  listTags,
} from "@/lib/data/notes"
import { getPersonDetail, listPeople, searchPeople } from "@/lib/data/people"

const POSTGREST_URL = process.env.POSTGREST_URL ?? "http://127.0.0.1:3100"
const JWT_SECRET = process.env.PGRST_JWT_SECRET ?? "local-dev-secret-at-least-32-characters-long"
const USER_ID = process.env.CHECK_USER_ID ?? "00000000-0000-4000-8000-000000000001"

const MIKE = "b0000000-0000-4000-8000-000000000001"
const RED_MASK = "b0000000-0000-4000-8000-000000000004"
const GSF = "a0000000-0000-4000-8000-000000000001"
const CASE1 = "d0000000-0000-4000-8000-000000000001"

function mintJwt(claims: Record<string, unknown>): string {
  const enc = (v: string) => Buffer.from(v).toString("base64url")
  const head = enc(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const body = enc(JSON.stringify(claims))
  const sig = createHmac("sha256", JWT_SECRET).update(`${head}.${body}`).digest("base64url")
  return `${head}.${body}.${sig}`
}

/** supabase-js appends /rest/v1; a bare PostgREST serves at the root. */
const rewriteFetch: typeof fetch = (input, init) => {
  const url = (input instanceof Request ? input.url : String(input)).replace("/rest/v1/", "/")
  return fetch(url, init)
}

const LIVE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const LIVE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const live = Boolean(LIVE_URL && LIVE_KEY && process.env.E2E_EMAIL && process.env.E2E_PASSWORD)
/** Seed-dependent assertions only hold on the throwaway local database. */
const seeded = !live

const supabase = live
  ? createClient<Database>(LIVE_URL!, LIVE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  : createClient<Database>(POSTGREST_URL, "local-anon-key", {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: {
        headers: {
          Authorization: `Bearer ${mintJwt({
            role: "authenticated",
            sub: USER_ID,
            email: "tester@example.com",
            exp: Math.floor(Date.now() / 1000) + 3600,
          })}`,
        },
        fetch: rewriteFetch,
      },
    })

async function main() {
  let userId = USER_ID
  if (live) {
    const signIn = await supabase.auth.signInWithPassword({
      email: process.env.E2E_EMAIL!,
      password: process.env.E2E_PASSWORD!,
    })
    assert(!signIn.error, signIn.error?.message)
    userId = signIn.data.user.id
    console.log(`live mode against ${LIVE_URL} as ${signIn.data.user.email}`)
  }

  // --- list -----------------------------------------------------------------
  const all = await listPeople(supabase, {})
  assert(all.ok, all.ok ? "" : all.error)
  if (seeded) assert.equal(all.people.length, 6)
  if (seeded) assert.equal(all.total, 6)
  if (!seeded) console.log(`${all.total} people on file`)
  const mike = all.people.find((p) => p.id === MIKE)
  if (seeded) assert(mike)
  if (mike) {
  assert.equal(mike.organizations[0]?.name, "Grove Street Families")
  assert.equal(mike.organizations[0]?.role, "leader")
  assert.deepEqual(mike.plates, ["BIGMIKE1"])
  assert.equal(mike.noteCount, 1)
  assert(mike.lastNoteAt)
  }

  const sultan = await listPeople(supabase, { q: "sultan" })
  assert(sultan.ok, sultan.ok ? "" : sultan.error)
  if (seeded) assert(sultan.people.some((p) => p.id === RED_MASK), "description match")

  const plate = await listPeople(supabase, { q: "46-eek" })
  assert(plate.ok, plate.ok ? "" : plate.error)
  if (seeded) assert(plate.people.some((p) => p.id === RED_MASK), "partial plate finds the owner")

  const weird = await listPeople(supabase, { q: `o'neil, "x" (y) %_ \\` })
  assert(weird.ok, weird.ok ? "" : weird.error)
  if (seeded) assert.equal(weird.people.length, 0)

  const unknowns = await listPeople(supabase, { status: "unknown", sort: "name" })
  assert(unknowns.ok, unknowns.ok ? "" : unknowns.error)
  if (seeded) assert.equal(unknowns.people.length, 2)

  const byNote = await listPeople(supabase, { sort: "last_note" })
  assert(byNote.ok, byNote.ok ? "" : byNote.error)
  if (seeded) assert(byNote.people[0]?.lastNoteAt, "people with notes sort first")
  if (seeded) assert.equal(byNote.people[byNote.people.length - 1]?.lastNoteAt, null)

  const byName = await listPeople(supabase, { sort: "name" })
  assert(byName.ok, byName.ok ? "" : byName.error)
  if (seeded) assert.equal(byName.people[0]?.name, "Dante Cole")

  // --- picker search --------------------------------------------------------
  const picks = await searchPeople(supabase, "big", [RED_MASK])
  if (seeded) assert(picks.some((p) => p.id === MIKE), "alias match")
  assert(!picks.some((p) => p.id === RED_MASK), "excluded id")
  const recent = await searchPeople(supabase, "", [MIKE])
  assert(!recent.some((p) => p.id === MIKE))

  // --- detail ---------------------------------------------------------------
  const detail = await getPersonDetail(supabase, MIKE)
  if (seeded) assert(detail)
  if (detail) {
  assert.equal(detail.memberships.length, 1)
  assert.equal(detail.memberships[0]?.organization.name, "Grove Street Families")
  assert.equal(detail.memberships[0]?.is_confirmed, true)
  assert.deepEqual(
    detail.associates.map((a) => a.other.name).sort(),
    ["Dante Cole", "Tyrone Banks"]
  )
  assert.equal(detail.associates.find((a) => a.other.name === "Tyrone Banks")?.relationship, "cousin")
  assert.equal(detail.vehicles.length, 1)
  assert.equal(detail.vehicles[0]?.plate, "BIGMIKE1")
  assert.equal(detail.notes.length, 1)
  assert.equal(detail.notes[0]?.organization?.name, "Grove Street Families")
  assert.equal(detail.notes[0]?.case?.title, "Operation Green Light")
  assert.equal(detail.notes[0]?.author, null)
  assert.equal(detail.caseLinks.length, 1)
  assert.equal(detail.caseLinks[0]?.case.status, "open")
  assert.equal(detail.evidence.length, 0)
  assert.equal(detail.organizationOptions.length, 3)
  }
  assert.equal(await getPersonDetail(supabase, "b0000000-0000-4000-8000-0000000000ff"), null)
  assert.equal(await getPersonDetail(supabase, "not-a-uuid"), null)

  // --- tags + dashboard -----------------------------------------------------
  const tags = await listTagSuggestions(supabase)
  if (seeded) assert(tags.includes("chop-shop"))
  const dash = await getDashboardData(supabase)
  assert(dash.ok, dash.ok ? "" : dash.error)
  if (seeded) {
    assert.equal(dash.counts.people, 6)
    assert.equal(dash.counts.organizations, 3)
    assert.equal(dash.counts.openCases, 1)
    assert.equal(dash.recentNotes.length, 5)
    assert(dash.recentNotes.some((n) => n.person?.id === MIKE))
    assert(dash.recentNotes.some((n) => n.case?.title === "Operation Green Light"))
    assert.equal(dash.recentPeople.length, 6)
  }

  // --- intel log: filters PostgREST has to accept -----------------------------
  // The seed holds five notes: two tagged chop-shop, one attached to nothing.
  const allNotes = await listNotes(supabase, {})
  assert(allNotes.ok, allNotes.ok ? "" : allNotes.error)
  if (seeded) {
    assert.equal(allNotes.total, 5)
    assert(allNotes.notes.every((n, i, arr) => i === 0 || arr[i - 1]!.created_at >= n.created_at))

    const tagged = await listNotes(supabase, { tag: "chop-shop" })
    assert(tagged.ok, tagged.ok ? "" : tagged.error)
    assert.equal(tagged.total, 2)
    assert(tagged.notes.every((n) => n.tags.includes("chop-shop")))

    const general = await listNotes(supabase, { attachment: "general" })
    assert(general.ok, general.ok ? "" : general.error)
    assert.equal(general.total, 1)
    assert(
      general.notes.every((n) => !n.person_id && !n.organization_id && !n.case_id),
      "general intel is attached to nothing"
    )

    const attached = await listNotes(supabase, { attachment: "attached" })
    assert(attached.ok, attached.ok ? "" : attached.error)
    assert.equal(attached.total, 4)

    const bySource = await listNotes(supabase, { source: "tip" })
    assert(bySource.ok, bySource.ok ? "" : bySource.error)
    assert.equal(bySource.total, 1)

    const byConfidence = await listNotes(supabase, { confidence: "high" })
    assert(byConfidence.ok, byConfidence.ok ? "" : byConfidence.error)
    assert.equal(byConfidence.total, 2)

    // Two seeded notes mention a Sultan, one capitalised differently: the search
    // is a case-insensitive substring over the body.
    const byText = await listNotes(supabase, { q: "sultan" })
    assert(byText.ok, byText.ok ? "" : byText.error)
    assert.equal(byText.total, 2)
    assert(byText.notes.every((n) => n.body.toLowerCase().includes("sultan")))

    const combined = await listNotes(supabase, { tag: "chop-shop", confidence: "high" })
    assert(combined.ok, combined.ok ? "" : combined.error)
    assert.equal(combined.total, 1, "filters combine rather than replace each other")

    const nothing = await listNotes(supabase, { tag: "no-such-tag" })
    assert(nothing.ok, nothing.ok ? "" : nothing.error)
    assert.equal(nothing.total, 0)

    const counted = await listTags(supabase)
    assert.equal(counted.find((t) => t.tag === "chop-shop")?.uses, 2)

    // The tag filters on the people and organization lists resolve through notes.
    const taggedPeople = await idsTaggedWith(supabase, "chop-shop", "person_id")
    assert.equal(taggedPeople.length, 2)
    assert(taggedPeople.includes(MIKE))
    const taggedOrgs = await idsTaggedWith(supabase, "chop-shop", "organization_id")
    assert.equal(taggedOrgs.length, 2)
    assert(taggedOrgs.includes(GSF))

    const peopleByTag = await listPeople(supabase, { tag: "chop-shop" })
    assert(peopleByTag.ok, peopleByTag.ok ? "" : peopleByTag.error)
    assert.equal(peopleByTag.people.length, 2)
    const peopleByMissingTag = await listPeople(supabase, { tag: "no-such-tag" })
    assert(peopleByMissingTag.ok, peopleByMissingTag.ok ? "" : peopleByMissingTag.error)
    assert.equal(peopleByMissingTag.people.length, 0)

    const orgsByTag = await listOrganizations(supabase, { tag: "recruiting" })
    assert(orgsByTag.ok, orgsByTag.ok ? "" : orgsByTag.error)
    assert.equal(orgsByTag.organizations.length, 1)
  }

  const composerTargets = await listNoteTargets(supabase)
  if (seeded) {
    assert.equal(composerTargets.organizations.length, 3)
    assert.equal(composerTargets.cases.length, 1)
  }

  // --- organizations and cases ----------------------------------------------
  const orgList = await listOrganizations(supabase)
  assert(orgList.ok, orgList.ok ? "" : orgList.error)
  if (seeded) assert.equal(orgList.organizations.length, 3)
  const gsf = await getOrganizationDetail(supabase, GSF)
  if (seeded) assert(gsf)
  if (gsf) {
    assert.equal(gsf.members.length, 3)
    assert(gsf.members.some((m) => m.person.id === MIKE && m.role === "leader"))
    assert.equal(gsf.notes.length, 1)
    assert.equal(gsf.notes[0]?.person?.id, MIKE)
    assert.equal(gsf.caseLinks.length, 1)
    assert.equal(gsf.evidence.length, 0)
  }
  const caseList = await listCases(supabase)
  assert(caseList.ok, caseList.ok ? "" : caseList.error)
  if (seeded) assert.equal(caseList.cases.length, 1)
  const greenLight = await getCaseDetail(supabase, CASE1)
  if (seeded) assert(greenLight)
  if (greenLight) {
    assert.equal(greenLight.people.length, 3)
    assert.equal(greenLight.organizations.length, 2)
    assert.equal(greenLight.notes.length, 2)
    assert(greenLight.notes.every((n) => n.case?.id === CASE1))
  }
  assert.equal(await getOrganizationDetail(supabase, "nope"), null)
  assert.equal(await getCaseDetail(supabase, "nope"), null)

  // --- mutations, same shapes as the Server Actions -------------------------
  const created = await supabase
    .from("people")
    .insert({ description: "postgrest check" })
    .select("id, created_by")
    .single()
  assert(!created.error, created.error?.message)
  assert.equal(created.data.created_by, userId, "created_by defaults to the session user")
  const a = created.data.id

  const second = await supabase.from("people").insert({ name: "Check Two" }).select("id").single()
  assert(!second.error, second.error?.message)
  const b = second.data.id

  const orgs = await supabase.from("organizations").select("id").limit(1)
  assert(!orgs.error, orgs.error?.message)
  const orgId = orgs.data[0]?.id ?? (seeded ? GSF : null)
  if (orgId) {
    const m1 = await supabase.from("memberships").insert({ person_id: a, organization_id: orgId, role: "x", is_confirmed: false })
    assert(!m1.error, m1.error?.message)
    const m2 = await supabase.from("memberships").insert({ person_id: a, organization_id: orgId, role: null, is_confirmed: false })
    assert.equal(m2.error?.code, "23505", "duplicate membership reports unique violation")
  }

  const a1 = await supabase.from("associates").insert({ person_id: b, associate_id: a, relationship: "test", is_confirmed: true })
  assert(!a1.error, a1.error?.message)
  const a2 = await supabase.from("associates").insert({ person_id: a, associate_id: b })
  assert.equal(a2.error?.code, "23505", "reversed duplicate reports unique violation")

  const note = await supabase
    .from("notes")
    .insert({ person_id: a, body: " hello ", tags: ["Weapons", "weapons", ""], confidence: "high", source: null })
    .select("body, tags, created_by")
    .single()
  assert(!note.error, note.error?.message)
  assert.equal(note.data.body, "hello")
  assert.deepEqual(note.data.tags, ["weapons"])
  assert.equal(note.data.created_by, userId)

  const veh = await supabase.from("vehicles").insert({ person_id: a, plate: " zz-99 aa " }).select("plate").single()
  assert(!veh.error, veh.error?.message)
  assert.equal(veh.data.plate, "ZZ99AA")

  const badStatus = await supabase.from("people").update({ status: "bogus" }).eq("id", a)
  assert.equal(badStatus.error?.code, "23514", "vocabulary enforced")

  const merged = await supabase.rpc("merge_people", { keep_id: b, drop_id: a })
  assert(!merged.error, merged.error?.message)
  assert.equal(merged.data, b)
  const after = await getPersonDetail(supabase, b)
  assert(after)
  assert.equal(after.notes.length, 1)
  assert.equal(after.vehicles.length, 1)
  assert.equal(after.memberships.length, orgId ? 1 : 0)
  assert.equal(after.associates.length, 0, "link between the two collapsed")
  assert.equal(await getPersonDetail(supabase, a), null)

  const search = await supabase.rpc("search_all", { term: "check two", per_type: 5 })
  assert(!search.error, search.error?.message)
  assert(search.data.some((r) => r.kind === "person" && r.id === b))

  // --- evidence links ---------------------------------------------------------
  const ev = await supabase
    .from("evidence")
    .insert({ person_id: b, url: "https://medal.tv/games/gta-v/clips/abc123/xyz?invite=cr-1", caption: "clip" })
    .select("id, url, created_by")
    .single()
  assert(!ev.error, ev.error?.message)
  assert.equal(ev.data.created_by, userId)
  const badEv = await supabase.from("evidence").insert({ person_id: b, url: "javascript:alert(1)" })
  assert.equal(badEv.error?.code, "23514", "non-http evidence url rejected")
  const withEv = await getPersonDetail(supabase, b)
  assert(withEv)
  assert.equal(withEv.evidence.length, 1)
  assert.equal(withEv.evidence[0]?.url, ev.data.url)
  assert.equal(withEv.evidence[0]?.author?.callsign, live ? withEv.evidence[0]?.author?.callsign : "Tester")

  const del = await supabase.from("people").delete().eq("id", b)
  assert(!del.error, del.error?.message)

  console.log("postgrest-check: OK")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
