import type { StaticItem } from "./content.js";

const accessedAt = "accessed 2026-09-01";
const pgbenchReference = {
  label: `PostgreSQL 18, pgbench, ${accessedAt}`,
  url: "https://www.postgresql.org/docs/18/pgbench.html",
};
const walReference = {
  label: `PostgreSQL 18, Write-Ahead Logging, ${accessedAt}`,
  url: "https://www.postgresql.org/docs/18/wal-intro.html",
};
const alloyDbBenchmarkReference = {
  label: `Google Cloud AlloyDB for PostgreSQL OLTP benchmark guide, ${accessedAt}`,
  url: "https://docs.cloud.google.com/alloydb/docs/benchmark-oltp-performance-alloydb",
};
const monitoringReference = {
  label: `PostgreSQL 18, cumulative statistics and wait events, ${accessedAt}`,
  url: "https://www.postgresql.org/docs/18/monitoring-stats.html",
};
const warmStandbyReference = {
  label: `PostgreSQL 18, warm standby and read-only hot standby, ${accessedAt}`,
  url: "https://www.postgresql.org/docs/18/warm-standby.html",
};
const connectionReference = {
  label: `PostgreSQL 18, connection settings and resource costs, ${accessedAt}`,
  url: "https://www.postgresql.org/docs/18/runtime-config-connection.html",
};

export const postgresqlCapacityItems: StaticItem[] = [
  {
    id: "postgres-capacity-compose-operation-rate",
    kind: "flashcard",
    topic: "PostgreSQL capacity planning",
    prompt: "A service peaks at 2,000 application requests/s. Every request performs 4 simple indexed point reads; 25% also perform one synchronous durable row update. Assume small rows, a working set warm in PostgreSQL and OS caches, pooled connections, low contention, a local network, one capable modern 16-vCPU server, a p95 latency target of 20 ms, and 50% safety headroom. What separate database operation rates are offered, and what rates should the test sustain with headroom?",
    choices: [
      "8,000 reads/s and 500 writes/s offered; test for 12,000 reads/s and 750 writes/s with headroom",
      "8,000 reads/s and 2,000 writes/s offered; test for 12,000 reads/s and 3,000 writes/s with headroom",
      "2,000 reads/s and 500 writes/s offered; test for 3,000 reads/s and 750 writes/s with headroom",
      "10,000 combined operations/s offered; test one undifferentiated 15,000 operations/s target",
    ],
    correctChoice: "8,000 reads/s and 500 writes/s offered; test for 12,000 reads/s and 750 writes/s with headroom",
    answer: "2,000 × 4 = 8,000 database read queries/s. The write path occurs on one quarter of requests, so 2,000 × 25% = 500 database write operations/s. Applying 50% headroom means × 1.5: test for 12,000 reads/s and 750 writes/s while meeting the latency target. Keep the rates separate: a warm indexed read and a synchronous durable write are not equivalent units of database work, even when both are counted as operations.",
    references: [pgbenchReference, walReference],
  },
  {
    id: "postgres-capacity-classify-favorable-read",
    kind: "flashcard",
    topic: "PostgreSQL capacity planning",
    prompt: "A candidate single-node workload offers 20,000 simple indexed point reads/s and 400 synchronous durable row updates/s. Assume small rows, a working set warm in PostgreSQL and OS caches, pooled connections, low contention, a local network, one capable modern 16-vCPU server, a p95 latency target of 20 ms, and 50% safety headroom. What is the sound planning classification?",
    choices: [
      "Plausible tens-of-thousands read territory; benchmark the exact read and write paths separately at 30,000 reads/s and 600 writes/s",
      "Guaranteed safe because warm indexed reads always sustain at least 100,000 queries/s on PostgreSQL",
      "Impossible on one PostgreSQL node because 10,000 operations/s is a hard single-node ceiling",
      "Combine reads and writes into one TPS number, then add replicas to multiply both capacities",
    ],
    correctChoice: "Plausible tens-of-thousands read territory; benchmark the exact read and write paths separately at 30,000 reads/s and 600 writes/s",
    answer: "With 50% headroom, 20,000 × 1.5 = 30,000 read queries/s and 400 × 1.5 = 600 write operations/s. This is plausible tens-of-thousands read territory under the stated favorable assumptions, not a promise. For scale context, Google's AlloyDB guide reports 467,583 select-only TPS on a specific 64-vCPU, 220 GB scale-factor-15,000, 256-client, 3,900-second benchmark. Each transaction in that select-only script is one point read, but the managed hardware, cache state, concurrency, protocol, and SQL shape make that result a specific benchmark, not a capacity promise for this server. Thousands of operations/s is an ordinary planning magnitude; tens of thousands of favorable reads can be plausible; 100,000 reads/s is workload- and benchmark-specific territory, not a universal PostgreSQL limit or ceiling.",
    references: [pgbenchReference, alloyDbBenchmarkReference],
  },
  {
    id: "postgres-capacity-diagnose-before-scaling",
    kind: "flashcard",
    topic: "PostgreSQL capacity planning",
    prompt: "A forecast calls for 100,000 database read queries/s and 5,000 synchronous durable write operations/s before headroom. The read mix is 80% indexed point reads and 20% cache-missing scans and complex joins returning large rows; writes update hot rows. Assume a mixed cache state, unpooled connections, high lock contention, a cross-region network, one capable modern 16-vCPU server, a p99 latency target of 10 ms, and 50% safety headroom. What is the sound next step?",
    choices: [
      "Benchmark the exact workload at 150,000 reads/s and 7,500 writes/s; use replicas only for eligible reads, not primary writes, and discuss sharding only if measurements show it is needed",
      "Treat 100,000 reads/s as a universal PostgreSQL ceiling and shard immediately without measuring",
      "Add one read replica because it doubles both read capacity and primary write throughput",
      "Apply the warm point-read anchor unchanged because all SQL queries consume comparable resources",
    ],
    correctChoice: "Benchmark the exact workload at 150,000 reads/s and 7,500 writes/s; use replicas only for eligible reads, not primary writes, and discuss sharding only if measurements show it is needed",
    answer: "This scenario removes most assumptions behind the favorable point-read anchor and adds a strict tail-latency target. Treat 100,000 reads/s as benchmark- and workload-specific territory, not a ceiling. Reproduce the real SQL, data size and skew, transaction boundaries, cache state, concurrency, and network path, then test 150,000 read queries/s and 7,500 write operations/s for the requested 50% headroom. Measure CPU saturation, cache hit behavior and I/O latency, WAL flush and commit waits, lock waits, connection pressure, and p99 tail latency. Pooling may reduce connection overhead, but it cannot erase expensive SQL or contention. Read replicas can serve eligible stale-tolerant reads; they do not multiply the primary write throughput because writes still enter through the primary and replicate outward. Discuss replicas or sharding after workload characterization and measurements identify the limiting path, not from one memorized rate.",
    references: [pgbenchReference, monitoringReference, warmStandbyReference, connectionReference],
  },
];
