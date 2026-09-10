import Link from "next/link"
import { BoardGraphView } from "@/components/board/board-graph"
import { BoardLegend } from "@/components/board/board-legend"
import { BoardScopePicker } from "@/components/board/board-scope-picker"
import { SetupHelp } from "@/components/setup-help"
import { Button } from "@/components/ui/button"
import { getBoardGraph, listBoardScopes, type BoardScope } from "@/lib/data/board"
import { isUuid } from "@/lib/data/filters"
import { createClient } from "@/lib/supabase/server"

export const metadata = { title: "Board" }

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "")
}

/** `case:<uuid>` or `organization:<uuid>`; anything else falls back to everyone. */
function parseScope(raw: string): BoardScope {
  const [kind, id] = raw.split(":")
  if ((kind === "case" || kind === "organization") && id && isUuid(id)) {
    return { kind, id }
  }
  return { kind: "all" }
}

export default async function BoardPage(props: PageProps<"/board">) {
  const searchParams = await props.searchParams
  const raw = first(searchParams.scope)
  const scope = parseScope(raw)
  const value = scope.kind === "all" ? "all" : `${scope.kind}:${scope.id}`

  const supabase = await createClient()
  const [result, options] = await Promise.all([
    getBoardGraph(supabase, scope),
    listBoardScopes(supabase),
  ])

  const nodeCount = result.ok ? result.graph.people.length + result.graph.organizations.length : 0
  const edgeCount = result.ok ? result.graph.memberships.length + result.graph.associates.length : 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Board</h1>
          <p className="text-sm text-muted-foreground">
            {result.ok
              ? `${nodeCount} node${nodeCount === 1 ? "" : "s"}, ${edgeCount} link${edgeCount === 1 ? "" : "s"}. Click anything to open its file.`
              : "The graph could not be loaded."}
          </p>
        </div>
        <BoardScopePicker value={value} options={options} />
      </div>

      {!result.ok ? (
        <SetupHelp error={result.error} />
      ) : nodeCount === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-24 text-center">
          <p className="max-w-md text-sm text-muted-foreground">
            {scope.kind === "all"
              ? "Nothing to plot yet. The board draws people and organizations once they are linked by memberships or associates."
              : "Nothing is linked to this yet. Add members or link people to the case, and they will appear here."}
          </p>
          <Button asChild variant="secondary" size="sm">
            <Link href="/people">Open people</Link>
          </Button>
        </div>
      ) : (
        <>
          <BoardLegend />
          {/* Remounting on a scope change resets the layout to the new graph. */}
          <BoardGraphView key={value} graph={result.graph} />
          {result.graph.truncated ? (
            <p className="text-center text-xs text-muted-foreground">
              Showing the most recently updated {result.graph.people.length} people. Pick a case or
              an organization to see a readable slice.
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}
