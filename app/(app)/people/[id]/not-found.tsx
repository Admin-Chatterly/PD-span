import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PersonNotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <h1 className="text-xl font-semibold">No such person</h1>
      <p className="text-sm text-muted-foreground">
        The record may have been deleted or merged into another one.
      </p>
      <Button asChild variant="secondary">
        <Link href="/people">Back to people</Link>
      </Button>
    </div>
  )
}
