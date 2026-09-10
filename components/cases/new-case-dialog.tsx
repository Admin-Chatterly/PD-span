"use client"

import { useActionState, useState } from "react"
import { LoaderCircleIcon, PlusIcon } from "lucide-react"
import { createCase } from "@/app/(app)/cases/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import type { FormState } from "@/lib/action-types"
import { CASE_STATUSES, CASE_STATUS_LABELS } from "@/lib/constants"

export function NewCaseDialog() {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon /> New case
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New case</DialogTitle>
          <DialogDescription>An investigation that groups people and organizations.</DialogDescription>
        </DialogHeader>
        <CaseForm />
      </DialogContent>
    </Dialog>
  )
}

function CaseForm() {
  const [state, formAction, pending] = useActionState(createCase, {} as FormState)
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="case_title">Title</Label>
        <Input id="case_title" name="title" required maxLength={200} placeholder="Operation Green Light" autoFocus />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="case_description">Description</Label>
        <Textarea id="case_description" name="description" rows={3} maxLength={4000} />
      </div>
      <div className="flex flex-col gap-2 sm:max-w-xs">
        <Label htmlFor="case_status">Status</Label>
        <Select name="status" defaultValue="open">
          <SelectTrigger id="case_status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CASE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {CASE_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
          Create
        </Button>
      </DialogFooter>
    </form>
  )
}
