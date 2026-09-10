"use client"

import { useActionState, useState } from "react"
import { LoaderCircleIcon, PlusIcon } from "lucide-react"
import { createOrganization } from "@/app/(app)/organizations/actions"
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
import {
  ORGANIZATION_STATUSES,
  ORGANIZATION_STATUS_LABELS,
  ORGANIZATION_TYPES,
  ORGANIZATION_TYPE_LABELS,
} from "@/lib/constants"

export function NewOrganizationDialog() {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon /> New organization
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New organization</DialogTitle>
          <DialogDescription>Gang, crew, cartel or business. Only the name is required.</DialogDescription>
        </DialogHeader>
        <OrganizationForm />
      </DialogContent>
    </Dialog>
  )
}

function OrganizationForm() {
  const [state, formAction, pending] = useActionState(createOrganization, {} as FormState)
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="org_name">Name</Label>
        <Input id="org_name" name="name" required maxLength={200} autoFocus />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="org_type">Type</Label>
          <Select name="type" defaultValue="none">
            <SelectTrigger id="org_type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unknown</SelectItem>
              {ORGANIZATION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {ORGANIZATION_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="org_status">Status</Label>
          <Select name="status" defaultValue="active">
            <SelectTrigger id="org_status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORGANIZATION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {ORGANIZATION_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="org_territory">Territory</Label>
        <Input id="org_territory" name="territory" maxLength={200} placeholder="Grove Street, Davis" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="org_notes">Notes</Label>
        <Textarea id="org_notes" name="notes" rows={3} maxLength={4000} placeholder="Colours, activities, known fronts" />
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
