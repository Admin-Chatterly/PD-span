import type { Metadata } from "next"
import { LoginForm } from "@/components/auth/login-form"
import { SupabaseNotConfigured } from "@/components/setup-help"
import { safeNextPath } from "@/lib/auth"
import { getSupabaseHost, isSupabaseConfigured } from "@/lib/supabase/env"

export const metadata: Metadata = { title: "Sign in" }

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams
  const next = safeNextPath(searchParams.next)

  if (!isSupabaseConfigured()) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <SupabaseNotConfigured />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4">
      <LoginForm next={next} />
      <p className="text-xs text-muted-foreground">Connected to {getSupabaseHost()}</p>
    </div>
  )
}
