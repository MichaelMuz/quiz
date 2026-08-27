import type { GeneratedDefinition, GeneratedQuestion, StaticItem } from "./content.js";

type SstableGenerator = (seed: number) => Omit<GeneratedQuestion, "stableId" | "grader">;

const accessedAt = "accessed 2026-08-27";
const overviewReference = {
  label: `Apache Cassandra compaction overview, ${accessedAt}`,
  url: "https://cassandra.apache.org/doc/latest/cassandra/managing/operating/compaction/overview.html",
};
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
const twcsReference = {
  label: `Apache Cassandra Time Window Compaction Strategy, ${accessedAt}`,
  url: "https://cassandra.apache.org/doc/latest/cassandra/managing/operating/compaction/twcs.html",
};
const writeAmplificationReference = {
  label: `RocksDB tuning guide, write amplification, ${accessedAt}`,
  url: "https://github.com/facebook/rocksdb/wiki/RocksDB-Tuning-Guide#write-amplification",
};
export const sstableItems: StaticItem[] = [
  {
    id: "sstable-immutable-updates",
    kind: "flashcard",
    topic: "SSTable compaction",
    prompt: "An update targets a value already stored in an immutable SSTable. What is written, and why can later reads fan out?",
    choices: [
      "A new timestamped version is written; the old version remains until compaction",
      "The bytes in the existing SSTable are overwritten in place",
      "Only an in-memory pointer changes, so disk reads never fan out",
      "The entire table is immediately compacted synchronously",
    ],
    correctChoice: "A new timestamped version is written; the old version remains until compaction",
    answer: "A new timestamped version is written, while the old version in the immutable SSTable is not overwritten. As versions accumulate, a read may need to consult multiple SSTables and reconcile timestamps to assemble the current row.",
    references: [overviewReference, storageReference],
  },
  {
    id: "sstable-compaction-purpose",
    kind: "flashcard",
    topic: "SSTable compaction",
    prompt: "What does an SSTable compaction actually do?",
    choices: [
      "Merge selected sorted SSTables into new SSTables and retire obsolete input data when safe",
      "Sort every read result without writing new files",
      "Overwrite updated bytes in each immutable input file",
      "Delete every tombstone as soon as it is observed",
    ],
    correctChoice: "Merge selected sorted SSTables into new SSTables and retire obsolete input data when safe",
    answer: "Compaction performs a merge over selected sorted SSTables and writes a new SSTable. It keeps the newest timestamped column versions and can discard obsolete versions plus tombstones that are eligible to be purged. Tombstones are not all removed immediately; Cassandra's safety and grace-period conditions still apply.",
    references: [overviewReference],
  },
  {
    id: "sstable-write-amplification-tradeoff",
    kind: "flashcard",
    topic: "SSTable compaction",
    prompt: "In an LSM/SSTable engine, what is write amplification, and how does it differ from read amplification?",
    choices: [
      "Physical bytes written divided by logical bytes written; read amplification is extra structures consulted per read",
      "Logical bytes divided by physical bytes; read amplification is query latency only",
      "The number of replicas; read amplification is the consistency level",
      "The compression ratio; read amplification is the cache hit rate",
    ],
    correctChoice: "Physical bytes written divided by logical bytes written; read amplification is extra structures consulted per read",
    answer: "Write amplification is the ratio of physical bytes written to storage to logical bytes written to the database. Compaction causes it by reading and rewriting existing SSTable data. Read amplification is different: it concerns how many SSTables or other structures a read must consult. Compaction can spend extra writes to reduce that read fan-out.",
    references: [storageReference, writeAmplificationReference],
  },
  {
    id: "sstable-stcs",
    kind: "flashcard",
    topic: "SSTable compaction",
    prompt: "What boundary does Size Tiered Compaction Strategy (STCS) use to choose SSTables, and what read-side consequence can remain?",
    choices: [
      "Similar file size; versions of a row can remain spread across many SSTables",
      "Non-overlapping key ranges per level; one SSTable per level",
      "Wall-clock windows; old windows never mix with new ones",
      "Replica ownership; every replica compacts at once",
    ],
    correctChoice: "Similar file size; versions of a row can remain spread across many SSTables",
    answer: "STCS groups similar-sized SSTables and merges them into one larger SSTable. Because grouping is by size rather than row or key range, versions of a row can remain spread across many SSTables, increasing read work. Its low write-oriented pressure comes with less predictable read and space behavior. Current Cassandra docs recommend UCS for most new workloads.",
    references: [stcsReference],
  },
  {
    id: "sstable-lcs",
    kind: "flashcard",
    topic: "SSTable compaction",
    prompt: "Which invariant makes Leveled Compaction Strategy (LCS) attractive for read-heavy workloads?",
    choices: [
      "At L1 and above, SSTables in the same level do not overlap by key range",
      "Every level contains exactly one SSTable",
      "L0 SSTables never overlap",
      "An SSTable is never rewritten after entering a level",
    ],
    correctChoice: "At L1 and above, SSTables in the same level do not overlap by key range",
    answer: "L0 SSTables may overlap. At L1 and above, SSTables in the same level are non-overlapping by key range, so a point read needs at most one SSTable per level. Maintaining that invariant requires merging overlaps into the next level, which raises compaction I/O and CPU compared with a write-oriented strategy. Current Cassandra docs recommend UCS for most new workloads.",
    references: [lcsReference],
  },
  {
    id: "sstable-twcs",
    kind: "flashcard",
    topic: "SSTable compaction",
    prompt: "Why does Time Window Compaction Strategy (TWCS) fit mostly immutable TTL time-series data, and what breaks its clean lifecycle?",
    choices: [
      "It isolates time windows so fully expired SSTables can drop; out-of-order writes can mix old and new data",
      "It keeps all timestamps in one SSTable; sequential writes cannot expire",
      "It levels every key range; duplicate timestamps are rejected",
      "It removes TTLs during the write path; late data is silently discarded",
    ],
    correctChoice: "It isolates time windows so fully expired SSTables can drop; out-of-order writes can mix old and new data",
    answer: "TWCS groups SSTables by time window and uses STCS within the active window. Completed windows can later become fully expired SSTables and be dropped efficiently. Out-of-order writes or read repair can commingle old data with the current window, preventing that clean expiration behavior. Current Cassandra docs recommend UCS for most new workloads.",
    references: [twcsReference],
  },
];

export const sstableGeneratedDefinitions: GeneratedDefinition[] = [
  { id: "sstable-write-amplification-ratio", generator: "sstable-write-amplification-ratio", grader: "integer", active: true },
];

const ratioCases = [
  { logical: 4, physical: 12 },
  { logical: 5, physical: 20 },
  { logical: 8, physical: 40 },
  { logical: 10, physical: 60 },
] as const;

export const sstableGenerators: Record<string, SstableGenerator> = {
  "sstable-write-amplification-ratio"(seed) {
    const current = ratioCases[Math.abs(seed) % ratioCases.length]!;
    const ratio = current.physical / current.logical;
    return {
      seed,
      prompt: `An SSTable engine accepts ${current.logical} GiB of logical writes and writes ${current.physical} GiB total to storage, including compaction. What is its write amplification ratio?`,
      expectedAnswer: String(ratio),
      feedback: `${current.physical} GiB ÷ ${current.logical} GiB = ${ratio}× write amplification. Physical writes include the logical data plus bytes rewritten by compaction and other storage-engine work.`,
    };
  },
};
