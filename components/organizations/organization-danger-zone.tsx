"use client"

import { useTransition } from "react"
import { LoaderCircleIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { deleteOrganization } from "@/app/(app)/organizations/actions"
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

type Counts = {
  members: number
  notes: number
  caseLinks: number
  evidence: number
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}

export function OrganizationDangerZone({
  organizationId,
  name,
  counts,
}: {
  organizationId: string
  name: string
  counts: Counts
}) {
  const [pending, startTransition] = useTransition()

  // Spell out what survives, because the answer differs per relation: people
  // and their notes stay, join rows and attached evidence do not.
  const kept: string[] = []
  if (counts.members > 0) kept.push(`${plural(counts.members, "member")} stay on file`)
  if (counts.notes > 0) kept.push(`${plural(counts.notes, "note")} are kept but no longer linked here`)

  const removed: string[] = []
  if (counts.members > 0) removed.push(plural(counts.members, "membership"))
  if (counts.caseLinks > 0) removed.push(plural(counts.caseLinks, "case link"))
  if (counts.evidence > 0) removed.push(`${plural(counts.evidence, "evidence item")} attached to it`)

  function run() {
    startTransition(async () => {
      const result = await deleteOrganization(organizationId)
      if (result && !result.ok) toast.error(result.error)
    })
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">Record actions</CardTitle>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
              <Trash2Icon /> Delete this organization
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
              <AlertDialogDescription>
                {kept.length > 0 ? `${kept.join(", and ")}. ` : ""}
                {removed.length > 0
                  ? `This deletes ${removed.join(", ")}. `
                  : "Nothing else is attached. "}
                Consider setting the status to disbanded instead, which keeps the history.
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
      </CardContent>
    </Card>
  )
}
