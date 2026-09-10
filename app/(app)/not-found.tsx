import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <h1 className="text-xl font-semibold">No such page</h1>
      <p className="text-sm text-muted-foreground">
        The link may be stale, or the record it pointed at was deleted or merged.
      </p>
      <Button asChild variant="secondary">
        <Link href="/">Back to the dashboard</Link>
      </Button>
    </div>
  )
}
