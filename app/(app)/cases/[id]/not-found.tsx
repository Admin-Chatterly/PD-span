import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CaseNotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <h1 className="text-xl font-semibold">No such case</h1>
      <Button asChild variant="secondary">
        <Link href="/cases">Back to cases</Link>
      </Button>
    </div>
  )
}
