import { formatDateTime, formatRelative } from "@/lib/format"

export function RelativeTime({ iso, className }: { iso: string | null | undefined; className?: string }) {
  if (!iso) return <span className={className}>never</span>
  return (
    <time dateTime={iso} title={formatDateTime(iso)} className={className} suppressHydrationWarning>
      {formatRelative(iso)}
    </time>
  )
}
