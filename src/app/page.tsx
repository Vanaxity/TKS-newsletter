import Link from "next/link";
import { Suspense } from "react";
import { getViewer } from "@/lib/auth/viewer";
import { pathForStep } from "@/lib/auth/steps";

const primary =
  "rounded-full bg-tks-green px-6 py-3 font-semibold text-on-green transition hover:bg-tks-green-hover";
const secondary =
  "rounded-full border border-ink px-6 py-3 font-semibold text-ink transition hover:bg-ink hover:text-page";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <h1 className="text-5xl font-semibold tracking-tight text-ink sm:text-7xl">TKS articles</h1>
      <p className="max-w-md text-lg text-muted">
        Cool videos from #r-thisiscool, turned into articles. Coming soon.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Suspense fallback={<SignedOutButtons />}>
          <HomeButtons />
        </Suspense>
      </div>
    </main>
  );
}

function SignedOutButtons() {
  return (
    <>
      <Link href="/signup" className={primary}>
        Sign up
      </Link>
      <Link href="/login" className={secondary}>
        Log in
      </Link>
    </>
  );
}

async function HomeButtons() {
  const viewer = await getViewer();
  if (!viewer) return <SignedOutButtons />;
  const done = viewer.profile.onboardingStep === "done";
  return (
    <Link href={pathForStep(viewer.profile.onboardingStep)} className={primary}>
      {done ? "Go to your feed" : "Finish setting up"}
    </Link>
  );
}
