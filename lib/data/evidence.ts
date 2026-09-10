import { STORAGE_BUCKET } from "@/lib/constants"
import type { Tables } from "@/lib/database.types"
import type { Client } from "@/lib/supabase/types"

export type EvidenceRow = Tables<"evidence"> & {
  author: { callsign: string | null } | null
  /** Present for uploaded files; links are rendered from `url` directly. */
  signedUrl?: string | null
}

export const EVIDENCE_SELECT = "*, author:profiles(callsign)"

export type EvidenceTarget = {
  personId?: string
  organizationId?: string
  caseId?: string
}

/** How long a rendered evidence image stays fetchable, in seconds. */
const SIGNED_URL_TTL = 60 * 60

/**
 * The bucket is private, so an uploaded file is only viewable through a
 * short-lived signed URL minted per request. One call covers every file on the
 * page.
 */
export async function signEvidence(supabase: Client, rows: EvidenceRow[]): Promise<EvidenceRow[]> {
  const paths = rows.flatMap((row) => (row.storage_path ? [row.storage_path] : []))
  if (paths.length === 0) return rows

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL)
  if (error) return rows

  const byPath = new Map((data ?? []).map((entry) => [entry.path, entry.signedUrl]))
  return rows.map((row) =>
    row.storage_path ? { ...row, signedUrl: byPath.get(row.storage_path) ?? null } : row
  )
}
