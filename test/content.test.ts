import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  commandConcepts,
  commandExercises,
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

describe("command literacy corpus", () => {
  it("ships the mandatory concepts with definition, read, and write mastery IDs", () => {
    expect(commandConcepts.map(({ command, concept }) => `${command}:${concept}`)).toEqual(expect.arrayContaining([
      "fd:type",
      "fd:max-depth",
      "xargs:replace",
      "xargs:max-lines",
    ]));

    for (const concept of commandConcepts) {
      const exercises = commandExercises.filter((item) =>
        item.command?.command === concept.command && item.command.concept === concept.concept);
      expect(exercises.map((item) => item.command!.mode).sort()).toEqual(["definition", "read", "write"]);
      expect(new Set(exercises.map((item) => item.id)).size).toBe(3);
    }
  });

  it.each([
    ["fd", "type", /Memory hook: t = type/i],
    ["fd", "max-depth", /Memory hook: d = depth/i],
    ["xargs", "replace", /Memory hook: I = insert the input at this placeholder/i],
    ["xargs", "max-lines", /Memory hook: L = lines per command invocation/i],
  ])("gives %s %s a labeled memory hook and both learner references", (command, concept, hook) => {
    const definition = commandExercises.find((item) =>
      item.command?.command === command && item.command.concept === concept && item.command.mode === "definition");
    expect(definition?.answer).toMatch(hook);
    expect(definition?.references?.map(({ label }) => label)).toEqual(["Manual", "TLDR"]);
    expect(definition?.references?.every(({ url }) => url.startsWith("https://"))).toBe(true);
  });

  it("teaches portable xargs short forms without inventing GNU long forms on macOS", () => {
    const replace = commandConcepts.find((concept) => concept.command === "xargs" && concept.concept === "replace");
    const lines = commandConcepts.find((concept) => concept.command === "xargs" && concept.concept === "max-lines");
    expect(replace?.label).toBe("-I replace-str");
    expect(replace?.definition.answer).toMatch(/GNU.*--replace.*not.*portable.*macOS/i);
    expect(lines?.label).toBe("-L max-lines");
    expect(lines?.definition.answer).toMatch(/GNU.*--max-lines.*not.*portable.*macOS/i);
  });

  it("encodes representative deterministic fd, sed, and xargs results", () => {
    const correctChoice = (command: string, concept: string, mode: "read" | "write") =>
      commandExercises.find((item) => item.command?.command === command
        && item.command.concept === concept && item.command.mode === mode)?.correctChoice;

    expect(correctChoice("fd", "type", "read")).toBe("notes.md and src/app.ts");
    expect(correctChoice("sed", "global-substitution", "read")).toBe("blue blue green");
    expect(correctChoice("xargs", "max-lines", "read")).toBe("Two invocations: echo run a b c d, then echo run e");
    expect(correctChoice("xargs", "null-input", "write")).toBe("find . -type f -print0 | xargs -0 sha256sum");
  });

  it("rejects unsafe references and choice answers outside their choices", () => {
    const base = contentBank[0]!;
    expect(() => validateContent([{ ...base, id: "unsafe", references: [{ label: "Bad", url: "javascript:alert(1)" }] }], []))
      .toThrow(/reference url/i);
    expect(() => validateContent([{ ...base, id: "choice", choices: ["a"], correctChoice: "b" }], []))
      .toThrow(/correct choice/i);
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

  it.each([
    [1972, "10", "KiB"],
    [0, "20", "MiB"],
    [251, "30", "GiB"],
    [682, "40", "TiB"],
    [1112, "50", "PiB"],
    [1542, "60", "EiB"],
  ])("maps a binary exponent to its IEC prefix for seed %i", (seed, exponent, prefix) => {
    const question = generateQuestion("binary-exponent-prefix", seed);
    expect(question.prompt).toBe(`Which IEC unit equals 2^${exponent} bytes?`);
    expect(question.expectedAnswer).toBe(prefix);
    expect(gradeAnswer(question.grader, prefix.toLowerCase(), question.expectedAnswer)).toBe(true);
    expect(gradeAnswer(question.grader, prefix.replace("i", ""), question.expectedAnswer)).toBe(true);
    expect(gradeAnswer(question.grader, prefix === "KiB" ? "mb" : "kb", question.expectedAnswer)).toBe(false);
  });
});
