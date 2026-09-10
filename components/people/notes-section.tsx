import Link from "next/link"
import { Trash2Icon } from "lucide-react"
import { deleteNote } from "@/app/(app)/people/actions"
import { ActionButton } from "@/components/action-button"
import { ConfidenceBadge, TagBadge } from "@/components/badges"
import { NoteComposer } from "@/components/people/note-composer"
import { RelativeTime } from "@/components/relative-time"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NOTE_SOURCE_LABELS, NOTE_SOURCES, type NoteSource } from "@/lib/constants"
import type { NoteRow } from "@/lib/data/people"

function sourceLabel(source: string | null): string | null {
  if (!source) return null
  return (NOTE_SOURCES as readonly string[]).includes(source)
    ? NOTE_SOURCE_LABELS[source as NoteSource]
    : source
}

export function NotesSection({
  personId,
  notes,
  tagSuggestions,
}: {
  personId: string
  notes: NoteRow[]
  tagSuggestions: string[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Intel log</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <NoteComposer target={{ personId }} tagSuggestions={tagSuggestions} />

        {notes.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nothing logged yet. The first note usually explains why this person is on the board.
          </p>
        ) : (
          <ol className="flex flex-col divide-y divide-border/60">
            {notes.map((note) => (
              <li key={note.id} className="flex flex-col gap-2 py-3">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{note.body}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <ConfidenceBadge confidence={note.confidence} />
                  {sourceLabel(note.source) ? (
                    <Badge variant="outline">{sourceLabel(note.source)}</Badge>
                  ) : null}
                  {note.tags.map((t) => (
                    <TagBadge key={t} tag={t} />
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="flex flex-wrap items-center gap-x-2">
                    <span>{note.author?.callsign ?? "unknown officer"}</span>
                    <span>·</span>
                    <RelativeTime iso={note.created_at} />
                    {note.organization ? (
                      <>
                        <span>·</span>
                        <Link href={`/organizations/${note.organization.id}`} className="hover:underline">
                          {note.organization.name}
                        </Link>
                      </>
                    ) : null}
                    {note.case ? (
                      <>
                        <span>·</span>
                        <Link href={`/cases/${note.case.id}`} className="hover:underline">
                          {note.case.title}
                        </Link>
                      </>
                    ) : null}
                  </span>
                  <ActionButton
                    action={deleteNote.bind(null, note.id, personId)}
                    variant="ghost"
                    size="xs"
                    className="text-muted-foreground hover:text-destructive"
                    confirm={{
                      title: "Delete this note?",
                      description: "It is removed for everyone. There is no undo.",
                      actionLabel: "Delete",
                      destructive: true,
                    }}
                    successMessage="Note deleted"
                  >
                    <Trash2Icon />
                    Delete
                  </ActionButton>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
