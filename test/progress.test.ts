import { describe, expect, it } from "vitest";
import { commandExerciseId } from "../src/content.js";
import { buildCommandProgress } from "../src/progress.js";

describe("command mastery progress", () => {
  it("groups every concept and mode as unseen without review state", () => {
    const progress = buildCommandProgress([]);
    expect(progress.map(({ command }) => command)).toEqual([
      "fd",
      "sed",
      "xargs",
      "fzf",
      "grep",
      "rg",
      "jq",
      "awk",
      "printf",
      "kubectl",
    ]);
    expect(progress.map(({ concepts }) => concepts.length)).toEqual([3, 3, 3, 3, 5, 5, 6, 4, 3, 14]);
    for (const command of progress) {
      for (const concept of command.concepts) {
        expect(concept.modes).toEqual({ definition: "unseen", read: "unseen", write: "unseen" });
      }
    }
  });

  it("tracks command, concept, and mode independently without fake one-attempt mastery", () => {
    const progress = buildCommandProgress([
      {
        stableId: commandExerciseId("fd", "type", "definition"),
        interval: 4,
        reviews: 1,
        successfulReviews: 1,
        dueAt: "2026-01-06T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
      {
        stableId: commandExerciseId("fd", "type", "read"),
        interval: 4,
        reviews: 2,
        successfulReviews: 2,
        dueAt: "2026-01-06T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    ]);
    const type = progress.find(({ command }) => command === "fd")!.concepts
      .find(({ id }) => id === "type")!;
    expect(type.modes).toEqual({ definition: "learning", read: "established", write: "unseen" });
    expect(JSON.stringify(progress)).not.toMatch(/prompt|answer|response|percentage/i);
  });

  it("does not call one success after a lapse established mastery", () => {
    const definitionId = commandExerciseId("xargs", "null-input", "definition");
    const xargs = buildCommandProgress([
      {
        stableId: definitionId,
        interval: 4,
        reviews: 2,
        successfulReviews: 1,
        dueAt: "2026-01-06T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    ]).find(({ command }) => command === "xargs")!;

    expect(xargs.concepts.find(({ id }) => id === "null-input")!.modes.definition).toBe("learning");
  });
});
