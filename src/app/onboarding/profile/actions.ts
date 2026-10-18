"use server";

import { redirect } from "next/navigation";
import { avatarPathFor } from "@/lib/avatar";
import { fieldErrors, ProfileSchema, submittedValues, type FormState } from "@/lib/auth/schemas";
import { getViewer } from "@/lib/auth/viewer";
import { createServerSupabase } from "@/lib/supabase/server";

export async function saveProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const parsed = ProfileSchema.safeParse({
    username: formData.get("username"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    cohortType: formData.get("cohortType"),
    cohortId: formData.get("cohortId"),
    city: formData.get("city"),
    avatarPath: formData.get("avatarPath") ?? "",
  });
  const values = submittedValues(formData, ["username", "firstName", "lastName", "cohortType", "cohortId", "city", "avatarPath"]);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  const p = parsed.data;

  // Only the member's own avatar file may be attached.
  if (p.avatarPath && p.avatarPath !== avatarPathFor(viewer.id)) return { error: "That photo didn't save. Try again.", values };

  const supabase = await createServerSupabase();
  const { data: cohort } = await supabase.from("cohorts").select("type").eq("id", p.cohortId).maybeSingle();
  if (!cohort || cohort.type !== p.cohortType) return { fieldErrors: { cohortId: "Pick your cohort" }, values };

  const { error } = await supabase
    .from("profiles")
    .update({
      username: p.username,
      first_name: p.firstName,
      last_name: p.lastName,
      cohort_id: p.cohortId,
      city: p.city,
      avatar_path: p.avatarPath || null,
      // Someone editing after finishing onboarding stays finished.
      onboarding_step: viewer.profile.onboardingStep === "done" ? "done" : "interests",
    })
    .eq("id", viewer.id);
  if (error?.code === "23505") return { fieldErrors: { username: "That username is taken" }, values };
  if (error) return { error: "Something went wrong saving your profile. Try again.", values };

  redirect(viewer.profile.onboardingStep === "done" ? "/feed" : "/onboarding/interests");
}
