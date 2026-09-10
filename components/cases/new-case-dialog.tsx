"use client"

import { useState } from "react"
import { PlusIcon } from "lucide-react"
import { CaseForm } from "@/components/cases/case-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
          <DialogDescription>
            An investigation that groups the people and organizations involved.
          </DialogDescription>
        </DialogHeader>
        <CaseForm mode="create" />
      </DialogContent>
    </Dialog>
  )
}
