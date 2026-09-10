"use client"

import { useActionState, useEffect, useId, useState } from "react"
import { LoaderCircleIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { addCaseLink } from "@/app/(app)/cases/actions"
import { PersonPicker } from "@/components/people/person-picker"
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
import type { FormState } from "@/lib/action-types"
import { CASE_ROLE_SUGGESTIONS } from "@/lib/constants"
import type { PersonPick } from "@/lib/data/people"

type OrganizationOption = { id: string; name: string }

/**
 * One dialog for both halves of a case link: the database allows exactly one of
 * a person or an organization per row, so the two never share a form.
 */
export function AddCaseLinkDialog({
  caseId,
  kind,
  organizations = [],
  linkedIds,
}: {
  caseId: string
  kind: "person" | "organization"
  organizations?: OrganizationOption[]
  linkedIds: string[]
}) {
  const [open, setOpen] = useState(false)
  const available = organizations.filter((o) => !linkedIds.includes(o.id))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusIcon /> Link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {kind === "person" ? "Link a person to this case" : "Link an organization to this case"}
          </DialogTitle>
          <DialogDescription>
            The role is how they figure in this investigation, not their rank on the street.
          </DialogDescription>
        </DialogHeader>
        {kind === "organization" && available.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {organizations.length === 0
              ? "No organizations exist yet. Create one from the Organizations page first."
              : "Every organization on file is already linked to this case."}
          </p>
        ) : (
          <LinkForm
            caseId={caseId}
            kind={kind}
            organizations={available}
            linkedIds={linkedIds}
            onSaved={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function LinkForm({
  caseId,
  kind,
  organizations,
  linkedIds,
  onSaved,
}: {
  caseId: string
  kind: "person" | "organization"
  organizations: OrganizationOption[]
  linkedIds: string[]
  onSaved: () => void
}) {
  const [state, formAction, pending] = useActionState(addCaseLink, {} as FormState)
  const [person, setPerson] = useState<PersonPick | null>(null)
  const listId = useId()

  useEffect(() => {
    if (state.ok) {
      toast.success("Linked to the case")
      onSaved()
    }
  }, [state, onSaved])

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="case_id" value={caseId} />
      {kind === "person" ? (
        <>
          <input type="hidden" name="person_id" value={person?.id ?? ""} />
          <div className="flex flex-col gap-2">
            <Label>Person</Label>
            <PersonPicker value={person} onChange={setPerson} excludeIds={linkedIds} />
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="case_org">Organization</Label>
          <Select name="organization_id" required>
            <SelectTrigger id="case_org">
              <SelectValue placeholder="Pick one" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="case_role">Role in this case</Label>
        <Input
          id="case_role"
          name="role"
          list={listId}
          maxLength={100}
          placeholder="suspect, witness, unidentified…"
        />
        <datalist id={listId}>
          {CASE_ROLE_SUGGESTIONS.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <DialogFooter>
        <Button type="submit" disabled={pending || (kind === "person" && !person)}>
          {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
          Link
        </Button>
      </DialogFooter>
    </form>
  )
}
