import { Suspense } from "react";
import { AuthCard } from "@/components/auth-card";
import { redirectIfSignedIn } from "@/lib/auth/viewer";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Sign up · TKS articles" };

export default function SignupPage() {
  return (
    <AuthCard title="Join TKS articles" subtitle="For TKS students only. You'll need the join code from TKS Slack.">
      <SignupForm />
      <Suspense fallback={null}>
        <SignedInRedirect />
      </Suspense>
    </AuthCard>
  );
}

async function SignedInRedirect() {
  await redirectIfSignedIn();
  return null;
}
