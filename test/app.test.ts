import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createQuizServer } from "../src/app.js";
import { generateQuestion } from "../src/content.js";
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

  it("rejects invalid question IDs", async () => {
    const response = await fetch(`${base}/practice`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ questionId: "not-real", submissionId: "x", response: "1" }),
    });
    expect(response.status).toBe(400);
  });
});
