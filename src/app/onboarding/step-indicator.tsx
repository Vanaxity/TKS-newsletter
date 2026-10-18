"use client";

import { usePathname } from "next/navigation";

const STEPS = [
  { path: "/onboarding/profile", label: "Profile" },
  { path: "/onboarding/interests", label: "Interests" },
];

export function StepIndicator() {
  const pathname = usePathname();
  const current = STEPS.findIndex((s) => pathname.startsWith(s.path));
  return (
    <ol className="mx-auto mt-8 flex items-center gap-3 text-sm" aria-label="Setup progress">
      {STEPS.map((step, i) => (
        <li key={step.path} className="flex items-center gap-2">
          <span
            className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${
              i <= current ? "bg-tks-green text-on-green" : "bg-card text-muted ring-1 ring-line"
            }`}
            aria-current={i === current ? "step" : undefined}
          >
            {i + 1}
          </span>
          <span className={i === current ? "font-medium text-ink" : "text-muted"}>{step.label}</span>
          {i < STEPS.length - 1 ? <span className="mx-1 h-px w-8 bg-line" aria-hidden /> : null}
        </li>
      ))}
    </ol>
  );
}
