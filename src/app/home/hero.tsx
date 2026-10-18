"use client";

import dynamic from "next/dynamic";
import { useRef, type ComponentType, type ReactNode } from "react";
import type { ASCIITextProps, DitherProps, LaserFlowProps } from "@/components/react-bits/typed-home";
import { useInView, useMotionPrefs } from "./use-motion";

// The WebGL effects load in the browser only, after the headline and buttons are already on screen.
const Dither = dynamic(() => import("@/components/react-bits/Dither"), { ssr: false }) as ComponentType<DitherProps>;
const LaserFlow = dynamic(() => import("@/components/react-bits/LaserFlow"), { ssr: false }) as ComponentType<LaserFlowProps>;
const ASCIIText = dynamic(() => import("@/components/react-bits/ASCIIText"), {
  ssr: false,
  loading: () => <Emphasis />,
}) as ComponentType<ASCIITextProps>;

const GREEN = "#51B04C";

function Emphasis() {
  return (
    <span className="block font-mono text-5xl font-bold tracking-tight text-tks-green sm:text-7xl">this is cool</span>
  );
}

// The always-dark hero: Dither waves behind, a green Laser Flow beam landing on the headline card,
// "this is cool" in ASCII Text. Phones and "reduce motion" get the calm version.
export function Hero({ nav, actions }: { nav: ReactNode; actions: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { small, reduced } = useMotionPrefs();
  const inView = useInView(sectionRef);
  const rich = !small && !reduced;

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[#0b0c0d] text-tks-white"
    >
      {/* Static backdrop: shows before the effects load and whenever they're off. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_60%_20%,rgba(81,176,76,0.28),transparent_60%),radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:100%_100%,6px_6px]"
      />
      <div aria-hidden className="absolute inset-0 -z-10">
        <Dither
          waveColor="#2c5f29"
          backgroundColor="#0b0c0d"
          ditherMode="bayer"
          colorNum={4}
          pixelSize={2}
          waveSpeed={0.04}
          waveFrequency={3}
          waveAmplitude={0.3}
          mouseEffect="reveal"
          mouseRadius={0.35}
          disableAnimation={reduced || !inView}
          dpr={small ? 1 : 2}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0c0d]/10 via-[#0b0c0d]/40 to-[#0b0c0d]" />
      </div>
      {rich ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <LaserFlow
            surfaceRef={cardRef}
            beamPosition={0.62}
            color={GREEN}
            intensity={1.6}
            flare={1.4}
            spread={1.4}
            spill={1}
            fog={0.18}
            dust={1.4}
            mouseInteraction
            paused={!inView}
          />
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-6xl px-4 pt-6">{nav}</div>

      <div className="mx-auto flex w-full max-w-5xl flex-1 items-end px-4 pb-16 pt-[24vh] sm:pb-24">
        <div
          ref={cardRef}
          className="relative w-full rounded-3xl border border-white/10 bg-black/45 p-6 shadow-2xl backdrop-blur-md sm:p-10"
        >
          <p className="mb-4 inline-flex rounded-full border border-tks-green/40 bg-tks-green/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-tks-green">
            For TKS students
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">The coolest videos in TKS,</h1>
          <div className="relative my-3 h-24 w-full sm:h-44" aria-label="this is cool">
            {rich ? (
              <ASCIIText
                text="this is cool"
                asciiFontSize={6}
                colors={[GREEN, "#7fd27a", "#c9f2c6"]}
                textColor="#f2f2f2"
                textScale={1.35}
                blocks={0.35}
                waves={0.5}
                chroma={0.2}
                hueShift={0}
                scramble={0.5}
                theme="dark"
              />
            ) : (
              <Emphasis />
            )}
          </div>
          <p className="max-w-xl text-lg text-tks-line sm:text-xl">
            turned into short reads made for what you&apos;re into. Pick your interests, rate, save and repost.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">{actions}</div>
        </div>
      </div>
    </section>
  );
}
