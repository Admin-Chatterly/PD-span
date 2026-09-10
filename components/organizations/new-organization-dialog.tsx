"use client"

import { useState } from "react"
import { PlusIcon } from "lucide-react"
import { OrganizationForm } from "@/components/organizations/organization-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
          <DialogDescription>
            Gang, crew, cartel or business. Only the name is required.
          </DialogDescription>
        </DialogHeader>
        <OrganizationForm mode="create" />
      </DialogContent>
    </Dialog>
  )
}
