import { describe, expect, it } from "vitest";
import { contentBank, generatedDefinitions } from "../src/content.js";
import { chooseStableId } from "../src/scheduler.js";

const staticIds = [
  "sstable-stcs-lcs-geometry",
  "sstable-lcs-overlap-rewrite",
];

function item(id: string) {
  const found = contentBank.find((candidate) => candidate.id === id);
  expect(found, `missing ${id}`).toBeDefined();
  return found!;
}

describe("SSTable compaction and write amplification", () => {
  it("ships exactly two deterministic recurring exercises with dated primary references", () => {
    expect(contentBank.filter(({ id }) => id.startsWith("sstable-")).map(({ id }) => id))
      .toEqual(staticIds);
    expect(generatedDefinitions.some(({ id }) => id.startsWith("sstable-"))).toBe(false);

    for (const id of staticIds) {
      const current = item(id);
      expect(current.choices).toContain(current.correctChoice);
      expect(current.references?.length).toBeGreaterThan(0);
      expect(current.references?.every(({ label }) => label.includes("accessed 2026-08-27"))).toBe(true);
    }

    const scheduled = new Set(Array.from({ length: 2_000 }, (_, position) =>
      chooseStableId(position, [], new Date("2026-08-27T00:00:00.000Z"))));
    for (const id of staticIds) expect(scheduled).toContain(id);
  });

  it("makes progressively finer LCS key-range tiling the causal contrast with STCS", () => {
    const current = item("sstable-stcs-lcs-geometry");
    expect(current.prompt).toMatch(/STCS.*LCS.*file geometry/i);
    expect(current.answer).toMatch(/STCS.*similarly sized.*larger SSTables/i);
    expect(current.answer).toMatch(/L0.*overlap.*L1\+.*no overlap within a level/i);
    expect(current.answer).toMatch(/target file size.*roughly fixed.*next level's capacity.*about 10×.*roughly 10× as many files.*finer key-range tiles/i);
    expect(current.answer).toMatch(/not.*administratively fixed shards.*distribution.*large partitions.*file-size exceptions/i);
    expect(current.answer).not.toMatch(/tombstone|Bloom filter|TWCS|UCS|read amplification/i);
  });

  it("connects deterministic range overlap to repeated immutable rewriting", () => {
    const current = item("sstable-lcs-overlap-rewrite");
    expect(current.prompt).toMatch(/L1 incoming.*\[A,F\].*L2.*\[A,B\].*\[C,D\].*\[E,F\]/is);
    expect(current.correctChoice).toMatch(/incoming L1 file.*three overlapping L2 files.*replacement SSTables/i);
    expect(current.answer).toMatch(/broader.*L1.*three narrower.*L2/i);
    expect(current.answer).toMatch(/immutable.*cannot be edited in place.*read.*merge.*incoming.*overlapping.*write replacements/i);
    expect(current.answer).toMatch(/deeper boundar.*older bytes.*new bytes.*leveled write amplification/i);
    expect(current.answer).not.toMatch(/tombstone|Bloom filter|TWCS|UCS|read amplification/i);
  });
});
