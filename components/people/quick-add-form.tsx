"use client"

import { useActionState } from "react"
import { LoaderCircleIcon, ZapIcon } from "lucide-react"
import { quickAddPerson, type FormState } from "@/app/(app)/people/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const initialState: FormState = {}

/** One field, one click: opens a file on someone with only a description. */
export function QuickAddForm() {
  const [state, formAction, pending] = useActionState(quickAddPerson, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <div className="flex gap-2">
        <Input
          name="description"
          required
          maxLength={4000}
          placeholder='Quick add an unknown: "tall, red ski mask, drives a black Sultan, seen at the corner store"'
          aria-label="Description of the person"
        />
        <Button type="submit" disabled={pending} variant="secondary">
          {pending ? <LoaderCircleIcon className="animate-spin" /> : <ZapIcon />}
          Open file
        </Button>
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  )
}
