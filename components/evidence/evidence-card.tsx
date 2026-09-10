import { ExternalLinkIcon, FileIcon, Trash2Icon } from "lucide-react"
import { deleteEvidence } from "@/app/(app)/evidence/actions"
import { ActionButton } from "@/components/action-button"
import { RelativeTime } from "@/components/relative-time"
import type { EvidenceRow } from "@/lib/data/evidence"
import { describeEvidenceUrl } from "@/lib/evidence"

export function EvidenceCard({ item }: { item: EvidenceRow }) {
  const info = item.url ? describeEvidenceUrl(item.url) : null
  // An upload renders from its signed URL; a link renders only when it points
  // directly at an image.
  const imageSrc = item.signedUrl ?? (info?.kind === "image" ? item.url : null)

  return (
    <li className="flex flex-col gap-2 rounded-md border border-border p-2">
      {info?.embedUrl ? (
        <div className="aspect-video w-full overflow-hidden rounded bg-black">
          <iframe
            src={info.embedUrl}
            title={item.caption ?? info.label}
            className="size-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : null}
      {imageSrc ? (
        // Uploads are signed URLs and links point at arbitrary hosts, so neither
        // suits next/image, which needs a configured allowlist.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={item.caption ?? "Evidence image"}
          className="max-h-80 w-full rounded object-contain"
          loading="lazy"
        />
      ) : null}
      {item.storage_path && !item.signedUrl ? (
        <p className="rounded bg-muted p-3 text-xs text-muted-foreground">
          This file could not be signed for viewing. It is still in the bucket.
        </p>
      ) : null}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          {item.caption ? <p className="text-sm leading-snug">{item.caption}</p> : null}
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 truncate text-xs text-muted-foreground hover:underline"
            >
              <ExternalLinkIcon className="size-3 shrink-0" />
              <span className="truncate">{info?.label ?? item.url}</span>
            </a>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <FileIcon className="size-3" /> Uploaded file
            </span>
          )}
          <p className="text-xs text-muted-foreground">
            {item.author?.callsign ?? "unknown officer"} · <RelativeTime iso={item.created_at} />
          </p>
        </div>
        <ActionButton
          action={deleteEvidence.bind(null, item.id)}
          variant="ghost"
          size="icon-sm"
          title="Remove"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          confirm={{ title: "Remove this evidence?", actionLabel: "Remove", destructive: true }}
          successMessage="Evidence removed"
        >
          <Trash2Icon />
        </ActionButton>
      </div>
    </li>
  )
}
