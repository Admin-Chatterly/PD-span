"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ActionResult, FormState } from "@/lib/action-types"
import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

const uuid = z.uuid()

const linkSchema = z.object({
  person_id: uuid.optional(),
  organization_id: uuid.optional(),
  case_id: uuid.optional(),
  url: z
    .string()
    .trim()
    .max(2000)
    .refine((v) => /^https?:\/\/\S+$/i.test(v), "Paste a full http(s) link."),
  caption: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : null)),
})

function revalidateTargets(t: { person_id?: string | null; organization_id?: string | null; case_id?: string | null }) {
  if (t.person_id) revalidatePath(`/people/${t.person_id}`)
  if (t.organization_id) revalidatePath(`/organizations/${t.organization_id}`)
  if (t.case_id) revalidatePath(`/cases/${t.case_id}`)
}

/** Attach an external link (Medal.tv clip, YouTube, Streamable, image URL) as evidence. */
export async function addEvidenceLink(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser()
  const get = (k: string) => {
    const v = formData.get(k)
    return typeof v === "string" && v ? v : undefined
  }
  const parsed = linkSchema.safeParse({
    person_id: get("person_id"),
    organization_id: get("organization_id"),
    case_id: get("case_id"),
    url: get("url") ?? "",
    caption: get("caption"),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid link." }
  const { person_id, organization_id, case_id, url, caption } = parsed.data
  if (!person_id && !organization_id && !case_id) return { error: "Nothing to attach the evidence to." }

  const supabase = await createClient()
  const { error } = await supabase.from("evidence").insert({
    person_id: person_id ?? null,
    organization_id: organization_id ?? null,
    case_id: case_id ?? null,
    url,
    caption,
  })
  if (error) return { error: error.message }

  revalidateTargets(parsed.data)
  return { ok: true, version: Date.now() }
}

export async function deleteEvidence(evidenceId: string): Promise<ActionResult> {
  await requireUser()
  const id = uuid.safeParse(evidenceId)
  if (!id.success) return { ok: false, error: "Invalid id." }

  const supabase = await createClient()
  const { data: row } = await supabase
    .from("evidence")
    .select("person_id, organization_id, case_id")
    .eq("id", id.data)
    .maybeSingle()
  const { error } = await supabase.from("evidence").delete().eq("id", id.data)
  if (error) return { ok: false, error: error.message }

  if (row) revalidateTargets(row)
  return { ok: true }
}
