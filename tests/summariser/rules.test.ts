import { countWords, lengthTarget, readMinutes, titlesMatch } from "@/lib/summariser/rules";

test("short videos get 100-250 words", () => {
  expect(lengthTarget(1)).toEqual({ min: 100, max: 250 });
  expect(lengthTarget(5)).toEqual({ min: 100, max: 250 });
});

test("longer videos scale at about 30 words a minute, 250 to 1500", () => {
  expect(lengthTarget(6)).toEqual({ min: 250, max: 300 });
  expect(lengthTarget(19)).toEqual({ min: 456, max: 684 });
  expect(lengthTarget(90)).toEqual({ min: 1200, max: 1500 });
});

test("read minutes", () => {
  expect(readMinutes(50)).toBe(1);
  expect(readMinutes(483)).toBe(2);
  expect(readMinutes(1500)).toBe(7);
});

test("countWords ignores markdown symbols", () => {
  expect(countWords("## Two words\n\n* **bold** item")).toBe(4);
});

test("titles that differ only in punctuation match", () => {
  expect(
    titlesMatch(
      "But what is a neural network? | Deep learning chapter 1",
      "But what is a neural network? | Deep learning, chapter 1",
    ),
  ).toBe(true);
  expect(titlesMatch("  HELLO   World!! ", "hello world")).toBe(true);
});

test("different titles do not match", () => {
  expect(titlesMatch("But what is a neural network?", "How transformers work")).toBe(false);
});
