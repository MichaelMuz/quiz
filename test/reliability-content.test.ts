import { describe, expect, it } from "vitest";
import {
  activeGeneratedDefinitions,
  contentBank,
  generateQuestion,
  generatedDefinitions,
  gradeAnswer,
} from "../src/content.js";
import { chooseStableId } from "../src/scheduler.js";

const generatedIds = [
  "reliability-year-hours",
  "reliability-year-minutes",
  "reliability-year-seconds",
  "reliability-availability-to-downtime",
  "reliability-downtime-to-availability",
];

function definition(id: string) {
  const found = generatedDefinitions.find((candidate) => candidate.id === id);
  expect(found, `missing ${id}`).toBeDefined();
  return found!;
}

describe("reliability nines and yearly downtime", () => {
  it("ships six recurring exercises grounded in one explicit accounting window", () => {
    expect(generatedIds.map((id) => definition(id))).toEqual(
      expect.arrayContaining(generatedIds.map((id) => expect.objectContaining({ id, active: true }))),
    );
    expect(contentBank.filter(({ id }) => id.startsWith("reliability-")).map(({ id }) => id))
      .toEqual(["reliability-extra-nine"]);

    const extraNine = contentBank.find(({ id }) => id === "reliability-extra-nine")!;
    expect(extraNine.prompt).toMatch(/one additional nine.*common non-leap year.*365 days/i);
    expect(extraNine.answer).toMatch(/unavailability.*factor of 10.*downtime budget.*factor of 10/i);
    expect(extraNine.references?.length).toBeGreaterThan(0);
    expect(extraNine.references?.every(({ label }) => label.includes("accessed 2026-08-27"))).toBe(true);

    const scheduled = new Set(Array.from({ length: 2_000 }, (_, position) =>
      chooseStableId(position, [], new Date("2026-08-27T00:00:00.000Z"))));
    for (const id of [...generatedIds, extraNine.id]) expect(scheduled).toContain(id);
  });

  it.each([
    ["reliability-year-hours", "8760", "8,760 hours"],
    ["reliability-year-minutes", "525600", "525,600 minutes"],
    ["reliability-year-seconds", "31536000", "31,536,000 seconds"],
  ])("replays the %s common-year anchor and accepts grouped digits", (id, expected, explanation) => {
    const first = generateQuestion(id, 17);
    expect(generateQuestion(id, 17)).toEqual(first);
    expect(first.prompt).toMatch(/common non-leap year.*365 days/i);
    expect(first.expectedAnswer).toBe(expected);
    expect(first.feedback).toContain(explanation);
    expect(gradeAnswer(first.grader, Number(expected).toLocaleString("en-US"), expected)).toBe(true);
  });

  it("converts availability to an annual downtime budget after an estimate", () => {
    const cases = [
      [0, "90", "36.5", "days"],
      [1, "99", "87.6", "hours"],
      [2, "99.9", "8.76", "hours"],
      [3, "99.99", "52.56", "minutes"],
      [4, "99.999", "5.256", "minutes"],
      [5, "99.9999", "31.536", "seconds"],
    ] as const;

    for (const [seed, availability, expected, unit] of cases) {
      const question = generateQuestion("reliability-availability-to-downtime", seed);
      expect(generateQuestion(question.stableId, seed)).toEqual(question);
      expect(question.prompt).toMatch(new RegExp(`estimate first.*${availability.replace(".", "\\.")}% availability.*common non-leap year.*${unit}.*±0\\.5%`, "i"));
      expect(question.expectedAnswer).toBe(expected);
      expect(question.feedback).toMatch(new RegExp(`${expected.replace(".", "\\.")} ${unit}.*time-based downtime budget.*one-year accounting window`, "i"));
    }
  });

  it("accepts sensible rounding at inclusive boundaries and rejects malformed grouping", () => {
    for (const seed of [0, 1, 2, 3, 4, 5]) {
      const question = generateQuestion("reliability-availability-to-downtime", seed);
      const target = Number(question.expectedAnswer);
      const tolerance = target * 0.005;
      const outside = Math.max(tolerance * 0.001, 0.000_001);

      expect(gradeAnswer(question.grader, String(target - tolerance), question.expectedAnswer), `${target} lower boundary`).toBe(true);
      expect(gradeAnswer(question.grader, String(target + tolerance), question.expectedAnswer), `${target} upper boundary`).toBe(true);
      expect(gradeAnswer(question.grader, String(target - tolerance - outside), question.expectedAnswer)).toBe(false);
      expect(gradeAnswer(question.grader, String(target + tolerance + outside), question.expectedAnswer)).toBe(false);
    }

    const fourNines = generateQuestion("reliability-availability-to-downtime", 3);
    expect(gradeAnswer(fourNines.grader, "52.6", fourNines.expectedAnswer)).toBe(true);
    expect(gradeAnswer(fourNines.grader, "5,2.56", fourNines.expectedAnswer)).toBe(false);
  });

  it("converts each natural-unit downtime anchor back to its approximate number of nines", () => {
    const cases = [
      [0, "36.5 days", "1", "90", "one nine"],
      [1, "87.6 hours", "2", "99", "two nines"],
      [2, "8.76 hours", "3", "99.9", "three nines"],
      [3, "52.56 minutes", "4", "99.99", "four nines"],
      [4, "5.256 minutes", "5", "99.999", "five nines"],
      [5, "31.536 seconds", "6", "99.9999", "six nines"],
    ] as const;

    for (const [seed, downtime, nines, availability, name] of cases) {
      const question = generateQuestion("reliability-downtime-to-availability", seed);
      expect(generateQuestion(question.stableId, seed)).toEqual(question);
      expect(question.prompt).toMatch(new RegExp(`estimate first.*${downtime.replace(".", "\\.")}.*common non-leap year.*365 days.*how many consecutive nines`, "i"));
      expect(question.expectedAnswer).toBe(nines);
      expect(question.feedback).toMatch(new RegExp(`${availability.replace(".", "\\.")}%.*${name}.*accounting window`, "i"));
      expect(gradeAnswer(question.grader, nines, question.expectedAnswer)).toBe(true);
      expect(gradeAnswer(question.grader, String(Number(nines) + 1), question.expectedAnswer)).toBe(false);
    }
  });

  it("registers every reliability generator and grader in the active queue", () => {
    for (const id of generatedIds) {
      const registered = definition(id);
      expect(activeGeneratedDefinitions).toContainEqual(registered);
      expect(() => generateQuestion(id, 0)).not.toThrow();
    }
  });
});
