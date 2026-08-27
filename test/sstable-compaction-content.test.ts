import { describe, expect, it } from "vitest";
import {
  activeGeneratedDefinitions,
  contentBank,
  generateQuestion,
  generatedDefinitions,
  gradeAnswer,
} from "../src/content.js";
import { chooseStableId } from "../src/scheduler.js";

const staticIds = [
  "sstable-immutable-updates",
  "sstable-compaction-purpose",
  "sstable-write-amplification-tradeoff",
  "sstable-stcs",
  "sstable-lcs",
  "sstable-twcs",
];
const generatedId = "sstable-write-amplification-ratio";

function item(id: string) {
  const found = contentBank.find((candidate) => candidate.id === id);
  expect(found, `missing ${id}`).toBeDefined();
  return found!;
}

describe("SSTable compaction and write amplification", () => {
  it("ships one bounded seven-exercise cohort with dated primary references", () => {
    expect(contentBank.filter(({ id }) => id.startsWith("sstable-")).map(({ id }) => id))
      .toEqual(staticIds);
    expect(generatedDefinitions).toContainEqual(expect.objectContaining({ id: generatedId, active: true }));

    for (const id of staticIds) {
      const current = item(id);
      expect(current.references?.length).toBeGreaterThan(0);
      expect(current.references?.every(({ label }) => label.includes("accessed 2026-08-27"))).toBe(true);
    }

    const scheduled = new Set(Array.from({ length: 2_000 }, (_, position) =>
      chooseStableId(position, [], new Date("2026-08-27T00:00:00.000Z"))));
    for (const id of [...staticIds, generatedId]) expect(scheduled).toContain(id);
  });

  it("connects immutable updates to version fan-out across SSTables", () => {
    const current = item("sstable-immutable-updates");
    expect(current.prompt).toMatch(/update.*immutable SSTable/i);
    expect(current.answer).toMatch(/new timestamped version.*old version.*not overwritten.*read.*multiple SSTables/i);
  });

  it("states what compaction rewrites and what it may safely discard", () => {
    const current = item("sstable-compaction-purpose");
    expect(current.answer).toMatch(/merge.*sorted SSTables.*new SSTable/i);
    expect(current.answer).toMatch(/newest timestamped.*obsolete versions.*tombstones.*eligible/i);
    expect(current.answer).not.toMatch(/all tombstones immediately/i);
  });

  it("defines write amplification as extra physical writing rather than slower reads", () => {
    const current = item("sstable-write-amplification-tradeoff");
    expect(current.prompt).toMatch(/write amplification/i);
    expect(current.answer).toMatch(/physical bytes written.*logical bytes.*compaction.*rewrit/i);
    expect(current.answer).toMatch(/read amplification.*SSTables.*consult/i);
  });

  it("distinguishes STCS, LCS, and TWCS by their actual grouping boundaries", () => {
    expect(item("sstable-stcs").answer).toMatch(/similar-sized SSTables.*larger SSTable.*versions.*many SSTables/i);
    expect(item("sstable-lcs").answer).toMatch(/L0.*overlap.*L1.*non-overlapping.*one SSTable per level.*I\/O/i);
    expect(item("sstable-twcs").answer).toMatch(/time window.*STCS.*active window.*expired SSTables.*out-of-order/i);
  });

  it("replays a deterministic physical-to-logical write ratio", () => {
    const first = generateQuestion(generatedId, 2);
    expect(generateQuestion(generatedId, 2)).toEqual(first);
    expect(first.prompt).toMatch(/8 GiB of logical writes.*40 GiB total.*write amplification ratio/i);
    expect(first.expectedAnswer).toBe("5");
    expect(first.feedback).toMatch(/40 GiB ÷ 8 GiB = 5×.*physical writes.*compaction/i);
    expect(gradeAnswer(first.grader, "5", first.expectedAnswer)).toBe(true);
    expect(gradeAnswer(first.grader, "4", first.expectedAnswer)).toBe(false);
    expect(activeGeneratedDefinitions).toContainEqual(expect.objectContaining({ id: generatedId }));
  });
});
