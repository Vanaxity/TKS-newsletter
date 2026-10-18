"use client";

import { AnimatedContent } from "@/components/react-bits/typed-home";

const STEPS = [
  {
    n: "1",
    title: "Spot something cool",
    body: "Someone posts a YouTube video in #r-thisiscool, or sends one to the bot.",
  },
  {
    n: "2",
    title: "It becomes a short read",
    body: "AI watches it and writes an article sized to the video. A TKS person checks it before it goes live.",
  },
  {
    n: "3",
    title: "You get what you're into",
    body: "Pick your interests. Rate, save and repost. Widely reposted picks reach everyone.",
  },
];

// Three steps that rise in one after another as they scroll into view (React Bits Animated Content).
export function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20">
      <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">How it works</h2>
      <AnimatedContent distance={60} duration={0.7} stagger={0.12} threshold={0.15} className="mt-10 grid gap-4 md:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.n} className="flex flex-col gap-3 rounded-3xl border border-line bg-card p-6">
            <span className="flex size-10 items-center justify-center rounded-full bg-tks-green text-lg font-semibold text-on-green">
              {s.n}
            </span>
            <h3 className="text-xl font-semibold text-ink">{s.title}</h3>
            <p className="text-muted">{s.body}</p>
          </div>
        ))}
      </AnimatedContent>
    </section>
  );
}
