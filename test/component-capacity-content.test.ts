import { describe, expect, it } from "vitest";
import { componentCapacityItems } from "../src/component-capacity-content.js";
import { contentBank } from "../src/content.js";
import { chooseStableId } from "../src/scheduler.js";
import { QuizStore } from "../src/store.js";

function item(id: string) {
  const found = contentBank.find((candidate) => candidate.id === id);
  expect(found, `missing ${id}`).toBeDefined();
  return found!;
}

describe("scoped component-capacity anchors", () => {
  it("treats Redis 100k operations as a scoped network-sizing example, not a universal node limit", () => {
    const current = item("component-capacity-redis-network-anchor");

    expect(current.kind).toBe("flashcard");
    expect(current.topic).toBe("Component capacity planning");
    expect(current.prompt).toMatch(/Redis.*100,000 SET.*4 KB.*2026.*defensible/is);
    expect(current.correctChoice).toMatch(/3\.2 Gbit\/s.*network-sizing example.*not.*universal/is);
    expect(current.choices).toContain(current.correctChoice);
    expect(current.answer).toMatch(/100,000 × 4,000 bytes × 8 bits.*3\.2 Gbit\/s/is);
    expect(current.answer).toMatch(/payload.*command mix.*pipelining.*concurrency.*hardware.*network.*replication.*persistence/is);
    expect(current.references).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: expect.stringContaining("accessed 2026-09-03"),
        url: "https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/benchmarks/",
      }),
    ]));
  });

  it("sizes a Redis working set from measured memory, forecast growth, and explicit headroom", () => {
    const current = item("component-capacity-redis-memory-headroom");

    expect(current.prompt).toMatch(/used_memory.*48 GiB.*20%.*growth.*25%.*headroom.*maxmemory.*64 GiB.*replication.*AOF/is);
    expect(current.correctChoice).toMatch(/57\.6 GiB.*72 GiB.*does not fit.*larger node|57\.6 GiB.*72 GiB.*larger node.*does not fit/is);
    expect(current.choices).toContain(current.correctChoice);
    expect(current.answer).toMatch(/48 × 1\.20 = 57\.6 GiB.*57\.6 × 1\.25 = 72 GiB/is);
    expect(current.answer).toMatch(/mem_not_counted_for_evict.*replica.*AOF.*not included.*maxmemory/is);
    expect(current.answer).toMatch(/evicted_keys.*keyspace_hits.*keyspace_misses.*latency.*network/is);
    expect(current.references).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: expect.stringContaining("accessed 2026-09-03"),
        url: "https://redis.io/docs/latest/develop/reference/eviction/",
      }),
    ]));
  });

  it("derives one app server's CPU and in-flight concurrency budgets separately", () => {
    const current = item("component-capacity-app-server-cpu-concurrency");

    expect(current.prompt).toMatch(/event-driven Linux.*8 vCPU.*worker pool.*2 ms.*CPU.*100 ms.*elapsed.*keepalive.*TLS.*50%.*CPU/is);
    expect(current.correctChoice).toMatch(/2,000 requests\/s.*200 in flight.*not.*100,000 connections/is);
    expect(current.choices).toContain(current.correctChoice);
    expect(current.answer).toMatch(/8 × 1,000 ms.*2 ms.*4,000 requests\/s.*2,000 requests\/s/is);
    expect(current.answer).toMatch(/Little's Law.*2,000 × 0\.100.*200/is);
    expect(current.answer).toMatch(/RLIMIT_NOFILE.*nr_open.*file-max.*socket memory.*TLS handshakes.*network.*packet/is);
    expect(current.references).toEqual(expect.arrayContaining([
      expect.objectContaining({ url: "https://docs.kernel.org/admin-guide/sysctl/fs.html" }),
      expect.objectContaining({ url: "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-network-bandwidth.html" }),
    ]));
  });

  it("converts Kafka message rate to byte rate before comparing a named managed-service limit", () => {
    const current = item("component-capacity-kafka-ingress-headroom");

    expect(current.prompt).toMatch(/80,000 messages\/s.*2 KB.*uncompressed.*batch.*acks=all.*AWS-managed replication.*50%.*MSK Serverless.*200 MB\/s/is);
    expect(current.correctChoice).toMatch(/160 MB\/s.*240 MB\/s.*exceeds.*200 MB\/s.*partition.*cannot/is);
    expect(current.choices).toContain(current.correctChoice);
    expect(current.answer).toMatch(/80,000 × 2,000 bytes.*160 MB\/s.*× 1\.5.*240 MB\/s/is);
    expect(current.answer).toMatch(/48 partitions.*5 MB\/s.*cluster.*200 MB\/s/is);
    expect(current.answer).toMatch(/message rate.*byte rate.*batch.*compression.*acknowledg.*replication.*latency/is);
    expect(current.references).toEqual(expect.arrayContaining([
      expect.objectContaining({ url: "https://kafka.apache.org/43/configuration/producer-configs/" }),
      expect.objectContaining({ url: "https://docs.aws.amazon.com/msk/latest/developerguide/limits.html" }),
    ]));
  });

  it("composes offered load into per-component targets before choosing scale", () => {
    const current = item("component-capacity-compose-service-path");

    expect(current.prompt).toMatch(/4,000 HTTP requests\/s.*cache GET.*25%.*PostgreSQL.*20%.*2 KB Kafka.*50% headroom.*3,000.*20,000.*2,000.*10 MB\/s/is);
    expect(current.correctChoice).toMatch(/6,000 app.*6,000 cache.*1,500 database.*2\.4 MB\/s Kafka.*2 app nodes.*one.*capacity unit/is);
    expect(current.choices).toContain(current.correctChoice);
    expect(current.answer).toMatch(/4,000.*4,000.*1,000.*800 messages\/s.*1\.6 MB\/s/is);
    expect(current.answer).toMatch(/× 1\.5.*6,000.*6,000.*1,500.*1,200 messages\/s.*2\.4 MB\/s/is);
    expect(current.answer).toMatch(/capacity.*availability.*three app nodes.*cache replica.*separate/is);
    expect(current.references).toEqual(expect.arrayContaining([
      expect.objectContaining({ url: "https://www.postgresql.org/docs/18/monitoring-stats.html" }),
    ]));
  });

  it("responds to a measured hot Kafka partition instead of scaling every tier", () => {
    const current = item("component-capacity-measure-first-hot-partition");

    expect(current.prompt).toMatch(/app CPU.*35%.*p99.*Redis.*no evictions.*PostgreSQL.*healthy.*Kafka.*30%.*one partition.*70%.*records-lag-max/is);
    expect(current.correctChoice).toMatch(/partition key.*consumer parallelism.*ordering.*before increasing partitions.*do not scale.*app.*cache.*database/is);
    expect(current.choices).toContain(current.correctChoice);
    expect(current.answer).toMatch(/consumer lag.*not.*broker capacity.*hot partition.*key skew/is);
    expect(current.answer).toMatch(/bytes.*request.*queue.*idle.*throttl.*latency.*CPU.*disk.*network/is);
    expect(current.references).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: expect.stringContaining("Apache Kafka 4.3"),
        url: "https://kafka.apache.org/43/operations/monitoring/",
      }),
    ]));

    const ids = componentCapacityItems.map(({ id }) => id);
    expect(ids).toEqual([
      "component-capacity-redis-network-anchor",
      "component-capacity-redis-memory-headroom",
      "component-capacity-app-server-cpu-concurrency",
      "component-capacity-kafka-ingress-headroom",
      "component-capacity-compose-service-path",
      "component-capacity-measure-first-hot-partition",
    ]);
    expect(new Set(ids).size).toBe(6);
    expect(ids.every((id) => contentBank.filter((candidate) => candidate.id === id).length === 1)).toBe(true);
    expect(componentCapacityItems.every((entry) => entry.references?.every(({ label }) => label.includes("accessed 2026-09-03")))).toBe(true);

    const now = new Date("2026-09-03T00:00:00.000Z");
    const reachable = new Set(Array.from({ length: contentBank.length * 2 }, (_, position) =>
      chooseStableId((position * 2) + 1, [], now)));
    expect(ids.every((id) => reachable.has(id))).toBe(true);

    const replay = componentCapacityItems[4]!;
    const store = new QuizStore(":memory:");
    try {
      store.recordAttempt({
        submissionId: "component-capacity-replay",
        stableId: replay.id,
        seed: null,
        prompt: replay.prompt,
        expectedAnswer: replay.answer,
        response: replay.correctChoice!,
        correct: true,
        rating: "good",
        reviewedAt: now.toISOString(),
      });
      expect(store.attemptBySubmission("component-capacity-replay")).toMatchObject({
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
