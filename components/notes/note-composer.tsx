"use client"

import { useActionState, useEffect, useId, useState } from "react"
import { LoaderCircleIcon, NotebookPenIcon } from "lucide-react"
import { toast } from "sonner"
import { addNote } from "@/app/(app)/people/actions"
import type { FormState } from "@/lib/action-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  CONFIDENCES,
  CONFIDENCE_LABELS,
  NOTE_SOURCES,
  NOTE_SOURCE_LABELS,
} from "@/lib/constants"

const initialState: FormState = {}

type Target = { personId?: string; organizationId?: string; caseId?: string }

/**
 * Logs a note against whatever target it is given (person, organization, case,
 * any mix, or none). The form remounts after each successful save.
 */
export function NoteComposer({ target, tagSuggestions }: { target: Target; tagSuggestions: string[] }) {
  const [round, setRound] = useState(0)
  return (
    <ComposerForm
      key={round}
      target={target}
      tagSuggestions={tagSuggestions}
      onSaved={() => setRound((r) => r + 1)}
    />
  )
}

function ComposerForm({
  target,
  tagSuggestions,
  onSaved,
}: {
  target: Target
  tagSuggestions: string[]
  onSaved: () => void
}) {
  const [state, formAction, pending] = useActionState(addNote, initialState)
  const listId = useId()

  useEffect(() => {
    if (state.ok) {
      toast.success("Note logged")
      onSaved()
    }
  }, [state, onSaved])

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {target.personId ? <input type="hidden" name="person_id" value={target.personId} /> : null}
      {target.organizationId ? (
        <input type="hidden" name="organization_id" value={target.organizationId} />
      ) : null}
      {target.caseId ? <input type="hidden" name="case_id" value={target.caseId} /> : null}

      <Textarea
        name="body"
        required
        rows={3}
        maxLength={10000}
        placeholder="What did you see, hear, or get told? Be specific: time, place, plates, who else was there."
        aria-label="Note"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Source</Label>
          <Select name="source" defaultValue="none">
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unspecified</SelectItem>
              {NOTE_SOURCES.map((s) => (
                <SelectItem key={s} value={s}>
                  {NOTE_SOURCE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Confidence</Label>
          <Select name="confidence" defaultValue="medium">
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONFIDENCES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CONFIDENCE_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Tags</Label>
          <Input name="tags" list={listId} placeholder="drugs, weapons, tip" className="h-8" />
          <datalist id={listId}>
            {tagSuggestions.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        {state.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : (
          <span />
        )}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <LoaderCircleIcon className="animate-spin" /> : <NotebookPenIcon />}
          Log note
        </Button>
      </div>
    </form>
  )
}
