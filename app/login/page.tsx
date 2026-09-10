import type { Metadata } from "next"
import { LoginForm } from "@/components/auth/login-form"
import { SupabaseNotConfigured } from "@/components/setup-help"
import { safeNextPath } from "@/lib/auth"
import { isSupabaseConfigured } from "@/lib/supabase/env"

export const metadata: Metadata = { title: "Sign in" }

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams
  const next = safeNextPath(searchParams.next)

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      {isSupabaseConfigured() ? <LoginForm next={next} /> : <SupabaseNotConfigured />}
    </div>
  )
}
