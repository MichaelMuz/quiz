import { describe, expect, it } from "vitest";
import {
  contentBank,
  generateOrderingQuestion,
  gradeAnswer,
  validateContent,
  type OrderingItem,
} from "../src/content.js";

const expansionOrder = [
  "brace expansion",
  "tilde expansion",
  "parameter expansion",
  "command substitution",
  "arithmetic expansion",
  "word splitting",
  "pathname expansion",
];

describe("Bash expansion ordering practice", () => {
  it("keeps one stable authored order and produces a reproducible fixed-seed shuffle", () => {
    const item = contentBank.find((candidate) => candidate.id === "bash-effective-shell-expansion-order") as OrderingItem | undefined;

    expect(item).toBeDefined();
    expect(item).toMatchObject({ kind: "ordering", orderedItems: expansionOrder });
    const question = generateOrderingQuestion(item!, 1234);
    expect(question.expectedAnswer).toBe(JSON.stringify(expansionOrder));
    expect(question.shuffledItems).toEqual([
      "arithmetic expansion",
      "brace expansion",
      "parameter expansion",
      "pathname expansion",
      "command substitution",
      "tilde expansion",
      "word splitting",
    ]);
    expect(generateOrderingQuestion(item!, 1234)).toEqual(question);
  });

  it("never presents the canonical answer as the initial shuffled state", () => {
    const item = contentBank.find((candidate) => candidate.id === "bash-effective-shell-expansion-order") as OrderingItem;

    expect(generateOrderingQuestion(item, 14780).shuffledItems).not.toEqual(expansionOrder);
  });

  it("rejects incomplete or duplicate authored ordering values", () => {
    const item = contentBank.find((candidate) => candidate.id === "bash-effective-shell-expansion-order") as OrderingItem;

    expect(() => validateContent([{ ...item, id: "empty-order", orderedItems: [] }], []))
      .toThrow(/ordering.*at least two/i);
    expect(() => validateContent([{ ...item, id: "duplicate-order", orderedItems: ["same", "same"] }], []))
      .toThrow(/ordering.*unique/i);
  });

  it("grades only the exact complete sequence", () => {
    const expected = JSON.stringify(expansionOrder);

    expect(gradeAnswer("exact-order", JSON.stringify(expansionOrder), expected)).toBe(true);
    expect(gradeAnswer("exact-order", JSON.stringify([...expansionOrder].reverse()), expected)).toBe(false);
    expect(gradeAnswer("exact-order", JSON.stringify(expansionOrder.slice(0, -1)), expected)).toBe(false);
    expect(gradeAnswer("exact-order", "not json", expected)).toBe(false);
  });
});
