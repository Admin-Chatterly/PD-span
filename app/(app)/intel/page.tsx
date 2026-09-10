import Link from "next/link"
import { IntelToolbar, type IntelFilters } from "@/components/intel/intel-toolbar"
import { TagBar } from "@/components/intel/tag-bar"
import { NoteComposer } from "@/components/notes/note-composer"
import { NoteList } from "@/components/notes/note-list"
import { SetupHelp } from "@/components/setup-help"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CONFIDENCES, NOTE_SOURCES } from "@/lib/constants"
import {
  listNoteTargets,
  listNotes,
  listTags,
  NOTE_ATTACHMENTS,
  type NoteAttachment,
} from "@/lib/data/notes"
import { createClient } from "@/lib/supabase/server"

export const metadata = { title: "Intel" }

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "")
}

function oneOf<T extends string>(values: readonly T[], value: string): T | "" {
  return (values as readonly string[]).includes(value) ? (value as T) : ""
}

export default async function IntelPage(props: PageProps<"/intel">) {
  const searchParams = await props.searchParams
  const attachmentParam = first(searchParams.attachment)
  const filters: IntelFilters = {
    q: first(searchParams.q),
    tag: first(searchParams.tag).toLowerCase(),
    source: oneOf(NOTE_SOURCES, first(searchParams.source)),
    confidence: oneOf(CONFIDENCES, first(searchParams.confidence)),
    attachment: oneOf(NOTE_ATTACHMENTS, attachmentParam) || "any",
  }

  const supabase = await createClient()
  const [result, tags, targets] = await Promise.all([
    listNotes(supabase, {
      q: filters.q,
      tag: filters.tag || undefined,
      source: filters.source || undefined,
      confidence: filters.confidence || undefined,
      attachment: filters.attachment as NoteAttachment,
    }),
    listTags(supabase),
    listNoteTargets(supabase),
  ])

  const filtered = Boolean(
    filters.q || filters.tag || filters.source || filters.confidence || filters.attachment !== "any"
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Intel</h1>
          {result.ok ? (
            <p className="text-sm text-muted-foreground">
              {result.total} note{result.total === 1 ? "" : "s"}
              {filtered ? " matching" : " logged"}
            </p>
          ) : null}
        </div>
        {filtered ? (
          <Button asChild variant="ghost" size="sm">
            <Link href="/intel">Clear filters</Link>
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log intel</CardTitle>
        </CardHeader>
        <CardContent>
          <NoteComposer
            tagSuggestions={tags.map((t) => t.tag)}
            targetOptions={targets}
          />
        </CardContent>
      </Card>

      <TagBar tags={tags} filters={filters} />
      <IntelToolbar {...filters} />

      {!result.ok ? (
        <SetupHelp error={result.error} />
      ) : (
        <Card>
          <CardContent>
            <NoteList
              notes={result.notes}
              emptyText={
                filtered
                  ? "No intel matches those filters."
                  : "Nothing logged yet. Anything you hear can go in here, even before you know who it is about."
              }
            />
          </CardContent>
        </Card>
      )}

      {result.ok && result.total > result.notes.length ? (
        <p className="text-center text-xs text-muted-foreground">
          Showing the {result.notes.length} most recent of {result.total}. Narrow the filters to see
          older intel.
        </p>
      ) : null}
    </div>
  )
}
