import type { Views } from "@/lib/database.types"
import { parseAffiliations, type OrganizationAffiliation } from "@/lib/format"

/** A row of the people_overview view with the nullability the view cannot express removed. */
export type PersonSummary = {
  id: string
  name: string | null
  alias: string | null
  description: string | null
  status: string
  photoPath: string | null
  createdAt: string
  updatedAt: string
  organizations: OrganizationAffiliation[]
  lastNoteAt: string | null
  noteCount: number
  plates: string[]
}

export function toPersonSummary(row: Views<"people_overview">): PersonSummary {
  if (!row.id) throw new Error("people_overview row without id")
  return {
    id: row.id,
    name: row.name,
    alias: row.alias,
    description: row.description,
    status: row.status ?? "unknown",
    photoPath: row.photo_path,
    createdAt: row.created_at ?? new Date(0).toISOString(),
    updatedAt: row.updated_at ?? row.created_at ?? new Date(0).toISOString(),
    organizations: parseAffiliations(row.organizations),
    lastNoteAt: row.last_note_at,
    noteCount: row.note_count ?? 0,
    plates: row.plates ?? [],
  }
}
