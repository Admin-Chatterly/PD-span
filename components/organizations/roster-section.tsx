import Link from "next/link"
import { CheckIcon, UndoIcon, XIcon } from "lucide-react"
import { removeMembership, setMembershipConfirmed } from "@/app/(app)/memberships/actions"
import { ActionButton } from "@/components/action-button"
import { MembershipBadge, PersonStatusBadge, UnknownBadge } from "@/components/badges"
import { AddMemberDialog } from "@/components/organizations/add-member-dialog"
import { EditMembershipDialog } from "@/components/organizations/edit-membership-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { MemberRow } from "@/lib/data/organizations"
import { isUnidentified, personLabel } from "@/lib/format"

export function RosterSection({
  organizationId,
  members,
}: {
  organizationId: string
  members: MemberRow[]
}) {
  const confirmed = members.filter((m) => m.is_confirmed).length

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Roster</CardTitle>
          {members.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              {members.length} known, {confirmed} confirmed
            </p>
          ) : null}
        </div>
        <AddMemberDialog
          organizationId={organizationId}
          memberIds={members.map((m) => m.person.id)}
        />
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No known members. Add anyone on file, including unidentified suspects.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border/60">
            {members.map((m) => {
              const label = personLabel(m.person)
              return (
                <li key={m.person.id} className="flex items-start justify-between gap-2 py-2">
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/people/${m.person.id}`} className="font-medium hover:underline">
                        {label}
                      </Link>
                      {isUnidentified(m.person) ? <UnknownBadge /> : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <PersonStatusBadge status={m.person.status} />
                      <MembershipBadge isConfirmed={m.is_confirmed} />
                      {m.role ? <span className="text-xs text-muted-foreground">{m.role}</span> : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <ActionButton
                      action={setMembershipConfirmed.bind(
                        null,
                        m.person.id,
                        organizationId,
                        !m.is_confirmed
                      )}
                      variant="ghost"
                      size="icon-sm"
                      title={m.is_confirmed ? "Mark as suspected" : "Mark as confirmed"}
                      successMessage={m.is_confirmed ? "Marked as suspected" : "Marked as confirmed"}
                    >
                      {m.is_confirmed ? <UndoIcon /> : <CheckIcon />}
                    </ActionButton>
                    <EditMembershipDialog
                      organizationId={organizationId}
                      personId={m.person.id}
                      personLabel={label}
                      role={m.role}
                      isConfirmed={m.is_confirmed}
                    />
                    <ActionButton
                      action={removeMembership.bind(null, m.person.id, organizationId)}
                      variant="ghost"
                      size="icon-sm"
                      title="Remove from this organization"
                      className="text-muted-foreground hover:text-destructive"
                      confirm={{
                        title: `Remove ${label} from the roster?`,
                        description: "Their own record and notes are untouched.",
                        actionLabel: "Remove",
                        destructive: true,
                      }}
                      successMessage="Member removed"
                    >
                      <XIcon />
                    </ActionButton>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
