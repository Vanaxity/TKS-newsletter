"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";

function mediaStore(query: string) {
  return {
    subscribe(cb: () => void) {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    get: () => window.matchMedia(query).matches,
  };
}

const smallScreen = mediaStore("(max-width: 768px)");
const reducedMotion = mediaStore("(prefers-reduced-motion: reduce)");

// Phones and "reduce motion" get lighter effects. On the server we assume the light version.
export function useMotionPrefs(): { small: boolean; reduced: boolean } {
  const small = useSyncExternalStore(smallScreen.subscribe, smallScreen.get, () => true);
  const reduced = useSyncExternalStore(reducedMotion.subscribe, reducedMotion.get, () => true);
  return { small, reduced };
}

// Whether an element is on screen, so effects can pause when scrolled away.
export function useInView(ref: RefObject<HTMLElement | null>): boolean {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return inView;
}

// Turns true the first time enough of an element scrolls into view, and stays true.
export function useSeen(ref: RefObject<HTMLElement | null>, threshold = 0.3): boolean {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setSeen(true);
        observer.disconnect();
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return seen;
}
