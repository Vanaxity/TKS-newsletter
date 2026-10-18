import { Suspense } from "react";
import { AuthCard } from "@/components/auth-card";
import { redirectIfSignedIn } from "@/lib/auth/viewer";
import { LoginForm } from "./login-form";

export const metadata = { title: "Log in · TKS articles" };

export default function LoginPage() {
  return (
    <AuthCard title="Welcome back" subtitle="Log in to see your articles.">
      <LoginForm />
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
