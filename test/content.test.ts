import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  contentBank,
  generateQuestion,
  generatedDefinitions,
  gradeAnswer,
  validateContent,
} from "../src/content.js";

describe("content validation", () => {
  it("rejects duplicate stable IDs", () => {
    expect(() => validateContent([contentBank[0]!, contentBank[0]!], generatedDefinitions))
      .toThrow(/duplicate question id/i);
  });

  it("rejects missing generator and grader registrations", () => {
    expect(() => validateContent(contentBank, [{ id: "broken", generator: "missing", grader: "missing" }]))
      .toThrow(/generator.*missing.*grader.*missing/i);
  });

  it("accepts the shipped bank", () => {
    expect(() => validateContent(contentBank, generatedDefinitions)).not.toThrow();
  });
});

describe("static questions", () => {
  it("tests numerical latency anchors rather than relative ordering", () => {
    const item = contentBank.find((candidate) => candidate.id === "systems-latency-orders");
    expect(item).toBeDefined();
    expect(item!.prompt).toMatch(/latency.*order of magnitude/i);
    expect(item!.prompt).toMatch(/L1.*DRAM.*NVMe.*HDD.*cross-region/i);
    expect(item!.prompt).not.toMatch(/fastest-to-slowest|capacity/i);
    expect(item!.answer).toMatch(/1 ns.*100 ns.*100 µs.*10 ms.*100 ms/i);
  });

  it("makes the VIPT L1D geometry derivable instead of teaching 64 KiB as universal", () => {
    const item = contentBank.find((candidate) => candidate.id === "systems-vipt-l1-geometry");
    expect(item).toBeDefined();
    expect(item!.prompt).toMatch(/4 KiB.*64 B.*8.*12.*16/i);
    expect(item!.answer).toMatch(/virtually indexed.*physically tagged/i);
    expect(item!.answer).toMatch(/64 sets.*32 KiB.*48 KiB.*64 KiB/i);
    expect(item!.answer).toMatch(/per physical core.*SMT/i);
    expect(item!.answer).toMatch(/not.*mandatory/i);
  });
});

describe("generated questions", () => {
  it("replays every registered generator exactly and grades its expected answer correct", () => {
    fc.assert(fc.property(
      fc.constantFrom(...generatedDefinitions),
      fc.integer({ min: 0, max: 0x7fffffff }),
      (definition, seed) => {
        const first = generateQuestion(definition.id, seed);
        expect(generateQuestion(definition.id, seed)).toEqual(first);
        expect(gradeAnswer(first.grader, first.expectedAnswer, first.expectedAnswer)).toBe(true);
      },
    ));
  });

  it("never crashes on bounded arbitrary grader input", () => {
    fc.assert(fc.property(
      fc.constantFrom("integer", "decimal"),
      fc.string({ maxLength: 200 }),
      fc.string({ maxLength: 80 }),
      (grader, response, expected) => {
        expect(() => gradeAnswer(grader, response, expected)).not.toThrow();
      },
    ));
  });
});
