import { redirect } from "next/navigation";
import { Suspense } from "react";
import { requireStep } from "@/lib/auth/viewer";

// "/me" → the member's own profile page.
export default function MePage() {
  return (
    <Suspense fallback={null}>
      <ToProfile />
    </Suspense>
  );
}

async function ToProfile() {
  const viewer = await requireStep("done");
  redirect(`/u/${viewer.profile.username}`);
  return null;
}
