import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createQuizServer } from "../src/app.js";
import { commandExerciseId, commandExercises, generateQuestion } from "../src/content.js";
import { QuizStore } from "../src/store.js";

describe("Quiz HTTP app", () => {
  let dir: string;
  let store: QuizStore;
  let server: ReturnType<typeof createQuizServer>;
  let base: string;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "quiz-http-"));
    store = new QuizStore(join(dir, "quiz.sqlite"));
    server = createQuizServer(store, { seed: () => 1234, now: () => new Date("2026-01-02T03:04:05.000Z") });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterEach(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("serves liveness, readiness, and redirects home into practice", async () => {
    expect(await (await fetch(`${base}/healthz`)).text()).toBe("ok");
    expect((await fetch(`${base}/readyz`)).status).toBe(200);
    const home = await fetch(`${base}/`, { redirect: "manual" });
    expect(home.status).toBe(303);
    expect(home.headers.get("location")).toBe("/practice");
  });

  it("renders a phone-first generated question and grades a submission", async () => {
    const page = await (await fetch(`${base}/practice`)).text();
    expect(page).toContain("Quiz");
    expect(page).toContain("inputmode=\"numeric\"");
    expect(page).toContain("Question 1 of 8");
    expect(page).toContain("@media(max-width:480px){.header-side{flex-direction:column;align-items:flex-end;gap:2px}.counter{display:block;font-size:.76rem}}");
    expect(page).toContain(".command-choice{white-space:pre-wrap;overflow-wrap:anywhere;min-width:0}");
    const id = page.match(/name="questionId" value="([^"]+)/)?.[1];
    const submission = page.match(/name="submissionId" value="([^"]+)/)?.[1];
    const seed = page.match(/name="seed" value="(\d+)/)?.[1];
    expect(id && submission && seed).toBeTruthy();
    const expected = generateQuestion(id!, Number(seed)).expectedAnswer;

    const request = () => fetch(`${base}/practice`, {
      method: "POST", redirect: "manual",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ questionId: id!, submissionId: submission!, response: expected! }),
    });
    const response = await request();
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("result=correct");
    expect(await (await fetch(`${base}${response.headers.get("location")}`)).text()).toContain(`Expected answer: ${expected}`);
    expect((await request()).status).toBe(303);
    expect(store.attemptCount()).toBe(1);
  });

  it("shows the expected answer after an incorrect generated submission while advancing", async () => {
    const page = await (await fetch(`${base}/practice`)).text();
    const id = page.match(/name="questionId" value="([^"]+)/)?.[1];
    const submission = page.match(/name="submissionId" value="([^"]+)/)?.[1];
    const seed = page.match(/name="seed" value="(\d+)/)?.[1];
    expect(id && submission && seed).toBeTruthy();
    const expected = generateQuestion(id!, Number(seed)).expectedAnswer;

    const response = await fetch(`${base}/practice`, {
      method: "POST", redirect: "manual",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ questionId: id!, submissionId: submission!, response: `${expected}0` }),
    });
    expect(response.status).toBe(303);

    const reviewPage = await (await fetch(`${base}${response.headers.get("location")}`)).text();
    expect(reviewPage).toContain("Not quite.");
    expect(reviewPage).toContain(`Expected answer: ${expected}`);
    expect(reviewPage).toContain("Question 2 of 8");
  });

  it("uses a text keyboard for inverse IEC prefix recall", async () => {
    for (let index = 0; index < 6; index += 1) {
      store.recordAttempt({
        submissionId: `fixture-${index}`,
        stableId: "mental-arithmetic",
        seed: index,
        prompt: "fixture",
        expectedAnswer: "1",
        response: "1",
        correct: true,
        rating: null,
        reviewedAt: `2026-01-01T00:00:0${index}.000Z`,
      });
    }

    const page = await (await fetch(`${base}/practice`)).text();
    expect(page).toContain("Which IEC unit equals 2^");
    expect(page).toContain("Quick recall");
    expect(page).toContain("inputmode=\"text\"");
    expect(page).toContain("name=\"questionId\" value=\"binary-exponent-prefix\"");
  });

  it("accepts an in-flight submission for a retired exact-byte drill", async () => {
    const question = generateQuestion("binary-units", 42);
    store.getOrCreatePending(question.stableId, () => question);

    const response = await fetch(`${base}/practice`, {
      method: "POST",
      redirect: "manual",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        questionId: question.stableId,
        submissionId: `generated-${question.stableId}-${question.seed}`,
        response: question.expectedAnswer,
      }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("result=correct");
    expect(store.attemptCount()).toBe(1);
  });

  it("replays a stored redirection submission after its stable card copy changes", async () => {
    const submissionId = "stored-redirection-before-copy-fix";
    const oldExpectedAnswer = "out.txt's old contents are replaced; log.txt's old contents are kept and new output is added";
    store.recordAttempt({
      submissionId,
      stableId: "bash-output-append-v-truncate",
      seed: null,
      prompt: "first >out.txt\nsecond >>log.txt",
      expectedAnswer: oldExpectedAnswer,
      response: oldExpectedAnswer,
      correct: true,
      rating: "good",
      reviewedAt: "2026-01-01T00:00:00.000Z",
    });

    const response = await fetch(`${base}/practice`, {
      method: "POST",
      redirect: "manual",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        questionId: "bash-output-append-v-truncate",
        submissionId,
        response: oldExpectedAnswer,
      }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("result=correct");
    expect(await (await fetch(`${base}${response.headers.get("location")}`)).text())
      .toContain("Expected answer: out.txt&#39;s old contents are replaced; log.txt&#39;s old contents are kept and new output is added");
    expect(store.attemptCount()).toBe(1);
  });

  it("renders command definitions with labeled memory hooks and safe Manual and TLDR links", async () => {
    const definitionId = commandExerciseId("xargs", "max-lines", "definition");
    store.recordAttempt({
      submissionId: "due-definition",
      stableId: definitionId,
      seed: null,
      prompt: "fixture",
      expectedAnswer: "fixture",
      response: null,
      correct: null,
      rating: "again",
      reviewedAt: "2026-01-01T00:00:00.000Z",
    });

    const page = await (await fetch(`${base}/practice`)).text();
    expect(page).toContain("Memory hook: L = Lines per command invocation");
    expect(page).toContain("xargs · Definition");
    expect(page).toContain("POSIX short form; GNU and BSD/macOS");
    expect(page).toContain('href="https://man7.org/linux/man-pages/man1/xargs.1.html" target="_blank" rel="noreferrer">Manual</a>');
    expect(page).toContain('href="https://tldr.inbrowser.app/pages/common/xargs" target="_blank" rel="noreferrer">TLDR</a>');
  });

  it("grades command reading choices directly and updates that mode independently", async () => {
    const definitionId = commandExerciseId("fd", "type", "definition");
    const readId = commandExerciseId("fd", "type", "read");
    store.recordAttempt({
      submissionId: "known-definition",
      stableId: definitionId,
      seed: null,
      prompt: "fixture",
      expectedAnswer: "fixture",
      response: null,
      correct: null,
      rating: "good",
      reviewedAt: "2026-01-01T00:00:00.000Z",
    });
    store.recordAttempt({
      submissionId: "due-reading",
      stableId: readId,
      seed: null,
      prompt: "fixture",
      expectedAnswer: "fixture",
      response: "wrong",
      correct: false,
      rating: "again",
      reviewedAt: "2026-01-01T00:00:01.000Z",
    });

    const page = await (await fetch(`${base}/practice`)).text();
    const submissionId = page.match(/name="submissionId" value="([^"]+)/)?.[1];
    const item = commandExercises.find(({ id }) => id === readId)!;
    expect(page).toContain("fd · Read");
    expect(page).toContain('name="response"');
    expect(submissionId).toBeTruthy();

    const result = await fetch(`${base}/practice`, {
      method: "POST",
      redirect: "manual",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ questionId: readId, submissionId: submissionId!, response: item.correctChoice! }),
    });
    expect(result.status).toBe(303);
    expect(result.headers.get("location")).toContain("result=correct");
    expect(store.reviewState(readId)).toMatchObject({ reviews: 2 });
    expect(store.reviewState(definitionId)).toMatchObject({ reviews: 1 });
  });

  it("shows compact grouped command progress without exposing stored answers", async () => {
    const definitionId = commandExerciseId("sed", "substitution", "definition");
    const readId = commandExerciseId("sed", "substitution", "read");
    store.recordAttempt({
      submissionId: "progress-definition",
      stableId: definitionId,
      seed: null,
      prompt: "SECRET RAW PROMPT",
      expectedAnswer: "SECRET RAW ANSWER",
      response: null,
      correct: null,
      rating: "good",
      reviewedAt: "2025-12-20T00:00:00.000Z",
    });
    store.recordAttempt({
      submissionId: "progress-read-1",
      stableId: readId,
      seed: null,
      prompt: "fixture",
      expectedAnswer: "fixture",
      response: "SECRET RAW RESPONSE",
      correct: true,
      rating: "good",
      reviewedAt: "2025-12-20T00:00:01.000Z",
    });
    store.recordAttempt({
      submissionId: "progress-read-2",
      stableId: readId,
      seed: null,
      prompt: "fixture",
      expectedAnswer: "fixture",
      response: "fixture",
      correct: true,
      rating: "easy",
      reviewedAt: "2025-12-22T00:00:00.000Z",
    });

    const response = await fetch(`${base}/progress`);
    const page = await response.text();
    expect(response.status).toBe(200);
    expect(page).toContain("Command mastery");
    expect(page).toContain("s/regexp/replacement/");
    expect(page).toContain("Definition");
    expect(page).toContain("Learning");
    expect(page).toContain("Established");
    expect(page).toContain("Unseen");
    expect(page).not.toContain("SECRET RAW PROMPT");
    expect(page).not.toContain("SECRET RAW ANSWER");
    expect(page).not.toContain("SECRET RAW RESPONSE");
  });

  it("rejects invalid question IDs", async () => {
    const response = await fetch(`${base}/practice`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ questionId: "not-real", submissionId: "x", response: "1" }),
    });
    expect(response.status).toBe(400);
  });
});
