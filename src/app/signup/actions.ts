"use server";

import { redirect } from "next/navigation";
import { authErrorMessage, EMAIL_NOT_CONFIRMED } from "@/lib/auth/errors";
import { fieldErrors, SignupSchema, submittedValues, type FormState } from "@/lib/auth/schemas";
import { createServerSupabase } from "@/lib/supabase/server";

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = SignupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    joinCode: formData.get("joinCode"),
  });
  const values = submittedValues(formData, ["email", "joinCode"]);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const supabase = await createServerSupabase();
  // The database checks the join code; a wrong one aborts the sign-up.
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { join_code: parsed.data.joinCode } },
  });
  if (error) {
    const message = authErrorMessage(error.code, error.message);
    return message.includes("join code") ? { fieldErrors: { joinCode: message }, values } : { error: message, values };
  }
  // Only happens if "Confirm email" is switched on in Supabase: the account exists but can't log in yet.
  if (!data.session) return { error: EMAIL_NOT_CONFIRMED, values };
  redirect("/onboarding/profile");
}
