import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  commandConcepts,
  commandExerciseId,
  commandExercises,
} from "../src/content.js";
import { buildCommandProgress } from "../src/progress.js";
import { chooseStableId } from "../src/scheduler.js";

function run(command: string, args: string[], input: string): string {
  return execFileSync(command, args, { input, encoding: "utf8" });
}

describe("cut and elementary awk command literacy", () => {
  it("ships a compact cut progression with executable literal-delimiter fixtures", () => {
    const concepts = commandConcepts.filter(({ command }) => command === "cut");
    expect(concepts.map(({ concept }) => concept)).toEqual([
      "field-selection",
      "literal-space-fields",
    ]);

    const exercises = commandExercises.filter((item) => item.command?.command === "cut");
    expect(exercises).toHaveLength(6);
    expect(new Set(exercises.map(({ id }) => id)).size).toBe(6);
    for (const concept of concepts) {
      expect(exercises.filter((item) => item.command?.concept === concept.concept)
        .map((item) => item.command!.mode).sort()).toEqual(["definition", "read", "write"]);
      expect(concept.references.map(({ url }) => url)).toContain(
        "https://pubs.opengroup.org/onlinepubs/9799919799/utilities/cut.html",
      );
      for (const mode of [concept.read, concept.write]) {
        expect(mode.choices).toContain(mode.correctChoice);
      }
    }

    expect(concepts[0]!.definition.answer).toMatch(/-d.*one literal.*delimiter.*-f.*1-based fields/is);
    expect(concepts[0]!.read.correctChoice).toBe("root:0\nsvc:1000");
    expect(concepts[0]!.write.correctChoice).toBe("cut -d' ' -f1,2 names.txt");
    expect(concepts[1]!.definition.answer).toMatch(/every literal space.*delimiter.*empty field.*FS=" ".*runs of spaces or tabs/is);
    expect(concepts[1]!.read.correctChoice).toBe("alpha  beta");
    expect(concepts[1]!.write.correctChoice).toBe("cut -d' ' -f1-3 data.txt");

    expect(run("cut", ["-d:", "-f1,3"], "root:x:0:0\nsvc:x:1000:1000\n"))
      .toBe("root:0\nsvc:1000\n");
    expect(run("cut", ["-d", " ", "-f1-3"], "alpha  beta gamma\n"))
      .toBe("alpha  beta\n");
    expect(run("awk", ["{ print $1, $2, $3 }"], "alpha  beta gamma\n"))
      .toBe("alpha beta gamma\n");

    const progress = buildCommandProgress([{
      stableId: commandExerciseId("cut", "field-selection", "definition"),
      interval: 2,
      reviews: 1,
      successfulReviews: 1,
      dueAt: "2099-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    }]).find(({ command }) => command === "cut");
    expect(progress?.concepts.find(({ id }) => id === "field-selection")?.modes)
      .toEqual({ definition: "learning", read: "unseen", write: "unseen" });

    const states: Array<{
      stableId: string;
      interval: number;
      reviews: number;
      successfulReviews: number;
      dueAt: string;
      updatedAt: string;
    }> = [];
    const seen = new Set<string>();
    const cutIds = new Set(exercises.map(({ id }) => id));
    for (let position = 0; position < 1_000 && seen.size < cutIds.size; position += 1) {
      const id = chooseStableId(position, states, new Date("2026-01-02T00:00:00.000Z"));
      if (!cutIds.has(id)) continue;
      seen.add(id);
      states.push({
        stableId: id,
        interval: 2,
        reviews: 1,
        successfulReviews: 1,
        dueAt: "2099-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      });
    }
    expect(seen).toEqual(cutIds);
  });

  it("drills awk implicit full-record printing and simple -F fixtures", () => {
    const implicit = commandConcepts.find(({ command, concept }) =>
      command === "awk" && concept === "implicit-print");
    expect(implicit).toBeDefined();
    expect(implicit!.definition.answer).toMatch(/regex pattern.*comparison pattern.*missing action.*\{ print \}.*\$0/is);
    expect(implicit!.read.prompt).toContain("awk '/WARN/ { print }'");
    expect(implicit!.read.prompt).toContain("awk '/WARN/'");
    expect(implicit!.read.correctChoice).toBe("Both print:\nWARN disk\nWARN cpu");
    expect(implicit!.write.correctChoice).toBe("awk '$2 >= 500' metrics.txt");

    const fields = commandConcepts.find(({ command, concept }) =>
      command === "awk" && concept === "field-separator");
    expect(fields).toBeDefined();
    expect(fields!.definition.answer).toMatch(/-F.*input field separator.*before records/is);
    expect(fields!.read.prompt).toContain("awk -F, '$2 == \"ready\"'");
    expect(fields!.read.correctChoice).toBe("api,ready\nworker,ready");
    expect(fields!.write.correctChoice).toBe("awk -F: '{ print $1 }' accounts.txt");

    const explicit = commandConcepts.find(({ command, concept }) =>
      command === "awk" && concept === "pattern-action");
    expect(explicit!.read.prompt).toContain("awk '$2 >= 500 { print $1 }'");
    expect(explicit!.read.correctChoice).toBe("api\nworker");

    const implicitExercises = commandExercises.filter((item) =>
      item.command?.command === "awk" && item.command.concept === "implicit-print");
    expect(implicitExercises.map((item) => item.command!.mode).sort())
      .toEqual(["definition", "read", "write"]);
    expect(new Set(implicitExercises.map(({ id }) => id)).size).toBe(3);
    expect(implicit!.references.map(({ url }) => url)).toContain(
      "https://pubs.opengroup.org/onlinepubs/9799919799/utilities/awk.html",
    );

    const records = "INFO ready\nWARN disk\nWARN cpu\n";
    expect(run("awk", ["/WARN/ { print }"], records)).toBe("WARN disk\nWARN cpu\n");
    expect(run("awk", ["/WARN/"], records)).toBe("WARN disk\nWARN cpu\n");
    expect(run("awk", ["$2 >= 500"], "api 503\nweb 200\nworker 502\n"))
      .toBe("api 503\nworker 502\n");
    expect(run("awk", ["$2 >= 500 { print $1 }"], "api 503\nweb 200\nworker 502\n"))
      .toBe("api\nworker\n");
    expect(run("awk", ["-F,", "$2 == \"ready\""], "api,ready\nweb,hold\nworker,ready\n"))
      .toBe("api,ready\nworker,ready\n");
    expect(run("awk", ["-F:", "{ print $1 }"], "root:x:0:0\nsvc:x:1000:1000\n"))
      .toBe("root\nsvc\n");
  });
});
