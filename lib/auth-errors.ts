/**
 * Supabase reports sign-in failures with a machine-readable code. Collapsing
 * them all into "wrong password" hides the causes that actually happen during
 * setup: an account that was never confirmed, a project URL with a typo, a key
 * from a different project, or the email provider switched off.
 */
export type SignInErrorLike = {
  name?: string
  message?: string
  code?: string
  status?: number
}

export function describeSignInError(error: SignInErrorLike): string {
  const message = error.message ?? ""

  switch (error.code) {
    case "invalid_credentials":
      return "Wrong email or password. If this officer has not been added yet, create them in Supabase under Authentication → Users."
    case "email_not_confirmed":
      return "That account exists but its email is not confirmed. In Supabase, open Authentication → Users and confirm it, or delete it and add it again with “Auto Confirm User” ticked."
    case "user_not_found":
      return "No account with that email. Add the officer in Supabase under Authentication → Users."
    case "user_banned":
      return "That account is banned in Supabase."
    case "signup_disabled":
    case "email_provider_disabled":
    case "provider_disabled":
      return "Email sign-in is switched off for this Supabase project. Enable the Email provider under Authentication → Sign In / Providers."
    case "over_request_rate_limit":
      return "Too many attempts. Wait a minute, then try again."
    case "validation_failed":
      return `Supabase rejected the request: ${message}`
  }

  // No HTTP status means the request never reached the project.
  if (error.name === "AuthRetryableFetchError" || error.status === undefined || error.status === 0) {
    return "Could not reach Supabase. Check that the project URL is https://<ref>.supabase.co and that the project is not paused."
  }

  if (error.status === 401 || /invalid api key|no api key/i.test(message)) {
    return "Supabase rejected the API key. Check that the anon key belongs to this project."
  }

  return message ? `Sign-in failed: ${message}` : "Sign-in failed."
}
