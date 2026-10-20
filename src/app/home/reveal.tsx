"use client";

import type { ReactNode } from "react";
import { AnimatedContent } from "@/components/react-bits/animated-content";

const PRESETS = {
  // Headings: soft blur-in.
  heading: { distance: 30, blur: 10, duration: 0.9 },
  // Card rows: rise in one after another.
  cards: { distance: 70, blur: 6, duration: 0.8, stagger: 0.12 },
  // Step cards: flip up into place one after another, with a little overshoot.
  flip: { distance: 80, tilt: 40, blur: 8, duration: 1, stagger: 0.18, ease: "back.out(1.4)" },
  // Chips: pop in, in random order.
  chips: { distance: 20, scale: 0.6, duration: 0.5, stagger: 0.04, staggerFrom: "random" as const },
  // Anything else: gentle fade up.
  fade: { distance: 40, blur: 4, duration: 0.8 },
};

// Scroll-triggered reveal (React Bits Animated Content). Visible in the server HTML, so nothing is
// hidden if JavaScript is slow or off; once it runs, the content animates in as it scrolls into view.
export function Reveal({
  children,
  preset = "fade",
  className,
}: {
  children: ReactNode;
  preset?: keyof typeof PRESETS;
  className?: string;
}) {
  return (
    <AnimatedContent {...PRESETS[preset]} threshold={0.12} className={className} style={{ visibility: "visible" }}>
      {children}
    </AnimatedContent>
  );
}
