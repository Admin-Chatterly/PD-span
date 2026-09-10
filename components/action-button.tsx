"use client"

import { useTransition, type ComponentProps } from "react"
import { LoaderCircleIcon } from "lucide-react"
import { toast } from "sonner"
import type { ActionResult } from "@/app/(app)/people/actions"
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

type Props = Omit<ComponentProps<typeof Button>, "onClick" | "type"> & {
  /** A server action (or a bound one) that reports success or an error message. */
  action: () => Promise<ActionResult | void>
  successMessage?: string
  confirm?: { title: string; description?: string; actionLabel?: string; destructive?: boolean }
}

/** Runs a server action from a button, with toast feedback and an optional confirmation step. */
export function ActionButton({ action, successMessage, confirm, children, disabled, ...button }: Props) {
  const [pending, startTransition] = useTransition()

  function run() {
    startTransition(async () => {
      const result = await action()
      if (result && !result.ok) {
        toast.error(result.error)
      } else if (successMessage) {
        toast.success(successMessage)
      }
    })
  }

  const content = (
    <>
      {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
      {children}
    </>
  )

  if (!confirm) {
    return (
      <Button type="button" {...button} disabled={disabled || pending} onClick={run}>
        {content}
      </Button>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" {...button} disabled={disabled || pending}>
          {content}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirm.title}</AlertDialogTitle>
          {confirm.description ? (
            <AlertDialogDescription>{confirm.description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={run}
            className={confirm.destructive ? "bg-destructive text-white hover:bg-destructive/90" : undefined}
          >
            {confirm.actionLabel ?? "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
