import { DatabaseZapIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/** Shown when a database query fails; the usual cause right after setup is a missing migration. */
export function SetupHelp({ error }: { error: string }) {
  return (
    <Card className="border-amber-500/40">
      <CardHeader>
        <div className="flex items-center gap-2 text-amber-300">
          <DatabaseZapIcon className="size-5" />
          <CardTitle>The database is not ready</CardTitle>
        </div>
        <CardDescription>
          The app signed you in but could not read the intel tables. If this is a fresh project,
          open the Supabase SQL editor, paste the whole of{" "}
          <code className="font-mono text-xs">supabase/migrations/0001_init.sql</code> and run it,
          then reload this page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs text-muted-foreground">
          {error}
        </pre>
      </CardContent>
    </Card>
  )
}
