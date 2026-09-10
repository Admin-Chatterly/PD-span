import Link from "next/link"
import { XIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

/**
 * Shown on a list that arrived from a tag badge, so it is obvious why the list
 * is short and how to widen it again.
 */
export function ActiveTagFilter({ tag, clearHref }: { tag: string; clearHref: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">Tagged</span>
      <Badge variant="default" className="font-mono text-xs">
        #{tag}
      </Badge>
      <Link
        href={clearHref}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
      >
        <XIcon className="size-3" /> clear
      </Link>
    </div>
  )
}
