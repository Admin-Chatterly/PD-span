import type { Tables } from "@/lib/database.types"

export type EvidenceRow = Tables<"evidence"> & {
  author: { callsign: string | null } | null
}

export const EVIDENCE_SELECT = "*, author:profiles(callsign)"

export type EvidenceTarget = {
  personId?: string
  organizationId?: string
  caseId?: string
}
