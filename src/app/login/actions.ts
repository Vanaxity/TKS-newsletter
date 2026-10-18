"use server";

import { redirect } from "next/navigation";
import { authErrorMessage } from "@/lib/auth/errors";
import { fieldErrors, LoginSchema, type FormState } from "@/lib/auth/schemas";
import { pathForStep, type OnboardingStep } from "@/lib/auth/steps";
import { createServerSupabase } from "@/lib/supabase/server";

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = LoginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { error: authErrorMessage(error?.code, error?.message ?? "") };

  const { data: profile } = await supabase.from("profiles").select("onboarding_step").eq("id", data.user.id).single();
  redirect(pathForStep((profile?.onboarding_step as OnboardingStep | undefined) ?? "profile"));
}
