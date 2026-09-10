import { ConstructionIcon } from "lucide-react"

export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-24 text-center">
      <ConstructionIcon className="size-8 text-muted-foreground" />
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Not built yet. This arrives in {phase} of the build plan.
      </p>
    </div>
  )
}
