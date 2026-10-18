"use client";

import { ComputerIcon, Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useSyncExternalStore } from "react";
import { resolveTheme, THEME_KEY, type ThemeChoice } from "@/lib/theme";

const ORDER: ThemeChoice[] = ["light", "dark", "system"];
const LABEL: Record<ThemeChoice, string> = { light: "Light", dark: "Dark", system: "System" };
const ICON = { light: Sun03Icon, dark: Moon02Icon, system: ComputerIcon };
const CHANGE_EVENT = "tks-theme-change";

function readChoice(): ThemeChoice {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}

function subscribeChoice(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(CHANGE_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(CHANGE_EVENT, cb);
  };
}

function apply(choice: ThemeChoice) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.setAttribute("data-theme", resolveTheme(choice, prefersDark));
}

// Cycles Light → Dark → System. The no-flash script in <head> applies the saved choice before first paint.
export function ThemeToggle() {
  const choice = useSyncExternalStore(subscribeChoice, readChoice, () => "system" as ThemeChoice);

  // While on System, follow the operating system as it changes.
  useEffect(() => {
    if (choice !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [choice]);

  function next() {
    const n = ORDER[(ORDER.indexOf(choice) + 1) % ORDER.length];
    try {
      if (n === "system") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, n);
    } catch {
      // Storage blocked: the choice still applies for this visit.
    }
    apply(n);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return (
    <button
      type="button"
      onClick={next}
      aria-label={`Theme: ${LABEL[choice]}. Change theme`}
      className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:border-ink"
    >
      <HugeiconsIcon icon={ICON[choice]} size={16} />
      {LABEL[choice]}
    </button>
  );
}
