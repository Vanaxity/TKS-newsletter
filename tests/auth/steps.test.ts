import { pathForStep } from "@/lib/auth/steps";

test.each([
  ["profile", "/onboarding/profile"],
  ["interests", "/onboarding/interests"],
  ["done", "/feed"],
] as const)("step %s → %s", (step, path) => expect(pathForStep(step)).toBe(path));
