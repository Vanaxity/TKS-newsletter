import Link from "next/link";
import { Suspense } from "react";
import { getViewer } from "@/lib/auth/viewer";
import { pathForStep } from "@/lib/auth/steps";
import { INTERESTS } from "@/lib/interests";
import { Fresh } from "./home/fresh";
import { Hero } from "./home/hero";
import { HowItWorks } from "./home/how-it-works";
import { JoinButton } from "./home/join-button";

const ghost =
  "rounded-full border border-white/30 px-6 py-3 font-semibold text-tks-white transition hover:border-white hover:bg-white/10";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero
        nav={
          <nav className="flex items-center justify-between">
            <Link href="/" className="text-sm font-semibold tracking-tight text-tks-white">
              TKS articles
            </Link>
            <Suspense fallback={<NavLink href="/login" label="Log in" />}>
              <NavAccount />
            </Suspense>
          </nav>
        }
        actions={
          <Suspense fallback={<SignedOutActions />}>
            <HeroActions />
          </Suspense>
        }
      />
      <HowItWorks />
      <Suspense fallback={null}>
        <Fresh />
      </Suspense>
      <Interests />
      <footer className="mx-auto mt-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-line px-4 py-8 text-sm text-muted">
        <span>TKS articles · for TKS students</span>
        <span>Cool videos from #r-thisiscool, made readable.</span>
      </footer>
    </main>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-sm font-medium text-tks-white underline-offset-4 hover:underline">
      {label}
    </Link>
  );
}

async function NavAccount() {
  const viewer = await getViewer();
  return viewer ? <NavLink href={pathForStep(viewer.profile.onboardingStep)} label="Your feed" /> : <NavLink href="/login" label="Log in" />;
}

function SignedOutActions() {
  return (
    <>
      <JoinButton />
      <Link href="/login" className={ghost}>
        Log in
      </Link>
    </>
  );
}

async function HeroActions() {
  const viewer = await getViewer();
  if (!viewer) return <SignedOutActions />;
  const done = viewer.profile.onboardingStep === "done";
  return (
    <Link
      href={pathForStep(viewer.profile.onboardingStep)}
      className="rounded-full bg-tks-green px-7 py-3.5 text-lg font-semibold text-on-green transition hover:bg-tks-green-hover"
    >
      {done ? "Go to your feed" : "Finish setting up"}
    </Link>
  );
}

function Interests() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16">
      <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Whatever you&apos;re into</h2>
      <p className="mt-2 text-muted">Pick as many as you like when you join. Change them any time.</p>
      <div className="mt-8 flex flex-wrap gap-2">
        {INTERESTS.map((i) => (
          <span key={i.slug} className="rounded-full border border-line bg-card px-4 py-2 text-sm font-medium text-ink">
            {i.label}
          </span>
        ))}
      </div>
    </section>
  );
}
