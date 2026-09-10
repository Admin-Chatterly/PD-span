"use client"

import { useState } from "react"
import { PencilIcon } from "lucide-react"
import { UnknownBadge } from "@/components/badges"
import { PersonForm } from "@/components/people/person-form"
import { StatusSelect } from "@/components/people/status-select"
import { RelativeTime } from "@/components/relative-time"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { isUnidentified, personLabel } from "@/lib/format"

type Person = {
  id: string
  name: string | null
  alias: string | null
  description: string | null
  status: string
  created_at: string
  updated_at: string
}

function initials(label: string): string {
  if (label === "Unknown") return "?"
  const parts = label.split(/\s+/).filter(Boolean)
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

export function IdentityCard({ person, createdBy }: { person: Person; createdBy: string | null }) {
  const [editing, setEditing] = useState(false)
  const label = personLabel(person)

  return (
    <Card>
      <CardContent>
        {editing ? (
          <PersonForm
            mode="edit"
            person={person}
            onDone={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-muted text-xl font-semibold text-muted-foreground">
              {initials(label)}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{label}</h1>
                {isUnidentified(person) ? <UnknownBadge /> : null}
                {person.name && person.alias ? (
                  <span className="text-lg text-muted-foreground">&ldquo;{person.alias}&rdquo;</span>
                ) : null}
              </div>
              {person.description ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{person.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No description yet.</p>
              )}
              <p className="text-xs text-muted-foreground">
                Opened <RelativeTime iso={person.created_at} />
                {createdBy ? ` by ${createdBy}` : ""} · updated <RelativeTime iso={person.updated_at} />
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
              <StatusSelect personId={person.id} status={person.status} />
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <PencilIcon /> Edit identity
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
