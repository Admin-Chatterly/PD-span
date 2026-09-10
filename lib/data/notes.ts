import type { Tables } from "@/lib/database.types"

/** A note with every relation the feed might link to. Embeds not selected come back undefined. */
export type NoteRow = Tables<"notes"> & {
  author: { callsign: string | null } | null
  person?: { id: string; name: string | null; alias: string | null } | null
  organization?: { id: string; name: string } | null
  case?: { id: string; title: string } | null
}

export const NOTE_SELECT =
  "*, author:profiles(callsign), person:people(id, name, alias), organization:organizations(id, name), case:cases(id, title)"
