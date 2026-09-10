import { NoteComposer } from "@/components/notes/note-composer"
import { NoteList, type NotesTarget } from "@/components/notes/note-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { NoteRow } from "@/lib/data/notes"

export type { NotesTarget }

/** The intel log on a person, organization or case page: composer, then feed. */
export function NotesSection({
  target,
  notes,
  tagSuggestions,
  emptyText = "Nothing logged yet.",
}: {
  target: NotesTarget
  notes: NoteRow[]
  tagSuggestions: string[]
  emptyText?: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Intel log</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <NoteComposer target={target} tagSuggestions={tagSuggestions} />
        <NoteList notes={notes} target={target} emptyText={emptyText} />
      </CardContent>
    </Card>
  )
}
