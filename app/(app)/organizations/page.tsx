import Link from "next/link"
import { OrganizationStatusBadge, OrganizationTypeBadge } from "@/components/badges"
import { NewOrganizationDialog } from "@/components/organizations/new-organization-dialog"
import { RelativeTime } from "@/components/relative-time"
import { SetupHelp } from "@/components/setup-help"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listOrganizations } from "@/lib/data/organizations"
import { createClient } from "@/lib/supabase/server"

export const metadata = { title: "Organizations" }

export default async function OrganizationsPage() {
  const supabase = await createClient()
  const result = await listOrganizations(supabase)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
          {result.ok ? (
            <p className="text-sm text-muted-foreground">{result.organizations.length} on file</p>
          ) : null}
        </div>
        <NewOrganizationDialog />
      </div>

      {!result.ok ? (
        <SetupHelp error={result.error} />
      ) : result.organizations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No organizations yet. Create the gangs and crews your department tracks, then add members
          from a person&rsquo;s page.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-48">Organization</TableHead>
                <TableHead>Territory</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Last note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.organizations.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/organizations/${o.id}`} className="font-medium hover:underline">
                        {o.name}
                      </Link>
                      <OrganizationTypeBadge type={o.type} />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{o.territory ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {o.memberCount}
                    {o.memberCount > 0 ? (
                      <span className="text-muted-foreground"> · {o.confirmedMemberCount} confirmed</span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <OrganizationStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {o.lastNoteAt ? <RelativeTime iso={o.lastNoteAt} /> : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
