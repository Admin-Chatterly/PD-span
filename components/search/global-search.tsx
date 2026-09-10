"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  BriefcaseIcon,
  BuildingIcon,
  CarIcon,
  LoaderCircleIcon,
  NotebookPenIcon,
  SearchIcon,
  UserIcon,
} from "lucide-react"
import { globalSearch, type SearchHit } from "@/app/(app)/search/actions"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { SEARCH_KIND_LABELS, groupHits, searchHitHref } from "@/lib/search"
import { truncate } from "@/lib/format"

const KIND_ICONS: Record<string, typeof UserIcon> = {
  person: UserIcon,
  organization: BuildingIcon,
  vehicle: CarIcon,
  note: NotebookPenIcon,
  case: BriefcaseIcon,
}

/**
 * One input over everything: name, alias, description, plate, territory, note
 * body and tags. Opens on ctrl+K or cmd+K because it is used mid-shift.
 */
export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState("")
  const [hits, setHits] = useState<SearchHit[]>([])
  const [pending, startTransition] = useTransition()
  const latest = useRef(0)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((previous) => !previous)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    if (!open) return
    const requestId = ++latest.current
    const handle = window.setTimeout(() => {
      startTransition(async () => {
        const results = await globalSearch(term)
        // Ignore a slow response that a newer keystroke has overtaken.
        if (requestId === latest.current) setHits(results)
      })
    }, 200)
    return () => window.clearTimeout(handle)
  }, [term, open])

  function go(hit: SearchHit) {
    setOpen(false)
    router.push(searchHitHref(hit, term))
  }

  const groups = groupHits(hits)
  const short = term.trim().length < 2

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 text-muted-foreground"
        title="Search everything (ctrl+K)"
      >
        <SearchIcon />
        <span className="hidden lg:inline">Search</span>
        <kbd className="hidden rounded border border-border px-1 font-mono text-[10px] lg:inline">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Search people, vehicles, organizations, intel and cases"
        // The database already ranked and capped these; cmdk re-filtering them
        // against the raw input would hide matches it cannot see, such as a
        // plate found by its normalised form.
        commandProps={{ shouldFilter: false }}
      >
        <CommandInput
          value={term}
          onValueChange={setTerm}
          placeholder="Name, alias, description, plate, tag…"
        />
        <CommandList>
          {short ? (
            <CommandEmpty>Type at least two characters.</CommandEmpty>
          ) : pending && groups.length === 0 ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <LoaderCircleIcon className="size-4 animate-spin" />
            </div>
          ) : (
            <CommandEmpty>Nothing matches that.</CommandEmpty>
          )}
          {groups.map((group) => {
            const Icon = KIND_ICONS[group.kind] ?? SearchIcon
            return (
              <CommandGroup key={group.kind} heading={SEARCH_KIND_LABELS[group.kind] ?? group.kind}>
                {group.hits.map((hit) => (
                  <CommandItem
                    key={`${hit.kind}:${hit.id}`}
                    value={`${hit.kind}:${hit.id}`}
                    onSelect={() => go(hit)}
                    className="gap-2"
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate">{truncate(hit.title, 70)}</span>
                      {hit.subtitle ? (
                        <span className="truncate text-xs text-muted-foreground">
                          {truncate(hit.subtitle, 80)}
                        </span>
                      ) : null}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )
          })}
        </CommandList>
      </CommandDialog>
    </>
  )
}
