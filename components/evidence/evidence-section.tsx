import { AddEvidenceLinkDialog } from "@/components/evidence/add-evidence-link-dialog"
import { EvidenceCard } from "@/components/evidence/evidence-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { EvidenceRow, EvidenceTarget } from "@/lib/data/evidence"

export function EvidenceSection({ target, items }: { target: EvidenceTarget; items: EvidenceRow[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Evidence</CardTitle>
        <AddEvidenceLinkDialog target={target} />
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing attached. Paste a Medal.tv clip, a video link or an image URL. File uploads
            arrive in Phase 6.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <EvidenceCard key={item.id} item={item} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
