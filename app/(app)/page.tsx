import Link from "next/link"
import {
  BriefcaseIcon,
  BuildingIcon,
  NotebookPenIcon,
  PlusIcon,
  UsersIcon,
} from "lucide-react"
import { StatTile } from "@/components/dashboard/stat-tile"
import { SetupHelp } from "@/components/setup-help"
import { RelativeTime } from "@/components/relative-time"
import {
  ConfidenceBadge,
  PersonStatusBadge,
  TagBadge,
  UnknownBadge,
} from "@/components/badges"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardData } from "@/lib/data/dashboard"
import { isUnidentified, personLabel, personSecondary, truncate } from "@/lib/format"

export const metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/people/new">
              <PlusIcon /> Add person
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/people">
              <UsersIcon /> People
            </Link>
          </Button>
        </div>
      </div>

      {!data.ok ? (
        <SetupHelp error={data.error} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="People" value={data.counts.people} icon={UsersIcon} href="/people" />
            <StatTile
              label="Organizations"
              value={data.counts.organizations}
              icon={BuildingIcon}
              href="/organizations"
            />
            <StatTile label="Open cases" value={data.counts.openCases} icon={BriefcaseIcon} href="/cases" />
            <StatTile
              label="Notes this week"
              value={data.counts.notesThisWeek}
              icon={NotebookPenIcon}
              href="/people"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recently added people</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col divide-y divide-border/60">
                {data.recentPeople.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Nobody on file yet. Add the first person, even if all you have is a description.
                  </p>
                ) : (
                  data.recentPeople.map((p) => {
                    const secondary = personSecondary(p)
                    return (
                      <Link
                        key={p.id}
                        href={`/people/${p.id}`}
                        className="-mx-2 flex items-start justify-between gap-3 rounded-md px-2 py-3 transition-colors hover:bg-accent/60"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{personLabel(p)}</span>
                            {isUnidentified(p) ? <UnknownBadge /> : null}
                          </div>
                          {secondary ? (
                            <p className="truncate text-sm text-muted-foreground">{secondary}</p>
                          ) : null}
                          {p.organizations.length > 0 ? (
                            <p className="truncate text-xs text-muted-foreground">
                              {p.organizations.map((o) => o.name).join(" · ")}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <PersonStatusBadge status={p.status} />
                          <RelativeTime iso={p.createdAt} className="text-xs text-muted-foreground" />
                        </div>
                      </Link>
                    )
                  })
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Latest intel</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col divide-y divide-border/60">
                {data.recentNotes.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No notes logged yet.
                  </p>
                ) : (
                  data.recentNotes.map((n) => (
                    <div key={n.id} className="flex flex-col gap-1.5 py-3">
                      <p className="text-sm leading-snug">{truncate(n.body, 180)}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        {n.person ? (
                          <Link href={`/people/${n.person.id}`} className="text-foreground hover:underline">
                            {personLabel(n.person)}
                          </Link>
                        ) : null}
                        {n.organization ? (
                          <Link
                            href={`/organizations/${n.organization.id}`}
                            className="text-foreground hover:underline"
                          >
                            {n.organization.name}
                          </Link>
                        ) : null}
                        {n.case ? (
                          <Link href={`/cases/${n.case.id}`} className="text-foreground hover:underline">
                            {n.case.title}
                          </Link>
                        ) : null}
                        {!n.person && !n.organization && !n.case ? <span>General intel</span> : null}
                        <span>·</span>
                        <span>{n.author?.callsign ?? "unknown officer"}</span>
                        <span>·</span>
                        <RelativeTime iso={n.created_at} />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <ConfidenceBadge confidence={n.confidence} />
                        {n.tags.map((t) => (
                          <TagBadge key={t} tag={t} />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
