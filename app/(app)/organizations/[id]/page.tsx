import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, MapPinIcon } from "lucide-react"
import {
  CaseStatusBadge,
  MembershipBadge,
  OrganizationStatusBadge,
  OrganizationTypeBadge,
  PersonStatusBadge,
  UnknownBadge,
} from "@/components/badges"
import { EvidenceSection } from "@/components/evidence/evidence-section"
import { NotesSection } from "@/components/notes/notes-section"
import { RelativeTime } from "@/components/relative-time"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getOrganizationDetail } from "@/lib/data/organizations"
import { listTagSuggestions } from "@/lib/data/people"
import { isUnidentified, personLabel } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"

export async function generateMetadata(props: PageProps<"/organizations/[id]">): Promise<Metadata> {
  const { id } = await props.params
  const supabase = await createClient()
  const detail = await getOrganizationDetail(supabase, id)
  return { title: detail ? detail.organization.name : "Not found" }
}

export default async function OrganizationPage(props: PageProps<"/organizations/[id]">) {
  const { id } = await props.params
  const supabase = await createClient()
  const [detail, tagSuggestions] = await Promise.all([
    getOrganizationDetail(supabase, id),
    listTagSuggestions(supabase),
  ])
  if (!detail) notFound()
  const { organization } = detail

  return (
    <div className="flex flex-col gap-4">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href="/organizations">
          <ArrowLeftIcon /> Organizations
        </Link>
      </Button>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{organization.name}</h1>
            <OrganizationTypeBadge type={organization.type} />
            <OrganizationStatusBadge status={organization.status} />
          </div>
          {organization.territory ? (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPinIcon className="size-4" /> {organization.territory}
            </p>
          ) : null}
          {organization.notes ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{organization.notes}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Opened <RelativeTime iso={organization.created_at} />
            {detail.createdBy ? ` by ${detail.createdBy}` : ""} · updated{" "}
            <RelativeTime iso={organization.updated_at} />
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <NotesSection
            target={{ organizationId: organization.id }}
            notes={detail.notes}
            tagSuggestions={tagSuggestions}
            emptyText="No intel logged on this organization yet."
          />
        </div>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Roster</CardTitle>
            </CardHeader>
            <CardContent>
              {detail.members.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No known members. Add people to this organization from their own page.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-border/60">
                  {detail.members.map((m) => (
                    <li key={m.person.id} className="flex flex-col gap-1 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/people/${m.person.id}`} className="font-medium hover:underline">
                          {personLabel(m.person)}
                        </Link>
                        {isUnidentified(m.person) ? <UnknownBadge /> : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        <PersonStatusBadge status={m.person.status} />
                        <MembershipBadge isConfirmed={m.is_confirmed} />
                        {m.role ? <span className="text-xs text-muted-foreground">{m.role}</span> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cases</CardTitle>
            </CardHeader>
            <CardContent>
              {detail.caseLinks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not tied to any case.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border/60">
                  {detail.caseLinks.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-2 py-2">
                      <Link href={`/cases/${l.case.id}`} className="font-medium hover:underline">
                        {l.case.title}
                      </Link>
                      <CaseStatusBadge status={l.case.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <EvidenceSection target={{ organizationId: organization.id }} items={detail.evidence} />
        </div>
      </div>
    </div>
  )
}
