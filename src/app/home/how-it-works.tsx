"use client";

import { AiMagicIcon, Target02Icon, YoutubeIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import dynamic from "next/dynamic";
import { useRef, type ComponentType } from "react";
import type { LaserFlowProps } from "@/components/react-bits/typed-home";
import { Reveal } from "./reveal";
import { useInView, useMotionPrefs, useSeen } from "./use-motion";

const LaserFlow = dynamic(() => import("@/components/react-bits/LaserFlow"), { ssr: false }) as ComponentType<LaserFlowProps>;

const STEPS = [
  {
    n: "01",
    icon: YoutubeIcon,
    title: "Spot something cool",
    body: "Someone posts a YouTube video in #r-thisiscool, or sends one to the bot.",
  },
  {
    n: "02",
    icon: AiMagicIcon,
    title: "It becomes a short read",
    body: "AI watches it and writes an article sized to the video. A TKS person checks it before it goes live.",
  },
  {
    n: "03",
    icon: Target02Icon,
    title: "You get what you're into",
    body: "Pick your interests. Rate, save and repost. Widely reposted picks reach everyone.",
  },
];

// An always-dark band: a green Laser Flow beam drops onto the tray of steps when it scrolls into view,
// and the three cards flip up into it one after another. Phones and "reduce motion" skip the beam.
export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const { small, reduced } = useMotionPrefs();
  const inView = useInView(sectionRef);
  // Mount the beam once the band is properly on screen, so its drop plays while someone is looking.
  const seen = useSeen(sectionRef);
  const rich = !small && !reduced;

  return (
    <section ref={sectionRef} className="relative isolate overflow-hidden bg-[#0b0c0d] text-tks-white">
      {/* Static glow: shows before the beam arrives and whenever it's off. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_50%_100%,rgba(81,176,76,0.16),transparent_65%)]"
      />
      {rich && seen ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <LaserFlow
            surfaceRef={trayRef}
            beamPosition={0.5}
            color="#51B04C"
            intensity={1.1}
            flare={1.1}
            spread={1.5}
            spill={0.9}
            fog={0.08}
            dust={1.1}
            mouseInteraction
            paused={!inView}
          />
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-20">
        <Reveal preset="heading" className="max-w-[min(28rem,calc(50%-4rem))] max-md:max-w-md">
          <p className="mb-4 inline-flex rounded-full border border-tks-green/40 bg-tks-green/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-tks-green">
            How it works
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">From a Slack link to your feed</h2>
        </Reveal>

        <div
          ref={trayRef}
          className="mt-12 rounded-[2rem] border border-white/10 bg-black/40 p-3 backdrop-blur-[3px] md:mt-48"
        >
          <Reveal preset="flip" className="grid gap-3 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className="group flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition-[translate,border-color,background-color,box-shadow] duration-300 hover:-translate-y-1.5 hover:border-tks-green/50 hover:bg-white/[0.07] hover:shadow-[0_24px_60px_-24px_rgba(81,176,76,0.6)]"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="flex size-12 animate-float items-center justify-center rounded-2xl bg-tks-green/15 text-tks-green ring-1 ring-tks-green/30 transition-[scale,background-color,color] duration-300 group-hover:scale-110 group-hover:bg-tks-green group-hover:text-on-green motion-reduce:animate-none"
                    style={{ animationDelay: `${i * -1.3}s` }}
                  >
                    <HugeiconsIcon icon={s.icon} size={24} />
                  </span>
                  <span className="font-mono text-sm text-white/40 transition-colors group-hover:text-tks-green">{s.n}</span>
                </div>
                <h3 className="text-xl font-semibold">{s.title}</h3>
                <p className="text-white/65">{s.body}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
