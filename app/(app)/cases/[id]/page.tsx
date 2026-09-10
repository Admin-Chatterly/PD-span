import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"
import {
  CaseStatusBadge,
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
import { getCaseDetail } from "@/lib/data/cases"
import { listTagSuggestions } from "@/lib/data/notes"
import { isUnidentified, personLabel } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"

export async function generateMetadata(props: PageProps<"/cases/[id]">): Promise<Metadata> {
  const { id } = await props.params
  const supabase = await createClient()
  const detail = await getCaseDetail(supabase, id)
  return { title: detail ? detail.caseRecord.title : "Not found" }
}

export default async function CasePage(props: PageProps<"/cases/[id]">) {
  const { id } = await props.params
  const supabase = await createClient()
  const [detail, tagSuggestions] = await Promise.all([getCaseDetail(supabase, id), listTagSuggestions(supabase)])
  if (!detail) notFound()
  const { caseRecord } = detail

  return (
    <div className="flex flex-col gap-4">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href="/cases">
          <ArrowLeftIcon /> Cases
        </Link>
      </Button>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{caseRecord.title}</h1>
            <CaseStatusBadge status={caseRecord.status} />
          </div>
          {caseRecord.description ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{caseRecord.description}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Opened <RelativeTime iso={caseRecord.created_at} />
            {detail.createdBy ? ` by ${detail.createdBy}` : ""} · updated{" "}
            <RelativeTime iso={caseRecord.updated_at} />
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <NotesSection
            target={{ caseId: caseRecord.id }}
            notes={detail.notes}
            tagSuggestions={tagSuggestions}
            emptyText="No intel logged on this case yet."
          />
        </div>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>People</CardTitle>
            </CardHeader>
            <CardContent>
              {detail.people.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nobody linked yet. Linking people and organizations to cases arrives in Phase 5.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-border/60">
                  {detail.people.map((l) =>
                    l.person ? (
                      <li key={l.id} className="flex flex-col gap-1 py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/people/${l.person.id}`} className="font-medium hover:underline">
                            {personLabel(l.person)}
                          </Link>
                          {isUnidentified(l.person) ? <UnknownBadge /> : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          <PersonStatusBadge status={l.person.status} />
                          {l.role ? <span className="text-xs text-muted-foreground">{l.role}</span> : null}
                        </div>
                      </li>
                    ) : null
                  )}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organizations</CardTitle>
            </CardHeader>
            <CardContent>
              {detail.organizations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No organizations linked.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border/60">
                  {detail.organizations.map((l) =>
                    l.organization ? (
                      <li key={l.id} className="flex flex-col gap-1 py-2">
                        <Link href={`/organizations/${l.organization.id}`} className="font-medium hover:underline">
                          {l.organization.name}
                        </Link>
                        <div className="flex flex-wrap items-center gap-1">
                          <OrganizationTypeBadge type={l.organization.type} />
                          <OrganizationStatusBadge status={l.organization.status} />
                          {l.role ? <span className="text-xs text-muted-foreground">{l.role}</span> : null}
                        </div>
                      </li>
                    ) : null
                  )}
                </ul>
              )}
            </CardContent>
          </Card>

          <EvidenceSection target={{ caseId: caseRecord.id }} items={detail.evidence} />
        </div>
      </div>
    </div>
  )
}
