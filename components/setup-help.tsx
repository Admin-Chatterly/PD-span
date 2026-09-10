import { DatabaseZapIcon, PlugZapIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SUPABASE_KEY_VARIABLES, SUPABASE_URL_VARIABLES } from "@/lib/supabase/env"

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
          open the Supabase SQL editor, run every file in{" "}
          <code className="font-mono text-xs">supabase/migrations/</code> in order, then reload
          this page.
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

/** Shown on the login page when the deployment has no Supabase connection settings. */
export function SupabaseNotConfigured() {
  return (
    <Card className="w-full max-w-lg border-amber-500/40">
      <CardHeader>
        <div className="flex items-center gap-2 text-amber-300">
          <PlugZapIcon className="size-5" />
          <CardTitle>This deployment is not connected to Supabase</CardTitle>
        </div>
        <CardDescription>
          The server cannot find the project URL and public key, so nobody can sign in yet.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        <div>
          <p className="font-medium">Variables it looks for</p>
          <p className="text-muted-foreground">URL: one of</p>
          <pre className="mt-1 rounded-md bg-muted p-2 font-mono text-xs">{SUPABASE_URL_VARIABLES.join("\n")}</pre>
          <p className="mt-2 text-muted-foreground">Key: one of</p>
          <pre className="mt-1 rounded-md bg-muted p-2 font-mono text-xs">{SUPABASE_KEY_VARIABLES.join("\n")}</pre>
        </div>
        <div>
          <p className="font-medium">On Vercel</p>
          <p className="text-muted-foreground">
            Project Settings → Environment Variables. Each variable has environment checkboxes;
            tick Production, Preview and Development. Then redeploy: Deployments → the latest
            one → Redeploy. Variables only take effect on a new deployment.
          </p>
        </div>
        <div>
          <p className="font-medium">Locally</p>
          <p className="text-muted-foreground">
            Copy <code className="font-mono text-xs">.env.example</code> to{" "}
            <code className="font-mono text-xs">.env.local</code> and fill in both values.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
