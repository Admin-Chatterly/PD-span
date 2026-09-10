"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import type { FormState } from "@/lib/action-types"
import { requireUser } from "@/lib/auth"
import { CASE_STATUSES } from "@/lib/constants"
import { createClient } from "@/lib/supabase/server"

const caseSchema = z.object({
  title: z.string().trim().min(1, "Give the case a title.").max(200),
  description: z
    .string()
    .trim()
    .max(4000)
    .optional()
    .transform((v) => (v ? v : null)),
  status: z.enum(CASE_STATUSES).default("open"),
})

export async function createCase(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser()
  const get = (k: string) => {
    const v = formData.get(k)
    return typeof v === "string" ? v : undefined
  }
  const parsed = caseSchema.safeParse({
    title: get("title") ?? "",
    description: get("description"),
    status: get("status") || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." }

  const supabase = await createClient()
  const { data, error } = await supabase.from("cases").insert(parsed.data).select("id").single()
  if (error) return { error: error.message }

  revalidatePath("/cases")
  revalidatePath("/")
  redirect(`/cases/${data.id}`)
}
