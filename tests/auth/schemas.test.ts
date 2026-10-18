import { fieldErrors, InterestsSchema, LoginSchema, ProfileSchema, SignupSchema } from "@/lib/auth/schemas";

const valid = (over: Record<string, unknown> = {}) => ({
  username: "sam_99",
  firstName: "Sam",
  lastName: "Gun",
  cohortType: "global",
  cohortId: "1",
  city: "Toronto",
  avatarPath: "",
  ...over,
});

test("username is lowercased and trimmed", () => {
  expect(ProfileSchema.parse(valid({ username: "  Sam_99 " })).username).toBe("sam_99");
});

test.each(["ab", "a".repeat(21), "has space", "dash-no", "émile"])("rejects username %s", (u) => {
  const r = ProfileSchema.safeParse(valid({ username: u }));
  expect(r.success).toBe(false);
  if (!r.success) expect(fieldErrors(r.error).username).toBe("3–20 characters: lowercase letters, numbers or _");
});

test("cohort id is a positive number", () => {
  expect(ProfileSchema.parse(valid({ cohortId: "3" })).cohortId).toBe(3);
  const r = ProfileSchema.safeParse(valid({ cohortId: "" }));
  expect(r.success).toBe(false);
  if (!r.success) expect(fieldErrors(r.error).cohortId).toBe("Pick your cohort");
});

test("avatar path must be the member's own avatar file, or empty", () => {
  const uuid = "3f1c2e8a-1b2c-4d5e-8f90-123456789abc";
  expect(ProfileSchema.parse(valid({ avatarPath: `${uuid}/avatar.webp` })).avatarPath).toBe(`${uuid}/avatar.webp`);
  expect(ProfileSchema.parse(valid({ avatarPath: "" })).avatarPath).toBe("");
  expect(ProfileSchema.safeParse(valid({ avatarPath: "../other/thing.png" })).success).toBe(false);
});

test("password needs 8 characters", () => {
  const r = SignupSchema.safeParse({ email: "a@b.co", password: "short", joinCode: "X" });
  expect(r.success).toBe(false);
  if (!r.success) expect(fieldErrors(r.error).password).toBe("At least 8 characters");
});

test("sign-up needs a valid email and a join code", () => {
  const r = SignupSchema.safeParse({ email: "nope", password: "longenough", joinCode: "  " });
  expect(r.success).toBe(false);
  if (!r.success) {
    expect(fieldErrors(r.error).email).toBe("Enter a valid email");
    expect(fieldErrors(r.error).joinCode).toBe("Enter the TKS join code");
  }
});

test("log-in needs an email and any password", () => {
  expect(LoginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  expect(LoginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
});

test("city and names are required", () => {
  const r = ProfileSchema.safeParse(valid({ city: "  ", firstName: "", lastName: "" }));
  expect(r.success).toBe(false);
  if (!r.success) {
    const e = fieldErrors(r.error);
    expect(e.city).toBe("Enter your city");
    expect(e.firstName).toBe("Enter your first name");
    expect(e.lastName).toBe("Enter your last name");
  }
});

test("interests need at least one known slug, duplicates removed", () => {
  const empty = InterestsSchema.safeParse({ interests: [] });
  expect(empty.success).toBe(false);
  if (!empty.success) expect(fieldErrors(empty.error).interests).toBe("Pick at least one interest");
  expect(InterestsSchema.safeParse({ interests: ["cooking"] }).success).toBe(false);
  expect(InterestsSchema.parse({ interests: ["ai", "ai", "math"] }).interests).toEqual(["ai", "math"]);
});

test("fieldErrors keeps the first message per field", () => {
  const r = ProfileSchema.safeParse({});
  expect(r.success).toBe(false);
  if (!r.success) expect(Object.keys(fieldErrors(r.error))).toEqual(expect.arrayContaining(["username", "city"]));
});
