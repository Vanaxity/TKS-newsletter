"use client";

import Link from "next/link";

// Shown instead of Next's bare "Application error" when something fails while rendering.
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Something went wrong</h1>
      <p className="max-w-md text-muted">It might be your connection. Try again, or head back to your feed.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-tks-green px-6 py-3 font-semibold text-on-green hover:bg-tks-green-hover"
        >
          Try again
        </button>
        <Link href="/feed" className="rounded-full border border-ink px-6 py-3 font-semibold text-ink">
          Go to your feed
        </Link>
      </div>
    </main>
  );
}
