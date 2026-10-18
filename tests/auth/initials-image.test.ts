import { initialsImageUrl } from "@/lib/avatar";

test("builds an SVG data URL for normal initials", () => {
  const url = initialsImageUrl("RR");
  expect(url.startsWith("data:image/svg+xml")).toBe(true);
  expect(decodeURIComponent(url)).toContain(">RR</text>");
});

test("never throws on emoji initials", () => {
  expect(() => initialsImageUrl("🦊F")).not.toThrow();
});

test("escapes characters that would break the SVG", () => {
  const svg = decodeURIComponent(initialsImageUrl("<&"));
  expect(svg).toContain("&lt;&amp;");
  expect(svg).not.toContain("><&<");
});
