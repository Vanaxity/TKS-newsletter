"use server";

import { redirect } from "next/navigation";
import { fieldErrors, InterestsSchema, type FormState } from "@/lib/auth/schemas";
import { getViewer } from "@/lib/auth/viewer";
import { createServerSupabase } from "@/lib/supabase/server";

export async function saveInterests(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.profile.onboardingStep === "profile") redirect("/onboarding/profile");

  const parsed = InterestsSchema.safeParse({ interests: formData.getAll("interests") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createServerSupabase();
  const { error: clearError } = await supabase.from("profile_interests").delete().eq("profile_id", viewer.id);
  const { error: insertError } = clearError
    ? { error: clearError }
    : await supabase
        .from("profile_interests")
        .insert(parsed.data.interests.map((slug) => ({ profile_id: viewer.id, interest_slug: slug })));
  if (insertError) return { error: "Something went wrong saving your interests. Try again." };

  if (viewer.profile.onboardingStep !== "done") {
    const { error } = await supabase.from("profiles").update({ onboarding_step: "done" }).eq("id", viewer.id);
    if (error) return { error: "Something went wrong saving your interests. Try again." };
  }
  redirect("/feed");
}
