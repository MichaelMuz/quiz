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
    expect(extraNine.prompt).toMatch(/one additional nine.*same accounting window/i);
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
    const question = generateQuestion("reliability-availability-to-downtime", 2);
    expect(generateQuestion(question.stableId, 2)).toEqual(question);
    expect(question.prompt).toMatch(/estimate first.*99\.99% availability.*common non-leap year.*minutes/i);
    expect(question.expectedAnswer).toBe("52.56");
    expect(question.feedback).toMatch(/\(1 − 0\.9999\) × 525,600 = 52\.56 minutes/i);
    expect(gradeAnswer(question.grader, "52.56", question.expectedAnswer)).toBe(true);
    expect(gradeAnswer(question.grader, "52.6", question.expectedAnswer)).toBe(false);
  });

  it("converts annual downtime back to availability and names the nines", () => {
    const question = generateQuestion("reliability-downtime-to-availability", 3);
    expect(generateQuestion(question.stableId, 3)).toEqual(question);
    expect(question.prompt).toMatch(/estimate first.*5\.256 minutes.*common non-leap year.*availability percentage/i);
    expect(question.expectedAnswer).toBe("99.999");
    expect(question.feedback).toMatch(/\(1 − 5\.256 ÷ 525,600\) × 100 = 99\.999%.*five nines/i);
    expect(gradeAnswer(question.grader, "99.999", question.expectedAnswer)).toBe(true);
    expect(gradeAnswer(question.grader, "99.99", question.expectedAnswer)).toBe(false);
  });

  it("registers every reliability generator and grader in the active queue", () => {
    for (const id of generatedIds) {
      const registered = definition(id);
      expect(activeGeneratedDefinitions).toContainEqual(registered);
      expect(() => generateQuestion(id, 0)).not.toThrow();
    }
  });
});
