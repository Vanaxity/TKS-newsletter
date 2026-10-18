import { checkAvatarFile, initials, squareCrop } from "@/lib/avatar";

test("accepts a 1 MB JPEG", () => expect(checkAvatarFile({ type: "image/jpeg", size: 1_000_000 })).toBeNull());
test("accepts a 5 MB WebP exactly", () => expect(checkAvatarFile({ type: "image/webp", size: 5 * 1024 * 1024 })).toBeNull());
test("refuses a 6 MB photo", () =>
  expect(checkAvatarFile({ type: "image/png", size: 6 * 1024 * 1024 })).toBe("Photos must be 5 MB or smaller."));
test("refuses a GIF", () => expect(checkAvatarFile({ type: "image/gif", size: 1000 })).toBe("Photos must be JPG, PNG or WebP."));

test("wide photo crops from the centre", () => expect(squareCrop(1200, 800)).toEqual({ sx: 200, sy: 0, size: 800 }));
test("tall photo crops from the centre", () => expect(squareCrop(500, 2000)).toEqual({ sx: 0, sy: 750, size: 500 }));
test("square photo is untouched", () => expect(squareCrop(640, 640)).toEqual({ sx: 0, sy: 0, size: 640 }));

test("initials", () => {
  expect(initials("sam", "gun")).toBe("SG");
  expect(initials("Richard", null)).toBe("R");
  expect(initials(null, null)).toBe("?");
  expect(initials("  ", "")).toBe("?");
});

test("initials keep an emoji whole instead of splitting it", () => {
  expect(initials("🦊 Max", "Fox")).toBe("🦊F");
});
