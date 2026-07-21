import { describe, expect, it } from "vitest";
import { commandExerciseId, commandExercises } from "../src/content.js";
import { chooseStableId } from "../src/scheduler.js";

describe("transparent interval scheduler", () => {
  it("resurfaces an overdue item before the mixed base queue", () => {
    expect(chooseStableId(3, [{ stableId: "bash-single-quotes", interval: 0, reviews: 2, successfulReviews: 1, dueAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }], new Date("2026-01-02T00:00:00.000Z")))
      .toBe("bash-single-quotes");
  });

  it("uses a mixed generated/static queue when nothing is due", () => {
    const ids = Array.from({ length: 20 }, (_, position) => chooseStableId(position, [], new Date()));
    expect(ids).toContain("binary-prefix-exponent");
    expect(ids).toContain("binary-amount-exponent");
    expect(ids).toContain("binary-exponent-prefix");
    expect(ids).toContain("binary-prefix-ladder");
    expect(ids).not.toContain("binary-units");
    expect(ids).not.toContain("decimal-units");
  });

  it("surfaces every Bash redirection card through the normal mixed queue", () => {
    const ids = new Set(Array.from({ length: 500 }, (_, position) => chooseStableId(position, [], new Date())));
    for (const id of [
      "bash-fd-standard-streams",
      "bash-file-redirection-defaults",
      "bash-output-append-v-truncate",
      "bash-redirection-order",
      "bash-redirection-order-reversed",
      "bash-heredoc-basic",
      "bash-heredoc-expansion",
      "bash-heredoc-tab-strip",
      "bash-here-string",
      "bash-stdin-input-forms",
    ]) expect(ids).toContain(id);
  });

  it("keeps expansion ordering and every applied fixture reachable and resurfaces a missed order", () => {
    const expansionIds = [
      "bash-effective-shell-expansion-order",
      "bash-expansion-quoted-argv",
      "bash-expansion-brace-before-parameter",
      "bash-expansion-tilde-contexts",
      "bash-expansion-command-substitution-newlines",
      "bash-expansion-splitting-before-pathname",
      "bash-expansion-matched-unmatched-patterns",
    ];
    const mixedIds = new Set(Array.from({ length: 1_000 }, (_, position) =>
      chooseStableId(position, [], new Date("2026-01-02T00:00:00.000Z"))));
    for (const id of expansionIds) expect(mixedIds).toContain(id);

    expect(chooseStableId(0, [{
      stableId: "bash-effective-shell-expansion-order",
      interval: 0,
      reviews: 1,
      successfulReviews: 0,
      dueAt: "2026-01-02T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    }], new Date("2026-01-02T00:00:00.000Z"))).toBe("bash-effective-shell-expansion-order");
  });

  it("unlocks command variants in definition, read, write order", () => {
    const readId = commandExerciseId("fd", "type", "read");
    const writeId = commandExerciseId("fd", "type", "write");
    const lockedDue = {
      stableId: writeId,
      interval: 0,
      reviews: 1,
      successfulReviews: 0,
      dueAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const beforeDefinition = Array.from({ length: 200 }, (_, position) =>
      chooseStableId(position, [lockedDue], new Date("2026-01-02T00:00:00.000Z")));
    expect(beforeDefinition).not.toContain(readId);
    expect(beforeDefinition).not.toContain(writeId);

    const definition = {
      stableId: commandExerciseId("fd", "type", "definition"),
      interval: 2,
      reviews: 3,
      successfulReviews: 1,
      dueAt: "2099-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const afterDefinition = Array.from({ length: 200 }, (_, position) =>
      chooseStableId(position, [definition], new Date("2026-01-02T00:00:00.000Z")));
    expect(afterDefinition).toContain(readId);
    expect(afterDefinition).not.toContain(writeId);

    const read = {
      stableId: readId,
      interval: 2,
      reviews: 1,
      successfulReviews: 1,
      dueAt: "2099-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const afterRead = Array.from({ length: 200 }, (_, position) =>
      chooseStableId(position, [definition, read], new Date("2026-01-02T00:00:00.000Z")));
    expect(afterRead).toContain(writeId);
  });

  it("keeps every command exercise reachable through deterministic first exposure", () => {
    const states: Array<{ stableId: string; interval: number; reviews: number; successfulReviews: number; dueAt: string; updatedAt: string }> = [];
    const seen = new Set<string>();
    for (let position = 0; position < 500; position += 1) {
      const id = chooseStableId(position, states, new Date("2026-01-02T00:00:00.000Z"));
      seen.add(id);
      const exercise = commandExercises.find((item) => item.id === id);
      if (exercise && !states.some((state) => state.stableId === id)) {
        states.push({ stableId: id, interval: 2, reviews: 1, successfulReviews: 1, dueAt: "2099-01-01T00:00:00.000Z", updatedAt: "2026-01-02T00:00:00.000Z" });
      }
    }
    expect(commandExercises.every((item) => seen.has(item.id))).toBe(true);
  });

  it("reaches every less exercise through its definition, read, write progression", () => {
    const states: Array<{ stableId: string; interval: number; reviews: number; successfulReviews: number; dueAt: string; updatedAt: string }> = [];
    const seen = new Set<string>();
    const lessIds = new Set(commandExercises
      .filter((item) => item.command?.command === "less")
      .map((item) => item.id));

    for (let position = 0; position < 1_000 && seen.size < lessIds.size; position += 1) {
      const id = chooseStableId(position, states, new Date("2026-01-02T00:00:00.000Z"));
      if (!lessIds.has(id)) continue;
      seen.add(id);
      states.push({ stableId: id, interval: 2, reviews: 1, successfulReviews: 1,
        dueAt: "2099-01-01T00:00:00.000Z", updatedAt: "2026-01-02T00:00:00.000Z" });
    }

    expect(seen).toEqual(lessIds);
  });

  it.each(["binary-units", "decimal-units"])("does not resurface retired exact-byte drill %s when its old review is due", (stableId) => {
    const retired = {
      stableId,
      interval: 0,
      reviews: 2,
      successfulReviews: 1,
      dueAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    expect(chooseStableId(0, [retired], new Date("2026-01-02T00:00:00.000Z")))
      .toBe("mental-arithmetic");
  });
});
