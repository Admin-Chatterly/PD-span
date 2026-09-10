import { ImageIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function EvidencePlaceholder({ count }: { count: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evidence</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
        <ImageIcon className="size-5" />
        <span>
          {count > 0 ? `${count} item${count === 1 ? "" : "s"} on file. ` : ""}
          Image uploads arrive in Phase 6.
        </span>
      </CardContent>
    </Card>
  )
}
