"use client"

import { useEffect, useState } from "react"
import { LoaderCircleIcon, NotebookPenIcon } from "lucide-react"
import { getComposerOptions, type ComposerOptions } from "@/app/(app)/notes/actions"
import { NoteComposer } from "@/components/notes/note-composer"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

/**
 * Intel arrives mid-shift, rarely while the right page is open, so the composer
 * is reachable from anywhere. The pickers are fetched when the dialog opens so
 * the header costs nothing on pages that never use it.
 */
export function LogIntelButton() {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ComposerOptions | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!open || options || failed) return
    let active = true
    getComposerOptions()
      .then((next) => {
        if (active) setOptions(next)
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
    }
  }, [open, options, failed])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" title="Log intel">
          <NotebookPenIcon />
          <span className="hidden sm:inline">Log intel</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Log intel</DialogTitle>
          <DialogDescription>
            Attach it to whoever it is about, or to nobody if you do not know yet.
          </DialogDescription>
        </DialogHeader>
        {failed ? (
          <p role="alert" className="text-sm text-destructive">
            Could not load the people and organizations to attach to. Reload and try again.
          </p>
        ) : options ? (
          <NoteComposer
            tagSuggestions={options.tagSuggestions}
            targetOptions={{ organizations: options.organizations, cases: options.cases }}
            onSaved={() => setOpen(false)}
            submitLabel="Log intel"
          />
        ) : (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <LoaderCircleIcon className="size-5 animate-spin" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
