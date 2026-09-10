"use client"

import { useTransition } from "react"
import { LoaderCircleIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { deleteCase } from "@/app/(app)/cases/actions"
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

export function CaseDangerZone({
  caseId,
  title,
  counts,
}: {
  caseId: string
  title: string
  counts: { links: number; notes: number }
}) {
  const [pending, startTransition] = useTransition()

  function run() {
    startTransition(async () => {
      const result = await deleteCase(caseId)
      if (result && !result.ok) toast.error(result.error)
    })
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">Case actions</CardTitle>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive"
            >
              <Trash2Icon /> Delete this case
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {title}?</AlertDialogTitle>
              <AlertDialogDescription>
                {counts.links > 0
                  ? `${counts.links} link${counts.links === 1 ? "" : "s"} to people and organizations will be removed, but those records stay on file. `
                  : "Nothing is linked to it. "}
                {counts.notes > 0
                  ? `${counts.notes} note${counts.notes === 1 ? "" : "s"} logged against the case will be kept and detached, so the intel survives. `
                  : ""}
                Consider closing the case instead if it may come back.
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
