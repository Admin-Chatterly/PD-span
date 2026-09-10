import type { Metadata } from "next"
import { LoginForm } from "@/components/auth/login-form"
import { safeNextPath } from "@/lib/auth"

export const metadata: Metadata = { title: "Sign in" }

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams
  const next = safeNextPath(searchParams.next)

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <LoginForm next={next} />
    </div>
  )
}
