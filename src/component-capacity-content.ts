import type { StaticItem } from "./content.js";

const accessedAt = "accessed 2026-09-03";
const redisBenchmarkReference = {
  label: `Redis Open Source benchmark guidance, ${accessedAt}`,
  url: "https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/benchmarks/",
};
const redisEvictionReference = {
  label: `Redis Open Source key eviction and cache signals, ${accessedAt}`,
  url: "https://redis.io/docs/latest/develop/reference/eviction/",
};
const linuxFileLimitReference = {
  label: `Linux kernel file-handle limits, ${accessedAt}`,
  url: "https://docs.kernel.org/admin-guide/sysctl/fs.html",
};
const linuxRlimitReference = {
  label: `Linux man-pages RLIMIT_NOFILE, ${accessedAt}`,
  url: "https://man7.org/linux/man-pages/man2/getrlimit.2.html",
};
const ec2NetworkReference = {
  label: `Amazon EC2 instance network bandwidth, ${accessedAt}`,
  url: "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-network-bandwidth.html",
};
const kafkaProducerReference = {
  label: `Apache Kafka 4.3 producer configuration, ${accessedAt}`,
  url: "https://kafka.apache.org/43/configuration/producer-configs/",
};
const mskQuotaReference = {
  label: `Amazon MSK quotas, ${accessedAt}`,
  url: "https://docs.aws.amazon.com/msk/latest/developerguide/limits.html",
};
const postgresMonitoringReference = {
  label: `PostgreSQL 18 cumulative statistics and wait events, ${accessedAt}`,
  url: "https://www.postgresql.org/docs/18/monitoring-stats.html",
};
const kafkaMonitoringReference = {
  label: `Apache Kafka 4.3 monitoring metrics, ${accessedAt}`,
  url: "https://kafka.apache.org/43/operations/monitoring/",
};

export const componentCapacityItems: StaticItem[] = [
  {
    id: "component-capacity-redis-network-anchor",
    kind: "flashcard",
    topic: "Component capacity planning",
    prompt: "Redis documentation gives 100,000 SET operations/s with 4 KB values as a 2026 network-sizing example. Which interpretation is defensible?",
    choices: [
      "The payload alone is 3.2 Gbit/s; this is a scoped network-sizing example, not a universal Redis node limit",
      "Every Redis node guarantees at least 100,000 operations/s with 1 ms latency",
      "100,000 operations/s means 100,000 simultaneous client connections",
      "The example proves a 1 Gbit/s link has ample room for protocol, replies, and replication",
    ],
    correctChoice: "The payload alone is 3.2 Gbit/s; this is a scoped network-sizing example, not a universal Redis node limit",
    answer: "Using the guide's decimal sizing, 100,000 × 4,000 bytes × 8 bits = 3.2 Gbit/s of value payload before keys, protocol framing, replies, and replication traffic. Redis presents this to show that network can become the bottleneck. It does not establish a node ceiling or latency promise. A reproducible throughput claim must also state payload and key sizes, command mix, pipelining, client concurrency, hardware, network, replication, persistence, and software version.",
    references: [redisBenchmarkReference],
  },
  {
    id: "component-capacity-redis-memory-headroom",
    kind: "flashcard",
    topic: "Component capacity planning",
    prompt: "Redis INFO reports used_memory = 48 GiB. Plan for 20% working-set growth, then 25% safety headroom. maxmemory is 64 GiB; replication and AOF are enabled. What follows?",
    choices: [
      "Forecast 57.6 GiB and plan 72 GiB; it does not fit, so reduce retained data or use a larger node before considering sharding",
      "Forecast 57.6 GiB; it fits because safety headroom is only applied after maxmemory is exceeded",
      "Plan 60 GiB because growth and headroom percentages should be added to 48 GiB",
      "Add a replica because replication increases the primary's maxmemory capacity",
    ],
    correctChoice: "Forecast 57.6 GiB and plan 72 GiB; it does not fit, so reduce retained data or use a larger node before considering sharding",
    answer: "48 × 1.20 = 57.6 GiB after forecast growth; 57.6 × 1.25 = 72 GiB with the requested headroom. That exceeds maxmemory = 64 GiB. First validate retention and TTLs, or move vertically to a node with enough RAM; discuss sharding only if the measured working set or throughput cannot fit a suitable node. Replication is for availability and creates another copy, not more primary capacity. Redis reports mem_not_counted_for_evict for replica and AOF buffers that are not included in the maxmemory eviction comparison, so host RAM needs room beyond maxmemory. During validation, watch evicted_keys, keyspace_hits, keyspace_misses, latency percentiles, memory/RSS, and network saturation rather than treating one utilization percentage as a law.",
    references: [redisEvictionReference],
  },
  {
    id: "component-capacity-app-server-cpu-concurrency",
    kind: "flashcard",
    topic: "Component capacity planning",
    prompt: "An event-driven Linux HTTP app server has an 8 vCPU worker pool. A representative request uses 2 ms of CPU and 100 ms elapsed time while awaiting a downstream service. Connections use keepalive after TLS setup. At a 50% CPU budget, what are the request-rate and average in-flight anchors?",
    choices: [
      "2,000 requests/s and about 200 in flight, not 100,000 connections",
      "4,000 requests/s and about 400 in flight because safety headroom does not apply to CPU",
      "100,000 requests/s because event-driven servers can hold 100,000 connections",
      "80 requests/s because elapsed time, not measured CPU time, must be divided into every vCPU",
    ],
    correctChoice: "2,000 requests/s and about 200 in flight, not 100,000 connections",
    answer: "The worker pool has 8 × 1,000 ms = 8,000 CPU-ms/s. At 2 ms of CPU per request, saturation is 4,000 requests/s; a 50% CPU operating budget gives 2,000 requests/s. Little's Law then gives 2,000 × 0.100 s = about 200 requests in flight on average. Open or idle keepalive connections are a separate quantity. Validate the process RLIMIT_NOFILE, kernel nr_open and system-wide file-max, per-connection socket memory, TLS handshakes for new connections, response bytes against baseline and burst network bandwidth, and packet-rate or connection-tracking allowances. The derived rate is scoped to this measured code path, worker pool, latency target, and operating budget, not a universal server number.",
    references: [linuxFileLimitReference, linuxRlimitReference, ec2NetworkReference],
  },
  {
    id: "component-capacity-kafka-ingress-headroom",
    kind: "flashcard",
    topic: "Component capacity planning",
    prompt: "A Kafka producer offers 80,000 messages/s averaging 2 KB uncompressed with compression.type=none. It uses batching, acks=all, AWS-managed replication, no cross-region replicator, and needs 50% headroom. The selected 2026 MSK Serverless cluster allows 200 MB/s ingress and 5 MB/s per partition. Does it fit?",
    choices: [
      "160 MB/s offered and 240 MB/s with headroom exceeds 200 MB/s; partitioning cannot raise the cluster ceiling",
      "80 MB/s offered and 120 MB/s with headroom fits because one message is one kilobyte",
      "160 MB/s offered fits because headroom applies only to message count, not byte rate",
      "It fits if there are 48 partitions because partitioning always removes the cluster ingress limit",
    ],
    correctChoice: "160 MB/s offered and 240 MB/s with headroom exceeds 200 MB/s; partitioning cannot raise the cluster ceiling",
    answer: "Using decimal service units, 80,000 × 2,000 bytes = 160 MB/s offered; × 1.5 for headroom = 240 MB/s. That exceeds this named MSK Serverless cluster's 200 MB/s ingress quota. The target would need at least 48 partitions at the separate 5 MB/s per-partition quota with even traffic, but the cluster still cannot exceed its 200 MB/s ingress ceiling. Select a provisioned topology or otherwise change the capacity plan, then load-test the real records. Message rate and byte rate are different dimensions; record-size distribution, partition-key skew, producer batch size and linger, compression, acknowledgements, AWS-managed replication, broker disk/network/CPU, consumers, and latency target all affect observed capacity.",
    references: [kafkaProducerReference, mskQuotaReference],
  },
  {
    id: "component-capacity-compose-service-path",
    kind: "flashcard",
    topic: "Component capacity planning",
    prompt: "At 4,000 HTTP requests/s: each request makes one cache GET; a 25% miss causes one PostgreSQL read; 20% emit one 2 KB Kafka message (2,000 bytes). Add 50% headroom. Tested capacity: 3,000 requests/s per app node; 20,000 GET/s per cache shard; 2,000 reads/s per database primary; 10 MB/s for the Kafka tier. What is the minimum capacity plan before availability?",
    choices: [
      "Target 6,000 app requests/s, 6,000 cache GET/s, 1,500 database reads/s, and 2.4 MB/s Kafka; use 2 app nodes and one tested capacity unit for each data component",
      "Target 4,000 at every component and use one of each because hit rate does not alter downstream load",
      "Target 6,000 at every component and shard Redis, PostgreSQL, and Kafka equally",
      "Use 3 app nodes plus replicas everywhere because capacity headroom and availability are the same calculation",
    ],
    correctChoice: "Target 6,000 app requests/s, 6,000 cache GET/s, 1,500 database reads/s, and 2.4 MB/s Kafka; use 2 app nodes and one tested capacity unit for each data component",
    answer: "Offered load is 4,000 app requests/s, 4,000 cache GET/s, 1,000 database reads/s, and 800 messages/s × 2 KB = 1.6 MB/s Kafka ingress. Applying × 1.5 gives targets of 6,000 app requests/s, 6,000 cache GET/s, 1,500 database reads/s, and 1,200 messages/s = 2.4 MB/s Kafka ingress.\n\nTwo tested app nodes meet the capacity target; one tested cache shard, database primary, and Kafka tier meet their targets.\n\nThis is capacity arithmetic, not availability design. To survive one app-node loss while retaining the full target would require three app nodes. A cache replica or database standby may be required for availability but remains a separate decision, and neither automatically adds primary write capacity.",
    references: [redisBenchmarkReference, postgresMonitoringReference, kafkaProducerReference],
  },
  {
    id: "component-capacity-measure-first-hot-partition",
    kind: "flashcard",
    topic: "Component capacity planning",
    prompt: "At peak, app CPU is 35% with p99 latency on target; Redis has no evictions and stays below memory/network plans; PostgreSQL latency and waits are healthy. Kafka ingress is 30% of the tier limit, but one partition receives 70% of bytes and its per-partition records-lag drives the consumer's records-lag-max higher. What should you do next?",
    choices: [
      "Inspect the partition key and consumer parallelism; protect ordering requirements before increasing partitions, and do not scale the app, cache, or database",
      "Double every tier because any consumer lag means the entire architecture is at capacity",
      "Add app servers because HTTP concurrency always causes Kafka consumer lag",
      "Shard Redis because a hot Kafka partition proves the cache keyspace is too large",
    ],
    correctChoice: "Inspect the partition key and consumer parallelism; protect ordering requirements before increasing partitions, and do not scale the app, cache, or database",
    answer: "Consumer lag is backlog, not proof of exhausted broker capacity. Low aggregate ingress plus a hot partition points first to key skew, per-partition throughput, or insufficient consumer parallelism for that partition. Confirm the consumer is healthy, identify the key distribution and ordering boundary, then repair the mapping or carefully increase partitions and consumers if semantics allow. Do not scale unrelated tiers whose measured budgets are healthy. For Kafka, inspect bytes in/out, request rate and size, request queue time, network/request-handler idle percentages, throttle-time, latency, CPU, disk, and network balance across brokers and partitions. Keep the Redis eviction/hit-rate and PostgreSQL wait/latency signals in the same evidence chain, but do not make them suspects without contrary measurements.",
    references: [kafkaMonitoringReference, redisEvictionReference, postgresMonitoringReference],
  },
];
