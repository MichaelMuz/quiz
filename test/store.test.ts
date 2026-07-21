import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { QuizStore } from "../src/store.js";

const dirs: string[] = [];
function databasePath() {
  const dir = mkdtempSync(join(tmpdir(), "quiz-test-"));
  dirs.push(dir);
  return join(dir, "quiz.sqlite");
}
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });

describe("QuizStore", () => {
  it("makes duplicate attempt submission idempotent", () => {
    const store = new QuizStore(databasePath());
    const attempt = {
      submissionId: "submission-1", stableId: "mental-arithmetic", seed: 42,
      prompt: "4 × 5 = ?", expectedAnswer: "20", response: "20",
      correct: true, rating: null, reviewedAt: "2026-01-02T03:04:05.000Z",
    } as const;
    expect(store.recordAttempt(attempt)).toEqual(store.recordAttempt({ ...attempt, response: "wrong" }));
    expect(store.attemptCount()).toBe(1);
    store.close();
  });

  it("persists review state across database reopen", () => {
    const path = databasePath();
    const first = new QuizStore(path);
    first.recordAttempt({
      submissionId: "submission-2", stableId: "systems-latency-orders", seed: null,
      prompt: "prompt", expectedAnswer: "answer", response: null, correct: null,
      rating: "easy", reviewedAt: "2026-01-02T03:04:05.000Z",
    });
    first.close();

    const reopened = new QuizStore(path);
    expect(reopened.reviewState("systems-latency-orders")).toMatchObject({ interval: 4, reviews: 1, successfulReviews: 1 });
    reopened.close();
  });

  it("migrates an existing pending table before storing ordering presentation", () => {
    const path = databasePath();
    const legacy = new Database(path);
    legacy.exec(`CREATE TABLE pending_generated (
      stable_id TEXT PRIMARY KEY,
      seed INTEGER NOT NULL,
      prompt TEXT NOT NULL,
      expected_answer TEXT NOT NULL,
      grader TEXT NOT NULL
    )`);
    legacy.close();

    const store = new QuizStore(path);
    const pending = store.getOrCreatePending("ordering", () => ({
      stableId: "ordering",
      seed: 5,
      prompt: "Order these",
      expectedAnswer: "[\"first\",\"second\"]",
      grader: "exact-order",
      presentation: "[\"second\",\"first\"]",
    }));

    expect(pending.presentation).toBe("[\"second\",\"first\"]");
    store.close();
  });

  it("keeps one generated pending instance stable across reload and reopen", () => {
    const path = databasePath();
    const first = new QuizStore(path);
    const pending = first.getOrCreatePending("mental-arithmetic", () => ({
      stableId: "mental-arithmetic", seed: 77, prompt: "8 × 8 = ?", expectedAnswer: "64", grader: "integer",
      presentation: "[\"stable\",\"order\"]",
    }));
    expect(first.getOrCreatePending("mental-arithmetic", () => { throw new Error("must not regenerate"); })).toEqual(pending);
    first.close();

    const reopened = new QuizStore(path);
    expect(reopened.getOrCreatePending("mental-arithmetic", () => { throw new Error("must not regenerate"); })).toEqual(pending);
    reopened.clearPending("mental-arithmetic");
    expect(reopened.getPending("mental-arithmetic")).toBeNull();
    reopened.close();
  });
});
