"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { requireUser } from "@/lib/auth"
import { CONFIDENCES, NOTE_SOURCES, PERSON_STATUSES } from "@/lib/constants"
import { searchPeople, type PersonPick } from "@/lib/data/people"
import { createClient } from "@/lib/supabase/server"

import type { ActionResult, FormState } from "@/lib/action-types"

export type { ActionResult, FormState }

const uuid = z.uuid()

const optionalText = z
  .string()
  .trim()
  .max(4000)
  .optional()
  .transform((v) => (v ? v : null))

const personSchema = z.object({
  name: optionalText,
  alias: optionalText,
  description: optionalText,
  status: z.enum(PERSON_STATUSES).default("unknown"),
})

function read(formData: FormData, keys: readonly string[]) {
  const out: Record<string, string | undefined> = {}
  for (const key of keys) {
    const value = formData.get(key)
    out[key] = typeof value === "string" ? value : undefined
  }
  return out
}

function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0]
  return issue ? `${issue.path.join(".") || "form"}: ${issue.message}` : "Invalid input."
}

function parseTags(value: string | undefined): string[] {
  if (!value) return []
  return Array.from(
    new Set(
      value
        .split(/[,\n]/)
        .map((t) => t.trim().toLowerCase().replace(/^#/, ""))
        .filter(Boolean)
    )
  )
}

function revalidatePerson(id: string) {
  revalidatePath(`/people/${id}`)
  revalidatePath("/people")
  revalidatePath("/")
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

export async function createPerson(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser()
  const parsed = personSchema.safeParse(read(formData, ["name", "alias", "description", "status"]))
  if (!parsed.success) return { error: firstIssue(parsed.error) }
  const { name, alias, description } = parsed.data
  if (!name && !alias && !description) {
    return { error: "Give at least a name, an alias, or a description." }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.from("people").insert(parsed.data).select("id").single()
  if (error) return { error: error.message }

  revalidatePath("/people")
  revalidatePath("/")
  redirect(`/people/${data.id}`)
}

/** One-field add from the list page: a description is enough to open a file. */
export async function quickAddPerson(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser()
  const description = z.string().trim().min(1).max(4000).safeParse(formData.get("description"))
  if (!description.success) return { error: "Describe the person first." }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("people")
    .insert({ description: description.data })
    .select("id")
    .single()
  if (error) return { error: error.message }

  revalidatePath("/people")
  revalidatePath("/")
  redirect(`/people/${data.id}`)
}

export async function updatePerson(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser()
  const id = uuid.safeParse(formData.get("id"))
  if (!id.success) return { error: "Missing person id." }
  const parsed = personSchema.safeParse(read(formData, ["name", "alias", "description", "status"]))
  if (!parsed.success) return { error: firstIssue(parsed.error) }
  const { name, alias, description } = parsed.data
  if (!name && !alias && !description) {
    return { error: "Keep at least a name, an alias, or a description." }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("people").update(parsed.data).eq("id", id.data)
  if (error) return { error: error.message }

  revalidatePerson(id.data)
  return { ok: true, version: Date.now() }
}

export async function updatePersonStatus(personId: string, status: string): Promise<ActionResult> {
  await requireUser()
  const parsed = z.object({ id: uuid, status: z.enum(PERSON_STATUSES) }).safeParse({ id: personId, status })
  if (!parsed.success) return { ok: false, error: "Invalid status." }

  const supabase = await createClient()
  const { error } = await supabase
    .from("people")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
  if (error) return { ok: false, error: error.message }

  revalidatePerson(parsed.data.id)
  return { ok: true }
}

export async function deletePerson(personId: string): Promise<ActionResult> {
  await requireUser()
  const id = uuid.safeParse(personId)
  if (!id.success) return { ok: false, error: "Invalid id." }

  const supabase = await createClient()
  const { error } = await supabase.from("people").delete().eq("id", id.data)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/people")
  revalidatePath("/")
  redirect("/people")
}

export async function mergePeople(keepId: string, dropId: string): Promise<ActionResult> {
  await requireUser()
  const parsed = z.object({ keep: uuid, drop: uuid }).safeParse({ keep: keepId, drop: dropId })
  if (!parsed.success) return { ok: false, error: "Invalid ids." }
  if (parsed.data.keep === parsed.data.drop) return { ok: false, error: "Pick two different people." }

  const supabase = await createClient()
  const { error } = await supabase.rpc("merge_people", {
    keep_id: parsed.data.keep,
    drop_id: parsed.data.drop,
  })
  if (error) return { ok: false, error: error.message }

  revalidatePerson(parsed.data.keep)
  revalidatePath(`/people/${parsed.data.drop}`)
  redirect(`/people/${parsed.data.keep}`)
}

/** Used by pickers in client components. */
export async function searchPeopleAction(term: string, excludeIds: string[] = []): Promise<PersonPick[]> {
  await requireUser()
  const supabase = await createClient()
  return searchPeople(supabase, term, excludeIds)
}

// ---------------------------------------------------------------------------
// Memberships
// ---------------------------------------------------------------------------

const membershipSchema = z.object({
  person_id: uuid,
  organization_id: uuid,
  role: optionalText,
  is_confirmed: z.boolean(),
})

export async function addMembership(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser()
  const raw = read(formData, ["person_id", "organization_id", "role"])
  const parsed = membershipSchema.safeParse({ ...raw, is_confirmed: formData.get("is_confirmed") === "on" })
  if (!parsed.success) return { error: "Pick an organization." }

  const supabase = await createClient()
  const { error } = await supabase.from("memberships").insert(parsed.data)
  if (error) {
    return { error: error.code === "23505" ? "Already listed in that organization." : error.message }
  }

  revalidatePerson(parsed.data.person_id)
  revalidatePath(`/organizations/${parsed.data.organization_id}`)
  return { ok: true, version: Date.now() }
}

export async function setMembershipConfirmed(
  personId: string,
  organizationId: string,
  isConfirmed: boolean
): Promise<ActionResult> {
  await requireUser()
  const parsed = z.object({ p: uuid, o: uuid }).safeParse({ p: personId, o: organizationId })
  if (!parsed.success) return { ok: false, error: "Invalid ids." }

  const supabase = await createClient()
  const { error } = await supabase
    .from("memberships")
    .update({ is_confirmed: isConfirmed })
    .eq("person_id", parsed.data.p)
    .eq("organization_id", parsed.data.o)
  if (error) return { ok: false, error: error.message }

  revalidatePerson(parsed.data.p)
  revalidatePath(`/organizations/${parsed.data.o}`)
  return { ok: true }
}

export async function removeMembership(personId: string, organizationId: string): Promise<ActionResult> {
  await requireUser()
  const parsed = z.object({ p: uuid, o: uuid }).safeParse({ p: personId, o: organizationId })
  if (!parsed.success) return { ok: false, error: "Invalid ids." }

  const supabase = await createClient()
  const { error } = await supabase
    .from("memberships")
    .delete()
    .eq("person_id", parsed.data.p)
    .eq("organization_id", parsed.data.o)
  if (error) return { ok: false, error: error.message }

  revalidatePerson(parsed.data.p)
  revalidatePath(`/organizations/${parsed.data.o}`)
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Associates
// ---------------------------------------------------------------------------

export async function addAssociate(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser()
  const parsed = z
    .object({
      person_id: uuid,
      associate_id: uuid,
      relationship: optionalText,
      is_confirmed: z.boolean(),
    })
    .safeParse({
      ...read(formData, ["person_id", "associate_id", "relationship"]),
      is_confirmed: formData.get("is_confirmed") === "on",
    })
  if (!parsed.success) return { error: "Pick a person to link." }
  if (parsed.data.person_id === parsed.data.associate_id) {
    return { error: "A person cannot be linked to themselves." }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("associates").insert(parsed.data)
  if (error) {
    return { error: error.code === "23505" ? "Those two are already linked." : error.message }
  }

  revalidatePerson(parsed.data.person_id)
  revalidatePerson(parsed.data.associate_id)
  return { ok: true, version: Date.now() }
}

export async function removeAssociate(personId: string, otherId: string): Promise<ActionResult> {
  await requireUser()
  const parsed = z.object({ a: uuid, b: uuid }).safeParse({ a: personId, b: otherId })
  if (!parsed.success) return { ok: false, error: "Invalid ids." }
  const [first, second] = [parsed.data.a, parsed.data.b].sort()

  const supabase = await createClient()
  const { error } = await supabase
    .from("associates")
    .delete()
    .eq("person_id", first)
    .eq("associate_id", second)
  if (error) return { ok: false, error: error.message }

  revalidatePerson(parsed.data.a)
  revalidatePerson(parsed.data.b)
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Vehicles
// ---------------------------------------------------------------------------

export async function addVehicle(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser()
  const parsed = z
    .object({
      person_id: uuid.optional(),
      plate: optionalText,
      model: optionalText,
      color: optionalText,
      notes: optionalText,
    })
    .safeParse(read(formData, ["person_id", "plate", "model", "color", "notes"]))
  if (!parsed.success) return { error: firstIssue(parsed.error) }
  if (!parsed.data.plate && !parsed.data.model) {
    return { error: "Give at least a plate or a model." }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("vehicles").insert({
    ...parsed.data,
    person_id: parsed.data.person_id ?? null,
  })
  if (error) return { error: error.message }

  if (parsed.data.person_id) revalidatePerson(parsed.data.person_id)
  return { ok: true, version: Date.now() }
}

export async function unlinkVehicle(vehicleId: string, personId: string): Promise<ActionResult> {
  await requireUser()
  const parsed = z.object({ v: uuid, p: uuid }).safeParse({ v: vehicleId, p: personId })
  if (!parsed.success) return { ok: false, error: "Invalid ids." }

  const supabase = await createClient()
  const { error } = await supabase.from("vehicles").update({ person_id: null }).eq("id", parsed.data.v)
  if (error) return { ok: false, error: error.message }

  revalidatePerson(parsed.data.p)
  return { ok: true }
}

export async function deleteVehicle(vehicleId: string, personId: string | null): Promise<ActionResult> {
  await requireUser()
  const v = uuid.safeParse(vehicleId)
  if (!v.success) return { ok: false, error: "Invalid id." }

  const supabase = await createClient()
  const { error } = await supabase.from("vehicles").delete().eq("id", v.data)
  if (error) return { ok: false, error: error.message }

  if (personId) revalidatePerson(personId)
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

const noteSchema = z.object({
  person_id: uuid.optional(),
  organization_id: uuid.optional(),
  case_id: uuid.optional(),
  body: z.string().trim().min(1, "Write the note first.").max(10000),
  source: z.enum(NOTE_SOURCES).optional(),
  confidence: z.enum(CONFIDENCES).default("medium"),
})

export async function addNote(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser()
  const raw = read(formData, ["person_id", "organization_id", "case_id", "body", "source", "confidence"])
  const parsed = noteSchema.safeParse({
    ...raw,
    person_id: raw.person_id || undefined,
    organization_id: raw.organization_id || undefined,
    case_id: raw.case_id || undefined,
    source: raw.source && raw.source !== "none" ? raw.source : undefined,
  })
  if (!parsed.success) return { error: firstIssue(parsed.error) }

  const supabase = await createClient()
  const { error } = await supabase.from("notes").insert({
    person_id: parsed.data.person_id ?? null,
    organization_id: parsed.data.organization_id ?? null,
    case_id: parsed.data.case_id ?? null,
    body: parsed.data.body,
    tags: parseTags(read(formData, ["tags"]).tags),
    source: parsed.data.source ?? null,
    confidence: parsed.data.confidence,
  })
  if (error) return { error: error.message }

  if (parsed.data.person_id) revalidatePerson(parsed.data.person_id)
  if (parsed.data.organization_id) revalidatePath(`/organizations/${parsed.data.organization_id}`)
  if (parsed.data.case_id) revalidatePath(`/cases/${parsed.data.case_id}`)
  revalidatePath("/")
  return { ok: true, version: Date.now() }
}

export async function deleteNote(noteId: string): Promise<ActionResult> {
  await requireUser()
  const id = uuid.safeParse(noteId)
  if (!id.success) return { ok: false, error: "Invalid id." }

  const supabase = await createClient()
  const { data: note } = await supabase
    .from("notes")
    .select("person_id, organization_id, case_id")
    .eq("id", id.data)
    .maybeSingle()
  const { error } = await supabase.from("notes").delete().eq("id", id.data)
  if (error) return { ok: false, error: error.message }

  if (note?.person_id) revalidatePerson(note.person_id)
  if (note?.organization_id) revalidatePath(`/organizations/${note.organization_id}`)
  if (note?.case_id) revalidatePath(`/cases/${note.case_id}`)
  revalidatePath("/")
  return { ok: true }
}
