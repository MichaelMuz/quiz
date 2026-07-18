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

  it("explains the IEC exponent ladder and distinguishes it from decimal SI", () => {
    const item = contentBank.find((candidate) => candidate.id === "binary-prefix-ladder");
    expect(item).toBeDefined();
    expect(item!.prompt).toMatch(/IEC.*step.*exponent/i);
    expect(item!.answer).toMatch(/1024 = 2\^10/i);
    expect(item!.answer).toMatch(/KiB.*2\^10.*MiB.*2\^20.*GiB.*2\^30.*TiB.*2\^40.*PiB.*2\^50.*EiB.*2\^60/i);
    expect(item!.answer).toMatch(/GB = 10\^9.*GiB = 2\^30/i);
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

  it.each([
    [1972, "KiB", "10"],
    [0, "MiB", "20"],
    [251, "GiB", "30"],
    [682, "TiB", "40"],
    [1112, "PiB", "50"],
    [1542, "EiB", "60"],
  ])("maps a binary IEC prefix to its exponent for seed %i", (seed, prefix, exponent) => {
    const question = generateQuestion("binary-prefix-exponent", seed);
    expect(question.prompt).toBe(`1 ${prefix} is 2^? bytes.`);
    expect(question.expectedAnswer).toBe(exponent);
    expect(gradeAnswer(question.grader, exponent, question.expectedAnswer)).toBe(true);
  });

  it("applies exponent arithmetic to a power-of-two GiB amount", () => {
    const question = generateQuestion("binary-amount-exponent", 255);
    expect(question.prompt).toBe("Express 4 GiB as 2^? bytes.");
    expect(question.expectedAnswer).toBe("32");
    expect(gradeAnswer(question.grader, "32", question.expectedAnswer)).toBe(true);
    expect(gradeAnswer(question.grader, "34", question.expectedAnswer)).toBe(false);
  });
});
