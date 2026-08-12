import { describe, expect, it } from "vitest";
import { contentBank } from "../src/content.js";
import { cronItems } from "../src/cron-content.js";
import { chooseStableId } from "../src/scheduler.js";
import { QuizStore } from "../src/store.js";

const cronIds = [
  "cron-construct-weekday-morning",
  "cron-predict-list-range-times",
  "cron-step-field-scope",
  "cron-dom-dow-or-calendar",
  "cron-next-run-weekdays",
  "cron-common-nicknames",
  "cron-user-system-entry-shape",
  "cron-kubernetes-transfer",
];

const accessedAt = "accessed 2026-08-12";

function item(id: string) {
  const found = contentBank.find((candidate) => candidate.id === id);
  expect(found, `missing ${id}`).toBeDefined();
  return found!;
}

describe("practical cron schedule syntax", () => {
  it("constructs a weekday schedule from the five Unix fields", () => {
    const construction = item("cron-construct-weekday-morning");

    expect(construction.kind).toBe("command");
    expect(construction.prompt).toMatch(/Cronie.*user crontab.*09:15.*Monday through Friday.*time zone/is);
    expect(construction.correctChoice).toBe("15 9 * * 1-5");
    expect(construction.choices).toContain(construction.correctChoice);
    expect(construction.answer).toMatch(/minute, hour, day of month, month, day of week/is);
    expect(construction.answer).toMatch(/minute 0-59.*hour 0-23.*day of month 1-31.*month 1-12.*day of week 0-7/is);
  });

  it("predicts exact matches for lists and inclusive ranges", () => {
    const matching = item("cron-predict-list-range-times");

    expect(matching.prompt).toMatch(/Cronie.*5,35 8-9 \* \* \*.*2026-08-18.*America\/New_York/is);
    expect(matching.correctChoice).toBe("08:05, 08:35, 09:05, and 09:35");
    expect(matching.answer).toMatch(/comma.*list.*8-9.*inclusive/is);
  });

  it("diagnoses that steps advance within one field", () => {
    const step = item("cron-step-field-scope");

    expect(step.prompt).toMatch(/Cronie.*0 \*\/23 \* \* \*.*America\/New_York/is);
    expect(step.correctChoice).toMatch(/00:00 and 23:00 every day.*not every 23 elapsed hours/is);
    expect(step.answer).toMatch(/step.*within.*hour field.*resets.*calendar day/is);
  });

  it("applies Cronie day-of-month and day-of-week OR semantics to a calendar", () => {
    const days = item("cron-dom-dow-or-calendar");

    expect(days.prompt).toMatch(/Cronie.*30 4 1,15 \* 5.*August 2026.*America\/New_York/is);
    expect(days.correctChoice).toBe("August 1, 7, 14, 15, 21, and 28 at 04:30");
    expect(days.answer).toMatch(/both.*restricted.*either.*matches.*OR/is);
  });

  it("chooses the next run from an explicit date and time zone", () => {
    const nextRun = item("cron-next-run-weekdays");

    expect(nextRun.prompt).toMatch(/Cronie.*30 10 \* \* 2,4.*Monday 2026-08-17 10:12.*America\/New_York/is);
    expect(nextRun.correctChoice).toBe("Tuesday 2026-08-18 at 10:30");
    expect(nextRun.answer).toMatch(/Tuesday and Thursday.*next matching instant/is);
  });

  it("maps the common Cronie nicknames to five-field schedules", () => {
    const nicknames = item("cron-common-nicknames");

    expect(nicknames.prompt).toMatch(/@hourly.*@daily.*@weekly.*@monthly/is);
    expect(nicknames.correctChoice).toBe("@hourly → 0 * * * *; @daily → 0 0 * * *; @weekly → 0 0 * * 0; @monthly → 0 0 1 * *");
    expect(nicknames.answer).toMatch(/start of each hour.*midnight.*Sunday.*first day/is);
  });

  it("distinguishes user and system crontab entry shapes", () => {
    const entryShape = item("cron-user-system-entry-shape");

    expect(entryShape.prompt).toMatch(/15 2 \* \* \*.*backup.*user crontab.*system crontab/is);
    expect(entryShape.correctChoice).toMatch(/user.*five fields.*command.*system.*five fields.*username.*command/is);
    expect(entryShape.answer).toMatch(/crontab\(5\).*sixth field.*user name/is);
  });

  it("transfers the five-field core to Kubernetes without transferring zone syntax", () => {
    const transfer = item("cron-kubernetes-transfer");

    expect(transfer.prompt).toMatch(/Kubernetes CronJob.*09:15.*Monday through Friday.*America\/New_York/is);
    expect(transfer.correctChoice).toMatch(/schedule: "15 9 \* \* 1-5".*timeZone: "America\/New_York"/is);
    expect(transfer.answer).toMatch(/\.spec\.schedule.*five-field.*\.spec\.timeZone.*rejects.*TZ.*CRON_TZ/is);
    expect(transfer.answer).toMatch(/Kubernetes.*0-6.*names.*Cronie.*0 or 7/is);
    expect(transfer.references?.map(({ url }) => url)).toContain("https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/");
  });

  it("keeps stable choice grading, source scope, mixed-queue reachability, and stored replay", () => {
    expect(cronItems.map(({ id }) => id)).toEqual(cronIds);
    expect(new Set(cronIds).size).toBe(cronIds.length);

    for (const id of cronIds) {
      const candidate = item(id);
      const choices = candidate.choices ?? [];
      expect(candidate.kind).toBe("command");
      expect(choices).toContain(candidate.correctChoice);
      expect(new Set(choices).size).toBe(choices.length);
      expect(choices).not.toContain("");
      expect(choices).not.toContain("not a rendered choice");
      expect(candidate.references?.length).toBeGreaterThan(0);
      expect(candidate.references?.every(({ label, url }) =>
        label.includes(accessedAt) && url.startsWith("https://")),
      ).toBe(true);
      expect(`${candidate.prompt}\n${candidate.answer}`).not.toMatch(/Quartz|AWS schedule|concurrencyPolicy|backoffLimit|cron daemon administration/i);
    }

    const urls = new Set(cronItems.flatMap((candidate) =>
      candidate.references?.map(({ url }) => url) ?? []));
    expect(urls).toEqual(new Set([
      "https://github.com/cronie-crond/cronie/blob/master/man/crontab.5",
      "https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/",
    ]));

    const now = new Date("2026-08-17T00:00:00.000Z");
    const reachable = new Set(Array.from({ length: contentBank.length * 2 }, (_, position) =>
      chooseStableId((position * 2) + 1, [], now)));
    expect(cronIds.every((id) => reachable.has(id))).toBe(true);

    const replay = item("cron-kubernetes-transfer");
    const store = new QuizStore(":memory:");
    try {
      store.recordAttempt({
        submissionId: "cron-transfer-replay",
        stableId: replay.id,
        seed: null,
        prompt: replay.prompt,
        expectedAnswer: replay.answer,
        response: replay.correctChoice!,
        correct: true,
        rating: "good",
        reviewedAt: now.toISOString(),
      });
      expect(store.attemptBySubmission("cron-transfer-replay")).toMatchObject({
        stableId: replay.id,
        prompt: replay.prompt,
        expectedAnswer: replay.answer,
        response: replay.correctChoice,
        correct: true,
      });
      expect(store.reviewState(replay.id)).toMatchObject({ reviews: 1, successfulReviews: 1 });
    } finally {
      store.close();
    }
  });
});
