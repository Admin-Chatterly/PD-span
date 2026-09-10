import Link from "next/link"
import { PersonStatusBadge, UnknownBadge } from "@/components/badges"
import { RelativeTime } from "@/components/relative-time"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { PersonSummary } from "@/lib/data/people"
import { isUnidentified, personLabel, personSecondary, truncate } from "@/lib/format"
import { cn } from "@/lib/utils"

export function PeopleTable({ people, filtered }: { people: PersonSummary[]; filtered: boolean }) {
  if (people.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
        {filtered
          ? "No one matches that search."
          : "Nobody on file yet. Use quick add above, or open a full form with Add person."}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-56">Person</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Organizations</TableHead>
            <TableHead>Plates</TableHead>
            <TableHead>Last note</TableHead>
            <TableHead className="text-right">Added</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {people.map((p) => {
            const secondary = personSecondary(p)
            return (
              <TableRow key={p.id}>
                <TableCell className="max-w-md">
                  <Link href={`/people/${p.id}`} className="group block">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium group-hover:underline">{personLabel(p)}</span>
                      {isUnidentified(p) ? <UnknownBadge /> : null}
                    </div>
                    {secondary ? (
                      <p className="truncate text-xs text-muted-foreground">{truncate(secondary, 110)}</p>
                    ) : null}
                  </Link>
                </TableCell>
                <TableCell>
                  <PersonStatusBadge status={p.status} />
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {p.organizations.map((o) => (
                      <Link
                        key={o.id}
                        href={`/organizations/${o.id}`}
                        title={o.is_confirmed ? "Confirmed member" : "Suspected member"}
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-xs hover:bg-accent",
                          o.is_confirmed ? "border-border" : "border-dashed border-zinc-500/60 text-zinc-400"
                        )}
                      >
                        {o.name}
                        {o.role ? <span className="text-muted-foreground"> · {o.role}</span> : null}
                      </Link>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{p.plates.join(", ")}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {p.lastNoteAt ? (
                    <>
                      <RelativeTime iso={p.lastNoteAt} />
                      <span className="text-xs"> ({p.noteCount})</span>
                    </>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  <RelativeTime iso={p.createdAt} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
