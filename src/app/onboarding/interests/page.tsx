import { Suspense } from "react";
import { AuthCard } from "@/components/auth-card";
import { requireStep } from "@/lib/auth/viewer";
import { createServerSupabase } from "@/lib/supabase/server";
import { InterestsForm } from "./interests-form";

export const metadata = { title: "Your interests · TKS articles" };

export default function InterestsStepPage() {
  return (
    <AuthCard title="What are you into?" subtitle="Pick at least one. Your feed shows articles about these.">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <InterestsStep />
      </Suspense>
    </AuthCard>
  );
}

async function InterestsStep() {
  const viewer = await requireStep("interests", "done");
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("profile_interests").select("interest_slug").eq("profile_id", viewer.id);
  return (
    <InterestsForm
      initial={(data ?? []).map((r) => r.interest_slug)}
      finishedBefore={viewer.profile.onboardingStep === "done"}
    />
  );
}
