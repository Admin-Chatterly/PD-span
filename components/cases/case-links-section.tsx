import Link from "next/link"
import { XIcon } from "lucide-react"
import { removeCaseLink } from "@/app/(app)/cases/actions"
import { ActionButton } from "@/components/action-button"
import {
  OrganizationStatusBadge,
  OrganizationTypeBadge,
  PersonStatusBadge,
  UnknownBadge,
} from "@/components/badges"
import { AddCaseLinkDialog } from "@/components/cases/add-case-link-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CaseLinkedRow } from "@/lib/data/cases"
import { isUnidentified, personLabel } from "@/lib/format"

export function CasePeopleSection({
  caseId,
  links,
}: {
  caseId: string
  links: CaseLinkedRow[]
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>People</CardTitle>
        <AddCaseLinkDialog
          caseId={caseId}
          kind="person"
          linkedIds={links.flatMap((l) => (l.person ? [l.person.id] : []))}
        />
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nobody linked yet. Link the suspects, witnesses and the unidentified alike.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border/60">
            {links.map((l) =>
              l.person ? (
                <li key={l.id} className="flex items-start justify-between gap-2 py-2">
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/people/${l.person.id}`} className="font-medium hover:underline">
                        {personLabel(l.person)}
                      </Link>
                      {isUnidentified(l.person) ? <UnknownBadge /> : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <PersonStatusBadge status={l.person.status} />
                      {l.role ? (
                        <span className="text-xs text-muted-foreground">{l.role}</span>
                      ) : null}
                    </div>
                  </div>
                  <ActionButton
                    action={removeCaseLink.bind(null, l.id)}
                    variant="ghost"
                    size="icon-sm"
                    title="Unlink from this case"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    confirm={{
                      title: `Unlink ${personLabel(l.person)}?`,
                      description: "The record itself stays on file.",
                      actionLabel: "Unlink",
                      destructive: true,
                    }}
                    successMessage="Unlinked from the case"
                  >
                    <XIcon />
                  </ActionButton>
                </li>
              ) : null
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function CaseOrganizationsSection({
  caseId,
  links,
  organizationOptions,
}: {
  caseId: string
  links: CaseLinkedRow[]
  organizationOptions: { id: string; name: string }[]
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Organizations</CardTitle>
        <AddCaseLinkDialog
          caseId={caseId}
          kind="organization"
          organizations={organizationOptions}
          linkedIds={links.flatMap((l) => (l.organization ? [l.organization.id] : []))}
        />
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <p className="text-sm text-muted-foreground">No organizations linked.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border/60">
            {links.map((l) =>
              l.organization ? (
                <li key={l.id} className="flex items-start justify-between gap-2 py-2">
                  <div className="flex min-w-0 flex-col gap-1">
                    <Link
                      href={`/organizations/${l.organization.id}`}
                      className="font-medium hover:underline"
                    >
                      {l.organization.name}
                    </Link>
                    <div className="flex flex-wrap items-center gap-1">
                      <OrganizationTypeBadge type={l.organization.type} />
                      <OrganizationStatusBadge status={l.organization.status} />
                      {l.role ? (
                        <span className="text-xs text-muted-foreground">{l.role}</span>
                      ) : null}
                    </div>
                  </div>
                  <ActionButton
                    action={removeCaseLink.bind(null, l.id)}
                    variant="ghost"
                    size="icon-sm"
                    title="Unlink from this case"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    confirm={{
                      title: `Unlink ${l.organization.name}?`,
                      description: "The organization itself stays on file.",
                      actionLabel: "Unlink",
                      destructive: true,
                    }}
                    successMessage="Unlinked from the case"
                  >
                    <XIcon />
                  </ActionButton>
                </li>
              ) : null
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
