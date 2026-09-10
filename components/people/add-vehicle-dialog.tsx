"use client"

import { useActionState, useEffect, useState } from "react"
import { LoaderCircleIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { addVehicle, type FormState } from "@/app/(app)/people/actions"
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

export function AddVehicleDialog({ personId }: { personId: string }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusIcon /> Add
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a vehicle</DialogTitle>
          <DialogDescription>A plate or a model is enough. Plates are stored upper-case.</DialogDescription>
        </DialogHeader>
        <VehicleForm personId={personId} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

function VehicleForm({ personId, onSaved }: { personId: string; onSaved: () => void }) {
  const [state, formAction, pending] = useActionState(addVehicle, {} as FormState)

  useEffect(() => {
    if (state.ok) {
      toast.success("Vehicle added")
      onSaved()
    }
  }, [state, onSaved])

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="person_id" value={personId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="plate">Plate</Label>
          <Input id="plate" name="plate" placeholder="46EEK572" maxLength={16} className="font-mono uppercase" autoFocus />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="model">Model</Label>
          <Input id="model" name="model" placeholder="Karin Sultan" maxLength={100} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="color">Colour</Label>
        <Input id="color" name="color" placeholder="black, tinted windows" maxLength={100} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="vehicle_notes">Notes</Label>
        <Input id="vehicle_notes" name="notes" placeholder="Where seen, damage, modifications" maxLength={1000} />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
          Add vehicle
        </Button>
      </DialogFooter>
    </form>
  )
}
