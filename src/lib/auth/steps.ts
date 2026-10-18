export type OnboardingStep = "profile" | "interests" | "done";

const PATHS = {
  profile: "/onboarding/profile",
  interests: "/onboarding/interests",
  done: "/feed",
} as const satisfies Record<OnboardingStep, string>;

// Where a member at this onboarding step belongs.
export function pathForStep(step: OnboardingStep): (typeof PATHS)[OnboardingStep] {
  return PATHS[step];
}
