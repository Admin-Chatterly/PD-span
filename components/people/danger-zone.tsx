"use client"

import { useState, useTransition } from "react"
import { GitMergeIcon, LoaderCircleIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { deletePerson, mergePeople } from "@/app/(app)/people/actions"
import { PersonPicker } from "@/components/people/person-picker"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import type { PersonPick } from "@/lib/data/people"
import { isUnidentified, personLabel } from "@/lib/format"

type Counts = {
  notes: number
  vehicles: number
  memberships: number
  associates: number
  caseLinks: number
  evidence: number
}

type Person = { id: string; name: string | null; alias: string | null; description: string | null; status: string }

export function DangerZone({ person, counts }: { person: Person; counts: Counts }) {
  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">Record actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <MergeDialog person={person} />
        <DeleteDialog person={person} counts={counts} />
      </CardContent>
    </Card>
  )
}

function MergeDialog({ person }: { person: Person }) {
  const [open, setOpen] = useState(false)
  const [other, setOther] = useState<PersonPick | null>(null)
  const [keep, setKeep] = useState<"this" | "other">(isUnidentified(person) ? "other" : "this")
  const [pending, startTransition] = useTransition()

  const keepRecord = keep === "this" ? person : other
  const dropRecord = keep === "this" ? other : person

  function run() {
    if (!other) return
    const keepId = keep === "this" ? person.id : other.id
    const dropId = keep === "this" ? other.id : person.id
    startTransition(async () => {
      const result = await mergePeople(keepId, dropId)
      if (result && !result.ok) toast.error(result.error)
      else toast.success("Records merged")
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setOther(null)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="justify-start">
          <GitMergeIcon /> Merge with another record
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge two records</DialogTitle>
          <DialogDescription>
            Use this when an unknown turns out to be someone already on file. Notes, vehicles,
            memberships, associates, case links and evidence all move to the record you keep; blanks on
            it are filled from the other one, and the other one is deleted.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>The other record</Label>
            <PersonPicker value={other} onChange={setOther} excludeIds={[person.id]} />
          </div>
          {other ? (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium">Which record survives?</legend>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="keep"
                  checked={keep === "this"}
                  onChange={() => setKeep("this")}
                  className="accent-primary"
                />
                Keep <strong>{personLabel(person)}</strong> (this page)
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="keep"
                  checked={keep === "other"}
                  onChange={() => setKeep("other")}
                  className="accent-primary"
                />
                Keep <strong>{personLabel(other)}</strong>
              </label>
              {keepRecord && dropRecord ? (
                <p className="text-xs text-muted-foreground">
                  Everything on <strong>{personLabel(dropRecord)}</strong> moves to{" "}
                  <strong>{personLabel(keepRecord)}</strong>, then{" "}
                  <strong>{personLabel(dropRecord)}</strong> is deleted.
                </p>
              ) : null}
            </fieldset>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" onClick={run} disabled={!other || pending}>
            {pending ? <LoaderCircleIcon className="animate-spin" /> : <GitMergeIcon />}
            Merge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteDialog({ person, counts }: { person: Person; counts: Counts }) {
  const [pending, startTransition] = useTransition()

  const parts = [
    counts.notes > 0 ? `${counts.notes} note${counts.notes === 1 ? "" : "s"}` : null,
    counts.memberships > 0 ? `${counts.memberships} membership${counts.memberships === 1 ? "" : "s"}` : null,
    counts.associates > 0 ? `${counts.associates} associate link${counts.associates === 1 ? "" : "s"}` : null,
    counts.caseLinks > 0 ? `${counts.caseLinks} case link${counts.caseLinks === 1 ? "" : "s"}` : null,
    counts.evidence > 0 ? `${counts.evidence} evidence item${counts.evidence === 1 ? "" : "s"}` : null,
  ].filter(Boolean)

  function run() {
    startTransition(async () => {
      const result = await deletePerson(person.id)
      if (result && !result.ok) toast.error(result.error)
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="justify-start text-destructive hover:text-destructive">
          <Trash2Icon /> Delete this record
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {personLabel(person)}?</AlertDialogTitle>
          <AlertDialogDescription>
            {parts.length > 0
              ? `This also deletes ${parts.join(", ")}. `
              : "Nothing else is attached to this record. "}
            {counts.vehicles > 0
              ? `${counts.vehicles} vehicle${counts.vehicles === 1 ? " stays" : "s stay"} on file without an owner. `
              : ""}
            If this is a duplicate, merge instead so nothing is lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={run}
            disabled={pending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
