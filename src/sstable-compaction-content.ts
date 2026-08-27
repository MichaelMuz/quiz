import type { StaticItem } from "./content.js";

const accessedAt = "accessed 2026-08-27";
const storageReference = {
  label: `Apache Cassandra storage engine, ${accessedAt}`,
  url: "https://cassandra.apache.org/doc/latest/cassandra/architecture/storage-engine.html",
};
const stcsReference = {
  label: `Apache Cassandra Size Tiered Compaction Strategy, ${accessedAt}`,
  url: "https://cassandra.apache.org/doc/latest/cassandra/managing/operating/compaction/stcs.html",
};
const lcsReference = {
  label: `Apache Cassandra Leveled Compaction Strategy, ${accessedAt}`,
  url: "https://cassandra.apache.org/doc/latest/cassandra/managing/operating/compaction/lcs.html",
};
export const sstableItems: StaticItem[] = [
  {
    id: "sstable-stcs-lcs-geometry",
    kind: "flashcard",
    topic: "SSTable compaction",
    prompt: "Which STCS–LCS contrast correctly explains their file geometry in Cassandra?",
    choices: [
      "STCS merges similarly sized files into larger SSTables; LCS keeps a roughly fixed target file size, so fuller levels tile the keyspace with progressively finer ranges",
      "STCS assigns fixed key-range shards; LCS grows one file per level without changing range width",
      "STCS and LCS differ only in file naming; both overwrite SSTables in place",
      "LCS forbids overlap in L0 and allows arbitrary overlap within L1 and deeper levels",
    ],
    correctChoice: "STCS merges similarly sized files into larger SSTables; LCS keeps a roughly fixed target file size, so fuller levels tile the keyspace with progressively finer ranges",
    answer: "STCS groups similarly sized files and produces larger SSTables. In LCS, L0 may overlap, while L1+ has no overlap within a level. With target file size roughly fixed and each next level's capacity about 10× larger, a full next level ordinarily needs roughly 10× as many files over the same keyspace, giving finer key-range tiles. These files are not administratively fixed shards; exact overlap varies with data distribution, large partitions, and file-size exceptions.",
    references: [stcsReference, lcsReference],
  },
  {
    id: "sstable-lcs-overlap-rewrite",
    kind: "flashcard",
    topic: "SSTable compaction",
    prompt: "Illustrative LCS ranges:\nL1 incoming: [A,F]\nL2 existing: [A,B] [C,D] [E,F] [G,Z]\n\nThe L1 file moves into L2. What work causes leveled write amplification?",
    choices: [
      "Read and merge the incoming L1 file with the three overlapping L2 files, then write replacement SSTables",
      "Rename the L1 file as L2 without reading any existing L2 data",
      "Edit the three overlapping L2 files in place and keep the L1 file unchanged",
      "Rewrite only [G,Z], because it is the one L2 range that does not overlap",
    ],
    correctChoice: "Read and merge the incoming L1 file with the three overlapping L2 files, then write replacement SSTables",
    answer: "The broader incoming L1 range [A,F] overlaps three narrower L2 ranges. SSTables are immutable and cannot be edited in place, so compaction must read and merge the incoming file with the overlapping target files, then write replacements. The same geometry recurs at deeper boundaries, rewriting older bytes together with new bytes and causing leveled write amplification beyond initial L0 cleanup.",
    references: [storageReference, lcsReference],
  },
];
