import { splitPreview } from "@/lib/articles/preview";

const words = (n: number, w = "word") => Array.from({ length: n }, () => w).join(" ");

test("a single paragraph is cut near the middle at a sentence", () => {
  const md = "One two three four. Five six seven eight. Nine ten eleven twelve. Thirteen fourteen fifteen sixteen.";
  expect(splitPreview(md)).toBe("One two three four. Five six seven eight.");
});

test("a single sentence is cut near the middle of its words", () => {
  expect(splitPreview("a b c d e f g h i j")).toBe("a b c d e…");
});

test("uneven blocks stop at the boundary closest to half, not after it", () => {
  const md = [words(40, "first"), words(55, "second"), words(5, "third")].join("\n\n");
  expect(splitPreview(md)).toBe(words(40, "first"));
});

test("a dominant first paragraph is cut inside, not shown whole", () => {
  const big = "Alpha beta gamma delta. Epsilon zeta eta theta. Iota kappa lambda mu. Nu xi omicron pi.";
  const preview = splitPreview(`${big}\n\nshort`);
  expect(preview).toBe("Alpha beta gamma delta. Epsilon zeta eta theta.");
});

test("never ends on a heading", () => {
  const md = ["one two three four", "## Next part", "five six seven eight"].join("\n\n");
  expect(splitPreview(md)).toBe("one two three four");
});

test("a heading line followed by text in the same block counts as text", () => {
  const md = ["## Start\nalpha beta gamma delta", "## Later\nepsilon zeta eta theta"].join("\n\n");
  expect(splitPreview(md)).toBe("## Start\nalpha beta gamma delta");
});

test("the preview is always shorter than the article", () => {
  for (const md of ["x", "x y", "x.\n\ny.", words(300), `${words(5)}\n\n${words(500)}`]) {
    expect(splitPreview(md).length).toBeLessThan(md.length);
  }
});
