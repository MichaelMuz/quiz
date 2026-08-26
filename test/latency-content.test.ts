import { describe, expect, it } from "vitest";
import {
  activeGeneratedDefinitions,
  contentBank,
  generateQuestion,
  generatedDefinitions,
  gradeAnswer,
} from "../src/content.js";
import { chooseStableId } from "../src/scheduler.js";

function item(id: string) {
  const found = contentBank.find((candidate) => candidate.id === id);
  expect(found, `missing ${id}`).toBeDefined();
  return found!;
}

const staticIds = [
  "latency-physical-floor-nyc-london",
  "latency-rtt-above-floor",
  "latency-tcp-flights-not-packets",
  "latency-cold-tls13-ttfb",
  "latency-reused-http2-ttfb",
  "latency-tls12-quic-comparison",
  "latency-payload-transfer",
  "latency-dominant-term-diagnosis",
];

describe("physical-to-HTTP latency estimation", () => {
  it("ships one compact, cited cohort with explicit state and derivations", () => {
    expect(contentBank.filter(({ id }) => id.startsWith("latency-")).map(({ id }) => id)).toEqual(staticIds);

    expect(item("latency-physical-floor-nyc-london").answer).toMatch(
      /heuristic.*5,600 km.*200 km\/ms.*28 ms one way.*56 ms RTT.*floor.*not.*prediction/is,
    );
    expect(item("latency-rtt-above-floor").answer).toMatch(
      /path stretch.*routing.*serialization.*switching.*queueing.*processing.*asymmetry/is,
    );
    const tcpAnswer = item("latency-tcp-flights-not-packets").answer;
    for (const concept of [/SYN.*SYN-ACK/is, /final ACK.*third packet/is, /one RTT/is, /carry the request/is, /packet count is not latency/is]) {
      expect(tcpAnswer).toMatch(concept);
    }
    expect(item("latency-cold-tls13-ttfb").answer).toMatch(
      /DNS cached.*new TCP.*full TLS 1\.3.*no resumption.*3 × 60 ms.*20 ms.*200 ms/is,
    );
    expect(item("latency-reused-http2-ttfb").answer).toMatch(
      /established.*HTTP\/2.*one RTT.*60 ms.*multiplexing.*does not remove.*propagation/is,
    );
    const setupComparison = item("latency-tls12-quic-comparison").answer;
    for (const concept of [/TLS 1\.2.*two TLS round trips/is, /QUIC combines.*one round trip/is, /0-RTT.*prior.*replay/is]) {
      expect(setupComparison).toMatch(concept);
    }
    expect(item("latency-payload-transfer").answer).toMatch(
      /10 MB × 8.*100 Mb\/s.*0\.8 s.*800 ms.*180 ms.*980 ms.*ignores/is,
    );
    expect(item("latency-dominant-term-diagnosis").answer).toMatch(
      /8 s server.*dominates.*changing TLS.*tens of milliseconds.*not.*meaningfully/is,
    );

    for (const id of staticIds) {
      const candidate = item(id);
      expect(candidate.topic).toBe("Latency estimation");
      expect(candidate.choices).toContain(candidate.correctChoice);
      expect(candidate.references?.length).toBeGreaterThan(0);
      expect(candidate.references?.every(({ label }) => label.includes("accessed 2026-08-26"))).toBe(true);
    }

    const scheduled = new Set(Array.from({ length: contentBank.length * 2 }, (_, position) =>
      chooseStableId(position, [], new Date("2026-08-26T00:00:00.000Z"))));
    expect(staticIds.every((id) => scheduled.has(id))).toBe(true);
  });

  it("generates deterministic fiber-floor estimates and grades a stated tolerance", () => {
    const definition = generatedDefinitions.find(({ id }) => id === "latency-fiber-floor-estimate");
    expect(definition).toMatchObject({
      active: true,
      generator: "latency-fiber-floor-estimate",
      grader: "latency-ten-percent",
    });
    expect(activeGeneratedDefinitions).toContainEqual(definition);

    const question = generateQuestion(definition!.id, 2);
    expect(generateQuestion(definition!.id, 2)).toEqual(question);
    expect(question.prompt).toMatch(/8,000 km.*one-way.*200 km\/ms.*nearest whole millisecond.*±10%/is);
    expect(question.expectedAnswer).toBe("40");
    expect(question.feedback).toMatch(/8,000 km ÷ 200 km\/ms = 40 ms.*propagation floor.*not.*prediction/is);
    expect(gradeAnswer(question.grader, "36", question.expectedAnswer)).toBe(true);
    expect(gradeAnswer(question.grader, "44", question.expectedAnswer)).toBe(true);
    expect(gradeAnswer(question.grader, "35", question.expectedAnswer)).toBe(false);
    expect(gradeAnswer(question.grader, "45", question.expectedAnswer)).toBe(false);

    const scheduled = new Set(Array.from({ length: activeGeneratedDefinitions.length * 2 }, (_, index) =>
      chooseStableId(index * 2, [], new Date("2026-08-26T00:00:00.000Z"))));
    expect(scheduled).toContain(definition!.id);
  });

  it("includes both exact ten-percent boundaries for every generated target", () => {
    for (const seed of [0, 1, 2, 3]) {
      const question = generateQuestion("latency-fiber-floor-estimate", seed);
      const target = Number(question.expectedAnswer);
      const lowerBoundary = (target * 0.9).toFixed(1);
      const upperBoundary = (target * 1.1).toFixed(1);

      expect(gradeAnswer(question.grader, lowerBoundary, question.expectedAnswer), `${target} ms lower boundary`).toBe(true);
      expect(gradeAnswer(question.grader, upperBoundary, question.expectedAnswer), `${target} ms upper boundary`).toBe(true);
      expect(gradeAnswer(question.grader, String(Number(lowerBoundary) - 0.01), question.expectedAnswer)).toBe(false);
      expect(gradeAnswer(question.grader, String(Number(upperBoundary) + 0.01), question.expectedAnswer)).toBe(false);
    }
  });
});
