import { describe, expect, it } from "vitest";
import { contentBank } from "../src/content.js";
import { chooseStableId } from "../src/scheduler.js";
import { QuizStore } from "../src/store.js";

const geometryIds = [
  "transaction-geometry-compare",
  "transaction-geometry-real-time",
  "transaction-geometry-overlap",
  "transaction-geometry-no-sequential-history",
  "transaction-geometry-strict-serializability",
] as const;

const acidIds = [
  "acid-atomicity",
  "acid-consistency",
  "acid-isolation",
  "acid-durability",
] as const;

const isolationIds = [
  "transaction-isolation-standard-phenomena",
  "transaction-isolation-postgres-read-uncommitted",
  "transaction-isolation-postgres-statement-snapshot",
  "transaction-isolation-postgres-transaction-snapshot",
  "transaction-isolation-postgres-lost-update",
  "transaction-isolation-postgres-write-skew",
  "transaction-isolation-postgres-serializable-retry",
  "transaction-isolation-postgres-mvcc-boundary",
  "transaction-isolation-standard-vs-postgres",
] as const;

const cohortIds = [...geometryIds, ...acidIds, ...isolationIds] as const;
const accessedAt = "accessed 2026-08-07";

type CohortId = typeof cohortIds[number];

function item(id: CohortId) {
  const found = contentBank.find((candidate) => candidate.id === id);
  expect(found, `missing ${id}`).toBeDefined();
  return found!;
}

describe("transaction consistency and isolation practice", () => {
  it("ships one bounded, sourced, deterministic cohort with stable grading", () => {
    const items = contentBank.filter(({ id }) =>
      id.startsWith("transaction-geometry-")
      || id.startsWith("acid-")
      || id.startsWith("transaction-isolation-"));

    expect(items.map(({ id }) => id)).toEqual(cohortIds);
    expect(cohortIds).toHaveLength(18);
    expect(new Set(cohortIds).size).toBe(18);

    for (const candidate of items) {
      expect(candidate.kind).toBe("command");
      expect(candidate.choices).toContain(candidate.correctChoice);
      expect(candidate.choices).toHaveLength(4);
      expect(new Set(candidate.choices).size).toBe(4);
      expect(candidate.references?.length).toBeGreaterThan(0);
      expect(candidate.references?.every(({ label, url }) =>
        label.includes(accessedAt) && url.startsWith("https://")),
      ).toBe(true);
    }
  });

  it("models serializability, linearizability, and strict serializability without collapsing their units", () => {
    const compare = item("transaction-geometry-compare");
    expect(`${compare.prompt}\n${compare.answer}`).toMatch(/serializability.*transaction.*legal serial.*equivalent/is);
    expect(compare.answer).toMatch(/linearizability.*operation/is);
    expect(compare.answer).toMatch(/sequential object specification/is);
    expect(compare.answer).toMatch(/effect point.*invocation-response interval/is);
    expect(`${compare.prompt}\n${compare.answer}`).toMatch(/strict serializability.*transaction.*real[- ]time/is);
    expect(compare.answer).toMatch(/program order.*cross-transaction wall-clock|transaction-internal.*cross-transaction real-time/is);

    const realTime = item("transaction-geometry-real-time");
    expect(realTime.prompt).toMatch(/register initially 0.*write\(1\).*write\(2\).*read\(\).*return(?:s)? 1/is);
    expect(realTime.prompt).toMatch(/non-overlap/is);
    expect(realTime.prompt).toMatch(/equivalence.*same read return.*final register state/is);
    expect(realTime.prompt).toMatch(/observed final register state(?: is|:) 1/is);
    expect(realTime.correctChoice).toMatch(/serializable.*not linearizable/is);
    expect(realTime.answer).toMatch(/write\(2\).*write\(1\).*read.*real[- ]time/is);

    const overlap = item("transaction-geometry-overlap");
    expect(overlap.prompt).toMatch(/register initially 0.*write\(1\).*write\(2\).*overlap/is);
    expect(overlap.prompt).toMatch(/sequential specification.*latest value/is);
    expect(overlap.prompt).toMatch(/no later read/is);
    expect(overlap.correctChoice).toMatch(/either order.*linearizable/is);
    expect(overlap.answer).toMatch(/overlap.*no real-time precedence/is);

    const impossible = item("transaction-geometry-no-sequential-history");
    expect(impossible.prompt).toMatch(/register initially 0.*write\(1\).*read\(\).*return(?:s)? 2/is);
    expect(impossible.prompt).toMatch(/observed final register state(?: is|:) 1/is);
    expect(impossible.correctChoice).toMatch(/neither/is);
    expect(impossible.answer).toMatch(/no legal sequential.*read.*2/is);

    const strict = item("transaction-geometry-strict-serializability");
    expect(strict.prompt).toMatch(/T1.*COMMIT.*T2.*read x.*0.*COMMIT/is);
    expect(strict.prompt).toMatch(/T1 commits before T2 begins/is);
    expect(strict.prompt).toMatch(/equivalence.*read return.*final state.*program order/is);
    expect(strict.correctChoice).toMatch(/serializable.*not strictly serializable/is);
    expect(strict.answer).toMatch(/T2.*T1.*real-time.*T1.*T2/is);
  });

  it("teaches ACID properties with explicit non-guarantees", () => {
    const atomicity = item("acid-atomicity");
    expect(atomicity.prompt).toMatch(/debit.*credit.*failure|failure.*debit.*credit/is);
    expect(atomicity.correctChoice).toMatch(/atomicity/is);
    expect(atomicity.answer).toMatch(/all-or-none/is);
    expect(atomicity.answer).toMatch(/not CPU.*atomicity/is);
    expect(atomicity.answer).toMatch(/linearizability/is);

    const consistency = item("acid-consistency");
    expect(consistency.prompt).toMatch(/(?:unencoded invariant|invariant.*not encoded)/is);
    expect(consistency.correctChoice).toMatch(/consistency.*does not.*infer/is);
    expect(consistency.answer).toMatch(/correct transaction.*declared|integrity constraint/is);
    expect(consistency.answer).toMatch(/not.*CAP|not.*replica|not.*instant visibility/is);

    const isolation = item("acid-isolation");
    expect(isolation.prompt).toMatch(/Read Committed.*two SELECT/is);
    expect(isolation.correctChoice).toMatch(/named isolation-level contract/is);
    expect(isolation.correctChoice).toMatch(/does not mean.*always.*Serializable/is);
    expect(isolation.answer).toMatch(/new statement snapshot.*nonrepeatable/is);

    const durability = item("acid-durability");
    expect(durability.correctChoice).toMatch(/durability/is);
    expect(durability.answer).toMatch(/acknowledged commit.*covered.*failure/is);
    expect(durability.answer).toMatch(/not.*availability.*backup.*geographic.*eternal retention/is);
  });

  it("classifies standard phenomena and names the weakest standard protection", () => {
    const standard = item("transaction-isolation-standard-phenomena");
    expect(standard.prompt).toMatch(/SQL standard model/is);
    expect(standard.prompt).toMatch(/dirty read.*nonrepeatable read.*phantom read.*serialization anomaly/is);
    expect(standard.correctChoice).toMatch(/Read Committed.*Repeatable Read.*Serializable.*Serializable/is);
    expect(standard.answer).toMatch(/minimum protections.*vendor.*stronger/is);
  });

  it("distinguishes PostgreSQL 18 statement snapshots, transaction snapshots, and vendor-specific protections", () => {
    const readUncommitted = item("transaction-isolation-postgres-read-uncommitted");
    expect(readUncommitted.prompt).toMatch(/PostgreSQL 18.*Read Uncommitted.*uncommitted.*ROLLBACK/is);
    expect(readUncommitted.correctChoice).toMatch(/cannot read.*behaves as Read Committed/is);

    const statementSnapshot = item("transaction-isolation-postgres-statement-snapshot");
    expect(statementSnapshot.prompt).toMatch(/PostgreSQL 18.*Read Committed.*x (?:initially )?10.*x=11/is);
    expect(statementSnapshot.correctChoice).toMatch(/nonrepeatable read.*statement snapshot/is);

    const transactionSnapshot = item("transaction-isolation-postgres-transaction-snapshot");
    expect(transactionSnapshot.prompt).toMatch(/PostgreSQL 18.*Repeatable Read/is);
    expect(transactionSnapshot.prompt).toMatch(/one row.*WHERE.*insert.*repeat the same SELECT/is);
    expect(transactionSnapshot.correctChoice).toMatch(/still returns 1.*transaction snapshot.*phantom/is);
    expect(transactionSnapshot.answer).toMatch(/stronger than.*SQL standard/is);

    const comparison = item("transaction-isolation-standard-vs-postgres");
    expect(comparison.prompt).toMatch(/SQL standard model.*PostgreSQL 18/is);
    expect(comparison.correctChoice).toMatch(/Read Uncommitted.*Read Committed.*Repeatable Read.*phantom.*serialization anomalies.*Serializable.*SSI/is);
  });

  it("uses exact lost-update, write-skew, SSI-retry, and MVCC boundaries", () => {
    const lostUpdate = item("transaction-isolation-postgres-lost-update");
    expect(lostUpdate.prompt).toMatch(/PostgreSQL 18.*x=10.*T1.*reads 10.*T2.*reads 10.*x=11.*final x=11/is);
    expect(lostUpdate.correctChoice).toMatch(/lost update.*Repeatable Read.*abort/is);

    const writeSkew = item("transaction-isolation-postgres-write-skew");
    expect(writeSkew.prompt).toMatch(/PostgreSQL 18.*Alice.*Bob.*on.call.*at least one.*both.*off/is);
    expect(writeSkew.correctChoice).toMatch(/write skew.*Repeatable Read.*Serializable.*abort/is);
    expect(writeSkew.answer).toMatch(/different row/is);
    expect(writeSkew.answer).toMatch(/snapshot isolation/is);
    expect(writeSkew.answer).toMatch(/no serial order/is);

    const retry = item("transaction-isolation-postgres-serializable-retry");
    expect(retry.prompt).toMatch(/PostgreSQL 18.*Serializable.*40001/is);
    expect(retry.correctChoice).toMatch(/retry.*whole transaction.*decision logic/is);
    expect(retry.answer).toMatch(/SSI|Serializable Snapshot Isolation/is);

    const mvcc = item("transaction-isolation-postgres-mvcc-boundary");
    expect(mvcc.correctChoice).toMatch(/implementation family.*not.*isolation level/is);
    expect(mvcc.answer).toMatch(/snapshot isolation.*not.*serializability/is);
  });

  it("keeps every item reachable in the mixed queue and preserves stored-attempt replay", () => {
    const now = new Date("2026-08-07T12:00:00.000Z");
    const reachable = new Set(Array.from({ length: contentBank.length * 2 }, (_, index) =>
      chooseStableId((index * 2) + 1, [], now)));
    expect(cohortIds.every((id) => reachable.has(id))).toBe(true);

    const replay = item("transaction-isolation-postgres-write-skew");
    const store = new QuizStore(":memory:");
    try {
      store.recordAttempt({
        submissionId: "transaction-consistency-replay",
        stableId: replay.id,
        seed: null,
        prompt: replay.prompt,
        expectedAnswer: replay.answer,
        response: replay.correctChoice!,
        correct: true,
        rating: "good",
        reviewedAt: now.toISOString(),
      });
      expect(store.attemptBySubmission("transaction-consistency-replay")).toMatchObject({
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
