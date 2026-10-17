import { readFileSync } from "node:fs";
import { INTERESTS, INTEREST_SLUGS } from "@/lib/interests";

test("15 interests with unique slugs, in the agreed order", () => {
  expect(INTEREST_SLUGS).toEqual([
    "math", "physics", "chemistry", "biology", "neuroscience", "robotics", "ai",
    "computer-science", "space", "energy", "climate", "medicine", "engineering", "business", "design",
  ]);
  expect(new Set(INTEREST_SLUGS).size).toBe(15);
  expect(INTERESTS.find((i) => i.slug === "ai")?.label).toBe("AI");
});

test("migration seeds exactly the same slugs", () => {
  const sql = readFileSync("supabase/migrations/0001_interests.sql", "utf8");
  const seeded = [...sql.matchAll(/\('([a-z-]+)',\s*'[^']+',\s*\d+\)/g)].map((m) => m[1]);
  expect(seeded).toEqual([...INTEREST_SLUGS]);
});
