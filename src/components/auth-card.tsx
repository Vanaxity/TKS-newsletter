import Link from "next/link";
import type { ReactNode } from "react";

// The page frame shared by sign-up, log-in and onboarding.
export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12 sm:py-20">
      <Link href="/" className="mb-8 text-sm font-semibold tracking-tight text-tks-black">
        TKS articles
      </Link>
      <div className="w-full max-w-md rounded-3xl bg-tks-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-tks-black">{title}</h1>
        {subtitle ? <p className="mt-1 text-tks-grey">{subtitle}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
