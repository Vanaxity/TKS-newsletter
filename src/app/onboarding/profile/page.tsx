import { Suspense } from "react";
import { AuthCard } from "@/components/auth-card";
import { initials } from "@/lib/avatar";
import { avatarSignedUrl } from "@/lib/avatar-url";
import { requireStep } from "@/lib/auth/viewer";
import { createServerSupabase } from "@/lib/supabase/server";
import { ProfileForm, type Cohort } from "./profile-form";

export const metadata = { title: "Your profile · TKS articles" };

export default function ProfileStepPage() {
  return (
    <AuthCard title="Set up your profile" subtitle="This is what other TKS students see.">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <ProfileStep />
      </Suspense>
    </AuthCard>
  );
}

async function ProfileStep() {
  const viewer = await requireStep("profile", "interests", "done");
  const supabase = await createServerSupabase();
  const [{ data: cohorts }, avatarUrl] = await Promise.all([
    supabase.from("cohorts").select("id, name, type").order("sort"),
    avatarSignedUrl(supabase, viewer.profile.avatarPath),
  ]);
  const p = viewer.profile;
  return (
    <ProfileForm
      userId={viewer.id}
      cohorts={(cohorts ?? []) as Cohort[]}
      avatarUrl={avatarUrl}
      initialInitials={initials(p.firstName, p.lastName)}
      defaults={{
        username: p.username ?? "",
        firstName: p.firstName ?? "",
        lastName: p.lastName ?? "",
        city: p.city ?? "",
        cohortId: p.cohortId,
        avatarPath: p.avatarPath,
      }}
    />
  );
}
