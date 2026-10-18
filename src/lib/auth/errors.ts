const JOIN_CODE = "That join code is not right. Ask in TKS Slack.";
const TOO_MANY = "Too many tries. Wait a minute and try again.";
export const EMAIL_NOT_CONFIRMED = "This account still needs its email confirmed. Ask a TKS director for help.";

// Turns Supabase Auth errors into something a student can act on.
export function authErrorMessage(code: string | undefined, message: string): string {
  switch (code) {
    case "user_already_exists":
    case "email_exists":
      return "An account with that email already exists. Log in instead.";
    case "invalid_credentials":
      return "Wrong email or password.";
    case "email_not_confirmed":
      return EMAIL_NOT_CONFIRMED;
    case "weak_password":
      return "Choose a stronger password (at least 8 characters).";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return TOO_MANY;
  }
  // The join-code trigger aborts the sign-up; Supabase reports it as a database error.
  if (/invalid join code|database error saving new user/i.test(message)) return JOIN_CODE;
  return "Something went wrong. Try again.";
}
