import { authErrorMessage } from "@/lib/auth/errors";

test.each([
  ["user_already_exists", "User already registered", "An account with that email already exists. Log in instead."],
  ["invalid_credentials", "Invalid login credentials", "Wrong email or password."],
  ["weak_password", "Password is too weak", "Choose a stronger password (at least 8 characters)."],
  ["over_request_rate_limit", "rate limit", "Too many tries. Wait a minute and try again."],
  ["over_email_send_rate_limit", "email rate limit exceeded", "Too many tries. Wait a minute and try again."],
  ["unexpected_failure", "Database error saving new user", "That join code is not right. Ask in TKS Slack."],
  [undefined, "ERROR: invalid join code (SQLSTATE P0001)", "That join code is not right. Ask in TKS Slack."],
  ["something_new", "Who knows", "Something went wrong. Try again."],
])("%s → friendly message", (code, message, expected) => {
  expect(authErrorMessage(code, message)).toBe(expected);
});
