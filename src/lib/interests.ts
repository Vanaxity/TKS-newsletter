// The one list every article tag and every member's interests come from.
// Keep supabase/migrations/0001_interests.sql seeded with the same slugs (a test checks this).
export const INTERESTS = [
  { slug: "math", label: "Math" },
  { slug: "physics", label: "Physics" },
  { slug: "chemistry", label: "Chemistry" },
  { slug: "biology", label: "Biology" },
  { slug: "neuroscience", label: "Neuroscience" },
  { slug: "robotics", label: "Robotics" },
  { slug: "ai", label: "AI" },
  { slug: "computer-science", label: "Computer science" },
  { slug: "space", label: "Space" },
  { slug: "energy", label: "Energy" },
  { slug: "climate", label: "Climate" },
  { slug: "medicine", label: "Medicine" },
  { slug: "engineering", label: "Engineering" },
  { slug: "business", label: "Business" },
  { slug: "design", label: "Design" },
] as const;

export type InterestSlug = (typeof INTERESTS)[number]["slug"];

export const INTEREST_SLUGS = INTERESTS.map((i) => i.slug) as [InterestSlug, ...InterestSlug[]];
