import { describe, expect, it } from "vitest";
import { contentBank } from "../src/content.js";
import { chooseStableId } from "../src/scheduler.js";
import { QuizStore } from "../src/store.js";
import { viewstampedReplicationItems } from "../src/viewstamped-replication-content.js";

function item(id: string) {
  const found = contentBank.find((candidate) => candidate.id === id);
  expect(found, `missing ${id}`).toBeDefined();
  return found!;
}

describe("Viewstamped Replication Revisited protocol traces", () => {
  it("derives the primary and interprets replica state without importing Raft terms", () => {
    const current = item("vr-state-and-primary");

    expect(current.kind).toBe("command");
    expect(current.topic).toBe("Viewstamped Replication");
    expect(current.prompt).toMatch(/2012 VR Revisited.*3 replicas.*crash.*f = 1.*quorum = 2/is);
    expect(current.prompt).toMatch(/view 4.*status = normal.*op-number = 7.*commit-number = 6.*R1, R2, R3/is);
    expect(current.correctChoice).toMatch(/R2.*primary.*entry 7.*not yet committed/is);
    expect(current.choices).toContain(current.correctChoice);
    expect(current.answer).toMatch(/view 0.*R1.*round-robin.*view 4.*R2/is);
    expect(current.answer).toMatch(/commit-number 6.*entry 7.*prepared|entry 7.*prepared.*commit-number 6/is);
    expect(current.answer).not.toMatch(/term|leader/i);
    expect(current.references).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: expect.stringContaining("MIT-CSAIL-TR-2012-021"),
        url: "https://hdl.handle.net/1721.1/71763",
      }),
      expect.objectContaining({ url: "https://doi.org/10.1145/62546.62549" }),
    ]));
  });

  it("orders the normal-operation request path through backup commit learning", () => {
    const current = item("vr-normal-operation-sequence");

    expect(current.kind).toBe("ordering");
    expect(current.prompt).toMatch(/3 replicas.*crash.*f = 1.*quorum = 2/is);
    expect(current.orderedItems).toEqual([
      "Client sends REQUEST(operation, client-id, request-number) to the primary",
      "Primary checks the client table, appends the request with a new op-number, then sends PREPARE",
      "A backup accepts the next matching entry, appends it, and replies PREPAREOK",
      "After f PREPAREOK replies, the primary commits, executes, updates its client table, and replies",
      "A backup learns the commit-number from a later PREPARE or COMMIT, then executes the committed prefix",
    ]);
    expect(current.answer).toMatch(/primary plus f backups.*f \+ 1.*quorum/is);
    expect(current.answer).toMatch(/backup.*does not execute.*PREPARE alone|PREPARE alone.*backup.*does not execute/is);
  });

  it("commits only after the primary has acknowledgements from f backups", () => {
    const current = item("vr-normal-quorum-commit");
    const mayCommit = (f: number, prepareOkFromBackups: number) => prepareOkFromBackups >= f;

    expect(mayCommit(2, 1)).toBe(false);
    expect(mayCommit(2, 2)).toBe(true);
    expect(current.prompt).toMatch(/5 replicas.*f = 2.*quorum = 3.*op-number 14/is);
    expect(current.correctChoice).toBe("Commit after B2's PREPAREOK: P, B1, and B2 form the three-replica quorum");
    expect(current.answer).toMatch(/one PREPAREOK.*not enough.*two PREPAREOK.*primary.*three replicas/is);
  });

  it("separates prepared entries from commit-number propagation at backups", () => {
    const current = item("vr-prepare-vs-commit-propagation");

    expect(current.prompt).toMatch(/3 replicas.*B1.*op-number = 9.*commit-number = 8.*PREPARE.*op-number 10.*commit-number 9/is);
    expect(current.correctChoice).toBe("B1 advances the committed prefix through operation 9 and executes it in order; it also appends operation 10 and replies PREPAREOK");
    expect(current.correctChoice).not.toMatch(/first|before|then/i);
    expect(current.answer).toMatch(/entry 9.*prepared.*not yet known committed.*commit-number 9.*execute.*in (?:log )?order/is);
    expect(current.answer).toMatch(/protocol does not require.*execution.*before.*append|append.*before.*execution/is);
  });

  it("suppresses a duplicate client request after a lost reply and view change", () => {
    const current = item("vr-duplicate-client-request");

    expect(current.prompt).toMatch(/client C.*request-number 12.*committed.*reply.*lost.*view change.*client table.*12.*cached/is);
    expect(current.correctChoice).toBe("Return the cached result for request 12 without appending or executing another operation");
    expect(current.answer).toMatch(/request-number equal.*client table.*resends.*cached result.*exactly-once effect/is);
    expect(current.answer).toMatch(/smaller.*discard.*larger.*new request/is);
  });

  it("selects the view-change log by latest normal view, then longest log", () => {
    const current = item("vr-view-change-log-selection");
    const candidates = [
      { replica: "A", latestNormalView: 7, opNumber: 12, commitNumber: 9 },
      { replica: "B", latestNormalView: 8, opNumber: 10, commitNumber: 10 },
      { replica: "C", latestNormalView: 8, opNumber: 11, commitNumber: 8 },
    ];
    const selected = [...candidates].sort((left, right) =>
      right.latestNormalView - left.latestNormalView || right.opNumber - left.opNumber)[0]!;
    const newCommitNumber = Math.max(...candidates.map(({ commitNumber }) => commitNumber));

    expect(selected.replica).toBe("C");
    expect(newCommitNumber).toBe(10);
    expect(current.correctChoice).toBe("Choose C's log through op 11, and start the new view with commit-number 10");
    expect(current.answer).toMatch(/largest latest-normal-view.*8.*tie.*largest op-number.*11/is);
    expect(current.answer).toMatch(/largest commit-number.*10.*independent/is);
  });

  it("preserves a committed operation across a view change by quorum intersection", () => {
    const current = item("vr-view-change-committed-prefix");
    const commitQuorum = new Set(["P", "R2"]);
    const viewChangeQuorum = new Set(["R2", "R3"]);
    const intersection = [...commitQuorum].filter((replica) => viewChangeQuorum.has(replica));

    expect(intersection).toEqual(["R2"]);
    expect(current.correctChoice).toBe("Operation 6 must remain in the new view because R2 carries it into the view-change quorum");
    expect(current.answer).toMatch(/commit quorum.*view-change quorum.*intersect.*R2/is);
    expect(current.answer).toMatch(/prepared.*later view.*longest log.*cannot discard.*committed/is);
  });

  it("distinguishes partition safety from quorum-side liveness", () => {
    const current = item("vr-partition-safety-liveness");
    const canCommit = (f: number, reachableIncludingPrimary: number) => reachableIncludingPrimary >= f + 1;

    expect(canCommit(2, 2)).toBe(false);
    expect(canCommit(2, 3)).toBe(true);
    expect(current.prompt).toMatch(/5 replicas.*f = 2.*partition.*old primary.*2 replicas.*other 3/is);
    expect(current.correctChoice).toBe("The two-replica side cannot commit; the three-replica side can form a later view and progress when communication stabilizes");
    expect(current.answer).toMatch(/safety.*both sides.*only.*f \+ 1.*liveness.*stable.*repeated/is);
  });

  it("keeps a rebooted replica recovering until a quorum identifies current state", () => {
    const current = item("vr-recovery-and-state-transfer");

    expect(current.prompt).toMatch(/R3.*lost volatile state.*nonce.*RECOVERY.*3 replicas.*f = 1/is);
    expect(current.correctChoice).toBe("Wait for matching-nonce replies from two replicas including the primary, install the primary's protocol/log state, then enter normal status");
    expect(current.answer).toMatch(/recovering.*not participate.*quorum.*f \+ 1.*primary.*protocol.*log.*nonce/is);
    expect(current.answer).toMatch(/application checkpoint state.*separate.*transfer.*need not come from the primary/is);
    expect(current.answer).not.toMatch(/primary.*response carrying application state/is);
  });

  it("maps only the narrow shared VR and Raft vocabulary without merging protocols", () => {
    const current = item("vr-raft-narrow-comparison");

    expect(current.correctChoice).toBe("VR view-number and Raft term both identify leadership epochs; VR op-number and Raft log index both position ordered operations, but their election and commit rules remain protocol-specific");
    expect(current.answer).toMatch(/primary.*leader.*view-number.*term.*op-number.*log index/is);
    expect(current.answer).toMatch(/not interchangeable.*DOVIEWCHANGE.*RequestVote.*PREPAREOK.*AppendEntries/is);
    expect(current.references).toEqual(expect.arrayContaining([
      expect.objectContaining({ url: "https://hdl.handle.net/1721.1/71763" }),
      expect.objectContaining({ url: "https://raft.github.io/raft.pdf" }),
    ]));
  });

  it("ships a sourced eleven-item progression ending at the reconfiguration boundary", () => {
    const ids = viewstampedReplicationItems.map(({ id }) => id);
    expect(ids).toEqual([
      "vr-state-and-primary",
      "vr-normal-operation-sequence",
      "vr-normal-quorum-commit",
      "vr-prepare-vs-commit-propagation",
      "vr-duplicate-client-request",
      "vr-view-change-log-selection",
      "vr-view-change-committed-prefix",
      "vr-partition-safety-liveness",
      "vr-recovery-and-state-transfer",
      "vr-raft-narrow-comparison",
      "vr-reconfiguration-epoch-boundary",
    ]);
    expect(new Set(ids).size).toBe(11);
    expect(viewstampedReplicationItems.every(({ references }) =>
      references?.some(({ label }) => label.includes("accessed 2026-10-05")))).toBe(true);
    expect(viewstampedReplicationItems.every(({ choices, correctChoice }) =>
      !correctChoice || choices?.length === 4 && choices.includes(correctChoice))).toBe(true);

    const reconfiguration = item("vr-reconfiguration-epoch-boundary");
    expect(reconfiguration.correctChoice).toBe("Commit the RECONFIGURATION as the old epoch's final request; the new group serves clients only after state transfer through that boundary");
    expect(reconfiguration.answer).toMatch(/old group.*normal protocol.*last request.*new epoch.*transitioning/is);
    expect(reconfiguration.answer).toMatch(/new group.*all operations.*previous epoch.*state transfer.*old replicas.*remain/is);

    const now = new Date("2026-10-05T00:00:00.000Z");
    const reachable = new Set(Array.from({ length: contentBank.length * 2 }, (_, position) =>
      chooseStableId((position * 2) + 1, [], now)));
    expect(ids.every((id) => reachable.has(id))).toBe(true);

    const replay = item("vr-view-change-log-selection");
    const store = new QuizStore(":memory:");
    try {
      store.recordAttempt({
        submissionId: "vr-replay",
        stableId: replay.id,
        seed: null,
        prompt: replay.prompt,
        expectedAnswer: replay.answer,
        response: replay.correctChoice!,
        correct: true,
        rating: "good",
        reviewedAt: now.toISOString(),
      });
      expect(store.attemptBySubmission("vr-replay")).toMatchObject({
        stableId: replay.id,
        prompt: replay.prompt,
        expectedAnswer: replay.answer,
        response: replay.correctChoice,
        correct: true,
      });
    } finally {
      store.close();
    }
  });
});
