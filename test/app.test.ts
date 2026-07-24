import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createQuizServer } from "../src/app.js";
import { commandExerciseId, commandExercises, contentBank, generateQuestion, type OrderingItem } from "../src/content.js";
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

  it("renders a persistent non-drag ordering control and grades its exact submitted order", async () => {
    store.recordAttempt({
      submissionId: "due-ordering",
      stableId: "bash-effective-shell-expansion-order",
      seed: 99,
      prompt: "old prompt",
      expectedAnswer: "old answer",
      response: "[]",
      correct: false,
      rating: "again",
      reviewedAt: "2026-01-01T00:00:00.000Z",
    });

    const firstPage = await (await fetch(`${base}/practice`)).text();
    const secondPage = await (await fetch(`${base}/practice`)).text();
    const responseValues = (page: string) => [...page.matchAll(/name="response" value="([^"]+)"/g)]
      .map((match) => match[1]);

    expect(responseValues(firstPage)).toEqual([
      "arithmetic expansion",
      "brace expansion",
      "parameter expansion",
      "pathname expansion",
      "command substitution",
      "tilde expansion",
      "word splitting",
    ]);
    expect(responseValues(secondPage)).toEqual(responseValues(firstPage));
    expect(firstPage).toContain("from first to last");
    expect(firstPage).toContain('class="ordering-list"');
    expect(firstPage).toContain('type="button" class="order-move" data-direction="up"');
    expect(firstPage).toContain('type="button" class="order-move" data-direction="down"');
    expect(firstPage).toContain('aria-label="Move arithmetic expansion up"');
    expect(firstPage).toContain(".order-label{flex:1;min-width:0;font-weight:800;overflow-wrap:anywhere}");
    expect(firstPage).not.toContain("draggable=");

    const submission = firstPage.match(/name="submissionId" value="([^"]+)/)?.[1];
    expect(submission).toBeTruthy();
    const form = new URLSearchParams({
      questionId: "bash-effective-shell-expansion-order",
      submissionId: submission!,
    });
    for (const value of [
      "brace expansion",
      "tilde expansion",
      "parameter expansion",
      "command substitution",
      "arithmetic expansion",
      "word splitting",
      "pathname expansion",
    ]) form.append("response", value);

    const result = await fetch(`${base}/practice`, {
      method: "POST",
      redirect: "manual",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form,
    });
    expect(result.status).toBe(303);
    expect(result.headers.get("location")).toContain("result=correct");
    expect(store.attemptBySubmission(submission!)).toMatchObject({
      stableId: "bash-effective-shell-expansion-order",
      seed: 1234,
      correct: true,
      rating: "good",
      response: JSON.stringify([
        "brace expansion",
        "tilde expansion",
        "parameter expansion",
        "command substitution",
        "arithmetic expansion",
        "word splitting",
        "pathname expansion",
      ]),
    });
  });

  it.each(["correct", "incorrect"] as const)("shows the stored formal-model explanation after a %s ordering submission", async (outcome) => {
    store.recordAttempt({
      submissionId: `due-ordering-${outcome}`,
      stableId: "bash-effective-shell-expansion-order",
      seed: 99,
      prompt: "old prompt",
      expectedAnswer: "old answer",
      response: "[]",
      correct: false,
      rating: "again",
      reviewedAt: "2026-01-01T00:00:00.000Z",
    });

    const page = await (await fetch(`${base}/practice`)).text();
    const submissionId = page.match(/name="submissionId" value="([^"]+)/)?.[1];
    const item = contentBank.find((candidate) => candidate.id === "bash-effective-shell-expansion-order") as OrderingItem;
    const submittedItems = outcome === "correct" ? item.orderedItems : [...item.orderedItems].reverse();
    const form = new URLSearchParams({ questionId: item.id, submissionId: submissionId! });
    for (const value of submittedItems) form.append("response", value);

    const response = await fetch(`${base}/practice`, {
      method: "POST",
      redirect: "manual",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form,
    });
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain(`result=${outcome}`);
    expect(store.attemptBySubmission(submissionId!)).toMatchObject({ expectedAnswer: item.answer });

    const reviewPage = await (await fetch(`${base}${response.headers.get("location")}`)).text();
    expect(reviewPage).toContain("groups parameter expansion, arithmetic expansion, and command substitution in one phase");
    expect(reviewPage).toContain("process substitution where supported and applicable");
    expect(reviewPage).toContain("final quote removal");
    expect(reviewPage).toContain("Parsing and redirection are not expansion stages");
  });

  it("grades an in-flight ordering submission against its stored canonical values", async () => {
    store.recordAttempt({
      submissionId: "due-stored-ordering",
      stableId: "bash-effective-shell-expansion-order",
      seed: 98,
      prompt: "old prompt",
      expectedAnswer: "old answer",
      response: "[]",
      correct: false,
      rating: "again",
      reviewedAt: "2026-01-01T00:00:00.000Z",
    });
    const page = await (await fetch(`${base}/practice`)).text();
    const submissionId = page.match(/name="submissionId" value="([^"]+)/)?.[1];
    const item = contentBank.find((candidate) => candidate.id === "bash-effective-shell-expansion-order") as OrderingItem;
    const originalItems = item.orderedItems;
    const originalAnswer = item.answer;
    item.orderedItems = ["replacement first", "replacement second"];
    item.answer = "replacement answer";

    try {
      const form = new URLSearchParams({ questionId: item.id, submissionId: submissionId! });
      for (const value of [
        "brace expansion",
        "tilde expansion",
        "parameter expansion",
        "command substitution",
        "arithmetic expansion",
        "word splitting",
        "pathname expansion",
      ]) form.append("response", value);
      const response = await fetch(`${base}/practice`, {
        method: "POST",
        redirect: "manual",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: form,
      });

      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toContain("result=correct");
      expect(store.attemptBySubmission(submissionId!)).toMatchObject({
        correct: true,
        expectedAnswer: originalAnswer,
      });
    } finally {
      item.orderedItems = originalItems;
      item.answer = originalAnswer;
    }
  });

  it("rejects a tampered ordering submission", async () => {
    const response = await fetch(`${base}/practice`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        questionId: "bash-effective-shell-expansion-order",
        submissionId: "tampered-order",
        response: "<script>alert(1)</script>",
      }),
    });

    expect(response.status).toBe(400);
    expect(store.attemptBySubmission("tampered-order")).toBeNull();
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

  it("preserves exact file-content line breaks in redirection feedback", async () => {
    const item = contentBank.find((candidate) => candidate.id === "bash-output-append-v-truncate")!;
    const submissionId = "multiline-redirection-feedback";
    store.recordAttempt({
      submissionId,
      stableId: item.id,
      seed: null,
      prompt: item.prompt,
      expectedAnswer: item.answer,
      response: item.choices![1]!,
      correct: false,
      rating: "again",
      reviewedAt: "2026-01-02T03:04:05.000Z",
    });

    const page = await (await fetch(`${base}/practice?result=incorrect&review=${submissionId}`)).text();
    expect(page).toContain(".result{white-space:pre-wrap}");
    expect(page).toContain("Final out.txt:\nFIRST\n\nFinal log.txt:\nOLD\nSECOND");
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
