/**
 * Controlled vocabularies. These must match the check constraints in
 * supabase/migrations/0001_init.sql — the database rejects anything else.
 */

export const PERSON_STATUSES = [
  "unknown",
  "poi",
  "active_investigation",
  "warrant",
  "cleared",
  "incarcerated",
  "deceased",
] as const
export type PersonStatus = (typeof PERSON_STATUSES)[number]

export const PERSON_STATUS_LABELS: Record<PersonStatus, string> = {
  unknown: "Unknown",
  poi: "Person of interest",
  active_investigation: "Active investigation",
  warrant: "Warrant",
  cleared: "Cleared",
  incarcerated: "Incarcerated",
  deceased: "Deceased",
}

/** Badge classes per status. Warrant is deliberately loud. */
export const PERSON_STATUS_STYLES: Record<PersonStatus, string> = {
  unknown: "border-zinc-500/40 bg-zinc-500/15 text-zinc-300",
  poi: "border-sky-500/40 bg-sky-500/15 text-sky-300",
  active_investigation: "border-amber-500/40 bg-amber-500/15 text-amber-300",
  warrant: "border-red-500/60 bg-red-500/25 text-red-200 font-semibold",
  cleared: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  incarcerated: "border-violet-500/40 bg-violet-500/15 text-violet-300",
  deceased: "border-zinc-700 bg-zinc-800 text-zinc-400 line-through",
}

export const ORGANIZATION_TYPES = ["gang", "cartel", "business", "crew", "other"] as const
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number]
export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  gang: "Gang",
  cartel: "Cartel",
  business: "Business",
  crew: "Crew",
  other: "Other",
}

export const ORGANIZATION_STATUSES = ["active", "disbanded", "dormant"] as const
export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number]
export const ORGANIZATION_STATUS_LABELS: Record<OrganizationStatus, string> = {
  active: "Active",
  disbanded: "Disbanded",
  dormant: "Dormant",
}
export const ORGANIZATION_STATUS_STYLES: Record<OrganizationStatus, string> = {
  active: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  disbanded: "border-zinc-700 bg-zinc-800 text-zinc-400",
  dormant: "border-amber-500/40 bg-amber-500/15 text-amber-300",
}

export const NOTE_SOURCES = ["informant", "wiretap", "patrol", "tip", "surveillance", "other"] as const
export type NoteSource = (typeof NOTE_SOURCES)[number]
export const NOTE_SOURCE_LABELS: Record<NoteSource, string> = {
  informant: "Informant",
  wiretap: "Wiretap",
  patrol: "Patrol",
  tip: "Tip",
  surveillance: "Surveillance",
  other: "Other",
}

export const CONFIDENCES = ["low", "medium", "high"] as const
export type Confidence = (typeof CONFIDENCES)[number]
export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
}
export const CONFIDENCE_STYLES: Record<Confidence, string> = {
  low: "border-zinc-500/40 bg-zinc-500/15 text-zinc-300",
  medium: "border-sky-500/40 bg-sky-500/15 text-sky-300",
  high: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
}

export const CASE_STATUSES = ["open", "closed", "cold"] as const
export type CaseStatus = (typeof CASE_STATUSES)[number]
export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  open: "Open",
  closed: "Closed",
  cold: "Cold",
}
export const CASE_STATUS_STYLES: Record<CaseStatus, string> = {
  open: "border-amber-500/40 bg-amber-500/15 text-amber-300",
  closed: "border-zinc-700 bg-zinc-800 text-zinc-400",
  cold: "border-sky-500/40 bg-sky-500/15 text-sky-300",
}

/** Free-text fields with suggestions rather than constraints. */
export const MEMBERSHIP_ROLE_SUGGESTIONS = [
  "leader",
  "lieutenant",
  "enforcer",
  "dealer",
  "member",
  "associate",
  "hang-around",
]
export const RELATIONSHIP_SUGGESTIONS = [
  "family",
  "partner",
  "frequent contact",
  "seen together",
  "rival",
  "cellmate",
  "employer",
]
export const CASE_ROLE_SUGGESTIONS = [
  "suspect",
  "witness",
  "victim",
  "informant",
  "associate",
  "unidentified",
]

/** Private storage bucket for photos and evidence (see migration). */
export const STORAGE_BUCKET = "intel"
