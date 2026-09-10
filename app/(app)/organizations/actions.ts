"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import type { FormState } from "@/lib/action-types"
import { requireUser } from "@/lib/auth"
import { ORGANIZATION_STATUSES, ORGANIZATION_TYPES } from "@/lib/constants"
import { createClient } from "@/lib/supabase/server"

const optionalText = z
  .string()
  .trim()
  .max(4000)
  .optional()
  .transform((v) => (v ? v : null))

const organizationSchema = z.object({
  name: z.string().trim().min(1, "Give the organization a name.").max(200),
  type: z.enum(ORGANIZATION_TYPES).optional(),
  territory: optionalText,
  status: z.enum(ORGANIZATION_STATUSES).default("active"),
  notes: optionalText,
})

export async function createOrganization(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser()
  const get = (k: string) => {
    const v = formData.get(k)
    return typeof v === "string" ? v : undefined
  }
  const type = get("type")
  const parsed = organizationSchema.safeParse({
    name: get("name") ?? "",
    type: type && type !== "none" ? type : undefined,
    territory: get("territory"),
    status: get("status") || undefined,
    notes: get("notes"),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("organizations")
    .insert({ ...parsed.data, type: parsed.data.type ?? null })
    .select("id")
    .single()
  if (error) return { error: error.message }

  revalidatePath("/organizations")
  revalidatePath("/")
  redirect(`/organizations/${data.id}`)
}
