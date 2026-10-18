import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { pathForStep, type OnboardingStep } from "./steps";

export type Viewer = {
  id: string;
  email: string;
  profile: {
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    avatarPath: string | null;
    cohortId: number | null;
    city: string | null;
    role: "member" | "admin";
    onboardingStep: OnboardingStep;
  };
};

// The signed-in member and their profile, or null. Reads cookies, so call it inside <Suspense>.
export async function getViewer(): Promise<Viewer | null> {
  // Supabase checks the token's expiry against the clock, which Next.js won't allow while prefetching a
  // page ahead of time. Wait for the real request instead.
  await connection();
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const { data: p } = await supabase
    .from("profiles")
    .select("username, first_name, last_name, avatar_path, cohort_id, city, role, onboarding_step")
    .eq("id", claims.sub)
    .single();
  if (!p) return null;

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
    profile: {
      username: p.username,
      firstName: p.first_name,
      lastName: p.last_name,
      avatarPath: p.avatar_path,
      cohortId: p.cohort_id,
      city: p.city,
      role: p.role,
      onboardingStep: p.onboarding_step,
    },
  };
}

// Lets the member through only at one of the given steps; otherwise sends them where they belong.
export async function requireStep(...allowed: OnboardingStep[]): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (!allowed.includes(viewer.profile.onboardingStep)) redirect(pathForStep(viewer.profile.onboardingStep));
  return viewer;
}

// For the sign-up and log-in pages: signed-in members go straight to where they belong.
export async function redirectIfSignedIn(): Promise<void> {
  const viewer = await getViewer();
  if (viewer) redirect(pathForStep(viewer.profile.onboardingStep));
}
