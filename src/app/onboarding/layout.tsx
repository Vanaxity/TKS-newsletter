import type { ReactNode } from "react";
import { StepIndicator } from "./step-indicator";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <StepIndicator />
      {children}
    </div>
  );
}
