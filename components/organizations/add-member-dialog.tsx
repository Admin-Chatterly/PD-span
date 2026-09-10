"use client"

import { useActionState, useEffect, useId, useState } from "react"
import { LoaderCircleIcon, UserPlusIcon } from "lucide-react"
import { toast } from "sonner"
import { addMembership } from "@/app/(app)/memberships/actions"
import { PersonPicker } from "@/components/people/person-picker"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import type { FormState } from "@/lib/action-types"
import { MEMBERSHIP_ROLE_SUGGESTIONS } from "@/lib/constants"
import type { PersonPick } from "@/lib/data/people"

/** The organization side of membership management; the person page has the mirror of this. */
export function AddMemberDialog({
  organizationId,
  memberIds,
}: {
  organizationId: string
  memberIds: string[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlusIcon /> Add member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a member</DialogTitle>
          <DialogDescription>
            Suspected by default. Tick confirmed once the membership is established. Anyone on file
            can be added, including unidentified suspects.
          </DialogDescription>
        </DialogHeader>
        <MemberForm
          organizationId={organizationId}
          memberIds={memberIds}
          onSaved={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function MemberForm({
  organizationId,
  memberIds,
  onSaved,
}: {
  organizationId: string
  memberIds: string[]
  onSaved: () => void
}) {
  const [state, formAction, pending] = useActionState(addMembership, {} as FormState)
  const [picked, setPicked] = useState<PersonPick | null>(null)
  const listId = useId()

  useEffect(() => {
    if (state.ok) {
      toast.success("Member added")
      onSaved()
    }
  }, [state, onSaved])

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="organization_id" value={organizationId} />
      <input type="hidden" name="person_id" value={picked?.id ?? ""} />

      <div className="flex flex-col gap-2">
        <Label>Person</Label>
        <PersonPicker
          value={picked}
          onChange={setPicked}
          excludeIds={memberIds}
          placeholder="Search by name, alias or description"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="member_role">Role</Label>
        <Input
          id="member_role"
          name="role"
          list={listId}
          placeholder="enforcer, dealer, leader…"
          maxLength={100}
        />
        <datalist id={listId}>
          {MEMBERSHIP_ROLE_SUGGESTIONS.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="member_confirmed" name="is_confirmed" />
        <Label htmlFor="member_confirmed">Confirmed member</Label>
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <DialogFooter>
        <Button type="submit" disabled={pending || !picked}>
          {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
          Add member
        </Button>
      </DialogFooter>
    </form>
  )
}
