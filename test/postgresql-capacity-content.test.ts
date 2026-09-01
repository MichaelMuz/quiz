import { describe, expect, it } from "vitest";
import { contentBank } from "../src/content.js";
import { chooseStableId } from "../src/scheduler.js";
import { QuizStore } from "../src/store.js";

function item(id: string) {
  const found = contentBank.find((candidate) => candidate.id === id);
  expect(found, `missing ${id}`).toBeDefined();
  return found!;
}

describe("PostgreSQL single-node capacity planning", () => {
  it("composes application rate into separate read and write rates before adding headroom", () => {
    const current = item("postgres-capacity-compose-operation-rate");

    expect(current.kind).toBe("flashcard");
    expect(current.topic).toBe("PostgreSQL capacity planning");
    expect(current.prompt).toMatch(/2,000 application requests\/s.*4 simple indexed point reads.*25%.*one synchronous durable row update/is);
    expect(current.prompt).toMatch(/small rows.*warm.*PostgreSQL.*OS caches.*pooled connections.*low contention.*local network.*16-vCPU.*p95.*20 ms.*50%.*headroom/is);
    expect(current.correctChoice).toBe("8,000 reads/s and 500 writes/s offered; test for 12,000 reads/s and 750 writes/s with headroom");
    expect(current.choices).toContain(current.correctChoice);
    expect(current.answer).toMatch(/2,000 × 4 = 8,000 database read queries\/s.*2,000 × 25% = 500 database write operations\/s.*× 1\.5.*12,000.*750/is);
    expect(current.answer).toMatch(/separate.*synchronous durable write.*not.*equivalent/is);
    expect(current.references?.length).toBeGreaterThan(0);
    expect(current.references?.every(({ label, url }) =>
      label.includes("accessed 2026-09-01") && url.startsWith("https://www.postgresql.org/docs/18/"),
    )).toBe(true);
  });

  it("classifies tens of thousands of favorable reads as plausible but benchmark-dependent", () => {
    const current = item("postgres-capacity-classify-favorable-read");

    expect(current.prompt).toMatch(/20,000 simple indexed point reads\/s.*400 synchronous durable row updates\/s/is);
    expect(current.prompt).toMatch(/small rows.*warm.*PostgreSQL.*OS caches.*pooled connections.*low contention.*local network.*16-vCPU.*p95.*20 ms.*50%.*headroom/is);
    expect(current.correctChoice).toMatch(/plausible tens-of-thousands read territory.*benchmark.*separately/i);
    expect(current.choices).toContain(current.correctChoice);
    expect(current.answer).toMatch(/20,000 × 1\.5 = 30,000 read queries\/s.*400 × 1\.5 = 600 write operations\/s/is);
    expect(current.answer).toMatch(/AlloyDB.*467,583 select-only TPS.*64-vCPU.*220 GB.*256-client/is);
    expect(current.answer).toMatch(/specific benchmark.*not a capacity promise/is);
    expect(current.answer).toMatch(/not.*universal.*PostgreSQL limit/is);
    expect(current.references).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: expect.stringContaining("accessed 2026-09-01"),
        url: "https://www.postgresql.org/docs/18/pgbench.html",
      }),
      expect.objectContaining({
        label: expect.stringContaining("accessed 2026-09-01"),
        url: "https://docs.cloud.google.com/alloydb/docs/benchmark-oltp-performance-alloydb",
      }),
    ]));
  });

  it("diagnoses a hostile 100k-read target before discussing replicas or sharding", () => {
    const current = item("postgres-capacity-diagnose-before-scaling");

    expect(current.prompt).toMatch(/100,000 database read queries\/s.*5,000 synchronous durable write operations\/s/is);
    expect(current.prompt).toMatch(/80%.*indexed point reads.*20%.*cache-missing scans.*complex joins.*large rows/is);
    expect(current.prompt).toMatch(/hot rows.*mixed cache.*unpooled connections.*high lock contention.*cross-region network.*16-vCPU.*p99.*10 ms.*50%.*headroom/is);
    expect(current.correctChoice).toMatch(/benchmark.*150,000 reads\/s.*7,500 writes\/s.*replicas.*eligible reads.*not.*primary writes.*sharding.*measurements/is);
    expect(current.choices).toContain(current.correctChoice);
    expect(current.answer).toMatch(/CPU.*cache hit.*I\/O.*WAL.*lock waits.*connection pressure.*tail latency/is);
    expect(current.answer).toMatch(/read replicas.*eligible.*reads.*do not multiply.*primary write throughput/is);
    expect(current.answer).toMatch(/100,000.*benchmark-.*workload-specific.*not.*ceiling/is);
    expect(current.references).toEqual(expect.arrayContaining([
      expect.objectContaining({ url: "https://www.postgresql.org/docs/18/monitoring-stats.html" }),
      expect.objectContaining({ url: "https://www.postgresql.org/docs/18/warm-standby.html" }),
    ]));
  });

  it("keeps stable grading, replay, existing PostgreSQL content, and mixed-queue reachability", () => {
    const ids = contentBank
      .filter(({ id }) => id.startsWith("postgres-capacity-"))
      .map(({ id }) => id);
    expect(ids).toEqual([
      "postgres-capacity-compose-operation-rate",
      "postgres-capacity-classify-favorable-read",
      "postgres-capacity-diagnose-before-scaling",
    ]);
    expect(new Set(ids).size).toBe(3);

    for (const id of ids) {
      const current = item(id);
      expect(current.choices).toHaveLength(4);
      expect(new Set(current.choices).size).toBe(4);
      expect(current.choices?.filter((choice) => choice === current.correctChoice)).toHaveLength(1);
      expect(current.references?.every(({ label }) => label.includes("accessed 2026-09-01"))).toBe(true);
    }
    expect(contentBank.some(({ id }) => id === "sql-support-postgres-distinct-on")).toBe(true);
    expect(contentBank.some(({ id }) => id === "transaction-isolation-postgres-statement-snapshot")).toBe(true);

    const reachable = new Set(Array.from({ length: contentBank.length * 2 }, (_, position) =>
      chooseStableId(position, [], new Date("2026-09-01T00:00:00.000Z"))));
    expect(ids.every((id) => reachable.has(id))).toBe(true);

    const replay = item("postgres-capacity-diagnose-before-scaling");
    const store = new QuizStore(":memory:");
    try {
      store.recordAttempt({
        submissionId: "postgres-capacity-replay",
        stableId: replay.id,
        seed: null,
        prompt: replay.prompt,
        expectedAnswer: replay.answer,
        response: replay.correctChoice!,
        correct: true,
        rating: "good",
        reviewedAt: "2026-09-01T00:00:00.000Z",
      });
      expect(store.attemptBySubmission("postgres-capacity-replay")).toMatchObject({
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
