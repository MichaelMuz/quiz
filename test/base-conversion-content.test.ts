import { describe, expect, it } from "vitest";
import {
  activeGeneratedDefinitions,
  contentBank,
  generateQuestion,
  generatedDefinitions,
  gradeAnswer,
} from "../src/content.js";

describe("exact base conversion", () => {
  it("converts a seeded binary value to decimal with strict decimal grading", () => {
    const definition = generatedDefinitions.find(({ id }) => id === "base-binary-to-decimal");
    expect(definition).toMatchObject({
      generator: "base-binary-to-decimal",
      grader: "base-decimal",
      active: true,
    });
    expect(activeGeneratedDefinitions).toContainEqual(definition);

    const question = generateQuestion(definition!.id, 1);
    expect(generateQuestion(definition!.id, 1)).toEqual(question);
    expect(question).toMatchObject({
      prompt: "Convert 111100 from base 2 to base 10.",
      expectedAnswer: "60",
      grader: "base-decimal",
    });
    expect(gradeAnswer(question.grader, "060", question.expectedAnswer)).toBe(true);
    expect(gradeAnswer(question.grader, "0x3c", question.expectedAnswer)).toBe(false);
  });

  it("converts decimal to an explicitly eight-bit binary answer", () => {
    const definition = generatedDefinitions.find(({ id }) => id === "base-decimal-to-binary");
    expect(definition).toMatchObject({
      generator: "base-decimal-to-binary",
      grader: "base-binary-8",
      active: true,
    });

    const question = generateQuestion(definition!.id, 1);
    expect(question).toMatchObject({
      prompt: "Convert 60 from base 10 to base 2. Give exactly 8 bits.",
      expectedAnswer: "00111100",
      grader: "base-binary-8",
    });
    expect(gradeAnswer(question.grader, "0b00111100", question.expectedAnswer)).toBe(true);
    expect(gradeAnswer(question.grader, "111100", question.expectedAnswer)).toBe(false);
    expect(gradeAnswer(question.grader, "00111102", question.expectedAnswer)).toBe(false);
  });

  it("converts decimal to hexadecimal and accepts ordinary hex notation", () => {
    const definition = generatedDefinitions.find(({ id }) => id === "base-decimal-to-hex");
    expect(definition).toMatchObject({ generator: "base-decimal-to-hex", grader: "base-hex", active: true });

    const question = generateQuestion(definition!.id, 1);
    expect(question).toMatchObject({
      prompt: "Convert 60 from base 10 to base 16.",
      expectedAnswer: "3c",
      grader: "base-hex",
    });
    expect(gradeAnswer(question.grader, "0x03C", question.expectedAnswer)).toBe(true);
    expect(gradeAnswer(question.grader, "3g", question.expectedAnswer)).toBe(false);
  });

  it("converts hexadecimal to decimal", () => {
    const definition = generatedDefinitions.find(({ id }) => id === "base-hex-to-decimal");
    expect(definition).toMatchObject({ generator: "base-hex-to-decimal", grader: "base-decimal", active: true });

    const question = generateQuestion(definition!.id, 1);
    expect(question).toMatchObject({
      prompt: "Convert 3c from base 16 to base 10.",
      expectedAnswer: "60",
      grader: "base-decimal",
    });
    expect(gradeAnswer(question.grader, "060", question.expectedAnswer)).toBe(true);
    expect(gradeAnswer(question.grader, "3c", question.expectedAnswer)).toBe(false);
  });

  it("uses the nibble bridge to convert binary to hexadecimal", () => {
    const definition = generatedDefinitions.find(({ id }) => id === "base-binary-to-hex");
    expect(definition).toMatchObject({ generator: "base-binary-to-hex", grader: "base-hex", active: true });

    const question = generateQuestion(definition!.id, 1);
    expect(question).toMatchObject({
      prompt: "Convert 111100 from base 2 to base 16.",
      expectedAnswer: "3c",
      grader: "base-hex",
    });
    expect(gradeAnswer(question.grader, "0X03C", question.expectedAnswer)).toBe(true);
    expect(gradeAnswer(question.grader, "3g", question.expectedAnswer)).toBe(false);
  });

  it("uses two explicit nibbles to convert hexadecimal to binary", () => {
    const definition = generatedDefinitions.find(({ id }) => id === "base-hex-to-binary");
    expect(definition).toMatchObject({ generator: "base-hex-to-binary", grader: "base-binary-8", active: true });

    const question = generateQuestion(definition!.id, 1);
    expect(question).toMatchObject({
      prompt: "Convert 3c from base 16 to base 2. Give exactly 8 bits.",
      expectedAnswer: "00111100",
      grader: "base-binary-8",
    });
    expect(gradeAnswer(question.grader, "0B00111100", question.expectedAnswer)).toBe(true);
    expect(gradeAnswer(question.grader, "0011110", question.expectedAnswer)).toBe(false);
  });

  it("mixes zero and a smaller curated set of 16-bit boundary values into practice", () => {
    const zeroHex = generateQuestion("base-decimal-to-hex", 1972);
    expect(zeroHex).toMatchObject({
      prompt: "Convert 0 from base 10 to base 16.",
      expectedAnswer: "0",
    });
    expect(gradeAnswer(zeroHex.grader, "0x000", zeroHex.expectedAnswer)).toBe(true);
    const zeroBinary = generateQuestion("base-hex-to-binary", 1972);
    expect(zeroBinary).toMatchObject({ expectedAnswer: "00000000" });
    expect(gradeAnswer(zeroBinary.grader, "0b00000000", zeroBinary.expectedAnswer)).toBe(true);
    expect(generateQuestion("base-binary-to-decimal", 5)).toMatchObject({
      prompt: "Convert 100000001 from base 2 to base 10.",
      expectedAnswer: "257",
    });
  });

  it("gives every conversion direction a stable active ID and deterministic seed", () => {
    const ids = [
      "base-binary-to-decimal",
      "base-decimal-to-binary",
      "base-decimal-to-hex",
      "base-hex-to-decimal",
      "base-binary-to-hex",
      "base-hex-to-binary",
    ];
    expect(activeGeneratedDefinitions.filter(({ id }) => id.startsWith("base-")).map(({ id }) => id)).toEqual(ids);
    for (const id of ids) expect(generateQuestion(id, 42)).toEqual(generateQuestion(id, 42));
  });

  it("keeps conversion methods as a small reveal cohort beside the drills", () => {
    const items = contentBank.filter(({ id }) => id.startsWith("base-method-"));
    expect(items.map(({ id }) => id)).toEqual([
      "base-method-place-value",
      "base-method-repeated-division",
      "base-method-nibble-grouping",
      "base-method-notation-and-width",
    ]);
    expect(items.every(({ kind, references }) => kind === "flashcard" && references?.length)).toBe(true);
    expect(items.every(({ references }) => references?.[0]?.url.endsWith("/4-3-converting-with-base-systems"))).toBe(true);
  });
});
