import { resolveTheme, THEME_SCRIPT } from "@/lib/theme";

test.each([
  ["light", false, "light"],
  ["light", true, "light"],
  ["dark", false, "dark"],
  ["system", true, "dark"],
  ["system", false, "light"],
] as const)("%s with system dark=%s → %s", (choice, prefersDark, expected) => {
  expect(resolveTheme(choice, prefersDark)).toBe(expected);
});

test("the no-flash script reads the saved choice and sets data-theme", () => {
  expect(THEME_SCRIPT).toContain("localStorage");
  expect(THEME_SCRIPT).toContain("data-theme");
  expect(THEME_SCRIPT).toContain("prefers-color-scheme: dark");
  expect(() => new Function(THEME_SCRIPT)).not.toThrow();
});
