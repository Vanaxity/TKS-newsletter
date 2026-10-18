import { z } from "zod";
import { INTEREST_SLUGS } from "@/lib/interests";

export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const AVATAR_PATH_RE = /^([0-9a-f-]{36}\/avatar\.webp)?$/;

export type FormState = { error?: string; fieldErrors?: Record<string, string> };

// A required, trimmed text field with one message for every way it can be wrong.
const text = (message: string, max: number) =>
  z.string({ error: message }).trim().min(1, { error: message }).max(max, { error: message });

const email = z
  .string({ error: "Enter a valid email" })
  .trim()
  .pipe(z.email({ error: "Enter a valid email" }));

export const SignupSchema = z.object({
  email,
  password: z.string({ error: "At least 8 characters" }).min(8, { error: "At least 8 characters" }),
  joinCode: text("Enter the TKS join code", 100),
});

export const LoginSchema = z.object({
  email,
  password: z.string({ error: "Enter your password" }).min(1, { error: "Enter your password" }),
});

const USERNAME_MESSAGE = "3–20 characters: lowercase letters, numbers or _";

export const ProfileSchema = z.object({
  username: z
    .string({ error: USERNAME_MESSAGE })
    .trim()
    .toLowerCase()
    .regex(USERNAME_RE, { error: USERNAME_MESSAGE }),
  firstName: text("Enter your first name", 50),
  lastName: text("Enter your last name", 50),
  cohortType: z.enum(["global", "in_person"], { error: "Pick your cohort" }),
  cohortId: z.coerce.number({ error: "Pick your cohort" }).int({ error: "Pick your cohort" }).positive({ error: "Pick your cohort" }),
  city: text("Enter your city", 80),
  avatarPath: z.string().trim().regex(AVATAR_PATH_RE).optional().default(""),
});

export const InterestsSchema = z.object({
  interests: z
    .array(z.string(), { error: "Pick at least one interest" })
    .transform((list) => [...new Set(list)])
    .pipe(z.array(z.enum(INTEREST_SLUGS, { error: "Pick at least one interest" })).min(1, { error: "Pick at least one interest" })),
});

// First error message for each top-level field, for showing under form inputs.
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
