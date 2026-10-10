export const OAUTH_VERIFIER_COOKIE = "insforge_code_verifier";
export const OAUTH_NEXT_COOKIE = "insforge_oauth_next";

export function oauthErrorMessage(error?: string): string | undefined {
  if (!error) return undefined;
  if (error === "missing_verifier") return "Your sign-in session expired. Please try Google again.";
  return "Google sign-in wasn't completed. Please try again or sign in with email.";
}
