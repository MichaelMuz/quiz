import type { GeneratedDefinition, GeneratedQuestion, StaticItem } from "./content.js";

type LatencyGenerator = (seed: number) => Omit<GeneratedQuestion, "stableId" | "grader">;

export const latencyGeneratedDefinitions: GeneratedDefinition[] = [
  {
    id: "latency-fiber-floor-estimate",
    generator: "latency-fiber-floor-estimate",
    grader: "latency-ten-percent",
    active: true,
  },
];

const fiberDistancesKm = [4_000, 5_600, 8_000, 12_000] as const;

export const latencyGenerators: Record<string, LatencyGenerator> = {
  "latency-fiber-floor-estimate"(seed) {
    const distanceKm = fiberDistancesKm[Math.abs(seed) % fiberDistancesKm.length]!;
    const expectedMs = Math.round(distanceKm / 200);
    const distance = distanceKm.toLocaleString("en-US");
    return {
      seed,
      prompt: `A route has ${distance} km of one-way fiber. Using the 200 km/ms heuristic, estimate its one-way propagation floor to the nearest whole millisecond. Answers within ±10% are accepted.`,
      expectedAnswer: String(expectedMs),
      feedback: `${distance} km ÷ 200 km/ms = ${expectedMs} ms one way. This is a propagation floor under the supplied routed-fiber distance, not a complete latency prediction.`,
    };
  },
};

export const latencyGraders: Record<string, (response: string, expected: string) => boolean> = {
  "latency-ten-percent": (response, expected) => {
    const value = response.trim();
    if (!/^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(value)) return false;
    const target = Number(expected);
    const answer = Number(value);
    const tolerance = Math.abs(target) * 0.1;
    const floatingPointSlack = Number.EPSILON * Math.max(1, Math.abs(answer), Math.abs(target));
    return Math.abs(answer - target) <= tolerance + floatingPointSlack;
  },
};

const accessedAt = "accessed 2026-08-26";

const fiberReference = {
  label: `Corning, Outside Fiber Optic Cable Design propagation examples, ${accessedAt}`,
  url: "https://www.corning.com/in-building-networks/worldwide/en/home/applications/local-area-networks/knowledge-center/traditional-lan-knowledge-center/considerations-in-outside-fiber-optic-cable-design.html",
};
const tcpReference = {
  label: `IETF RFC 9293, TCP three-way handshake (August 2022), ${accessedAt}`,
  url: "https://www.rfc-editor.org/rfc/rfc9293.html#section-3.5",
};
const tls13Reference = {
  label: `IETF RFC 8446, TLS 1.3 protocol overview (August 2018), ${accessedAt}`,
  url: "https://www.rfc-editor.org/rfc/rfc8446.html#section-2",
};
const tls12Reference = {
  label: `IETF RFC 7918, TLS 1.2 full-handshake flight cost (August 2016), ${accessedAt}`,
  url: "https://www.rfc-editor.org/rfc/rfc7918.html#section-1",
};
const quicReference = {
  label: `IETF RFC 9001, QUIC 1-RTT and 0-RTT setup (May 2021), ${accessedAt}`,
  url: "https://www.rfc-editor.org/rfc/rfc9001.html#section-2.1",
};
const http2Reference = {
  label: `IETF RFC 9113, HTTP/2 streams and multiplexing (June 2022), ${accessedAt}`,
  url: "https://www.rfc-editor.org/rfc/rfc9113.html#section-2",
};
const http3Reference = {
  label: `IETF RFC 9114, HTTP/3 over QUIC (June 2022), ${accessedAt}`,
  url: "https://www.rfc-editor.org/rfc/rfc9114.html#section-2",
};
const httpReference = {
  label: `IETF RFC 9110, HTTP semantics (June 2022), ${accessedAt}`,
  url: "https://www.rfc-editor.org/rfc/rfc9110.html",
};

export const latencyItems: StaticItem[] = [
  {
    id: "latency-physical-floor-nyc-london",
    kind: "flashcard",
    topic: "Latency estimation",
    prompt: "Estimate the propagation floor for a New York–London path. Assume 5,600 km of one-way routed fiber, light in fiber at about 200,000 km/s, a symmetric route, and no equipment, queueing, or processing delay. Which calculation is defensible?",
    choices: [
      "5,600 ÷ 200 ≈ 28 ms one way, so the RTT floor is ≈56 ms",
      "5,600 ÷ 300 ≈ 19 ms for the complete RTT",
      "5,600 ÷ 200 ≈ 28 ms for the complete RTT",
      "Fiber distance cannot constrain latency without knowing packet size",
    ],
    correctChoice: "5,600 ÷ 200 ≈ 28 ms one way, so the RTT floor is ≈56 ms",
    answer: "Heuristic, not an invariant: 200,000 km/s is about 200 km/ms in ordinary fiber. With the supplied 5,600 km one-way routed distance, 5,600 km ÷ 200 km/ms = 28 ms one way, then 2 × 28 = 56 ms RTT. This is a physical floor, not a prediction: the route length is assumed, and real networks add path stretch, equipment, queueing, and endpoint work. Corning's published 550 km examples imply roughly 5 µs/km and also show that cable construction can lengthen the actual fiber.",
    references: [fiberReference],
  },
  {
    id: "latency-rtt-above-floor",
    kind: "flashcard",
    topic: "Latency estimation",
    prompt: "A path's symmetric-fiber floor is 56 ms RTT, but repeated unloaded pings are about 75 ms. Which explanation best preserves the meaning of the floor? Assume no packet loss and negligible endpoint application work.",
    choices: [
      "The excess can come from path stretch, routing, serialization, switching, queueing, processing, and path asymmetry; the floor was never a complete RTT prediction",
      "The fiber estimate is disproved because a physical floor must equal every measured RTT",
      "The 19 ms excess must all be server application processing",
      "Packet size alone determines propagation speed through the fiber",
    ],
    correctChoice: "The excess can come from path stretch, routing, serialization, switching, queueing, processing, and path asymmetry; the floor was never a complete RTT prediction",
    answer: "The fiber calculation isolates propagation under a stated route-length assumption. A real RTT can be higher because path stretch and routing make the network path longer than a map line, while each direction can add serialization, switching, queueing, and processing. Forward and reverse path asymmetry can change the total too. Treat the floor as a lower bound for diagnosis, not a promise that measurements should equal it.",
    references: [fiberReference],
  },
  {
    id: "latency-tcp-flights-not-packets",
    kind: "flashcard",
    topic: "Latency estimation",
    prompt: "A new TCP connection uses SYN → SYN-ACK → ACK. On a 60 ms RTT path with no loss, how much request latency does the handshake add before ordinary application data, and why is “three packets = three RTTs” wrong? Assume no TCP Fast Open.",
    choices: [
      "About one RTT; latency follows dependent flights, and the third packet can carry the request",
      "Three RTTs; every packet always consumes a separate round trip",
      "Half an RTT; SYN and SYN-ACK travel simultaneously",
      "Zero RTT; TCP connection state is established before the SYN is sent",
    ],
    correctChoice: "About one RTT; latency follows dependent flights, and the third packet can carry the request",
    answer: "The SYN travels to the server and the SYN-ACK returns, one RTT. The final ACK is the third packet, completes the three-way handshake, and can commonly carry the request's next client flight, such as a TLS ClientHello. Packet count is not latency: dependent flights determine the critical path, and packets moving in opposite directions can be parts of the same round trip.",
    references: [tcpReference],
  },
  {
    id: "latency-cold-tls13-ttfb",
    kind: "flashcard",
    topic: "Latency estimation",
    prompt: "Estimate time to first response byte for a cold HTTPS request. Assume DNS is cached; RTT = 60 ms; a new TCP connection; a full TLS 1.3 handshake with no resumption, 0-RTT, TCP Fast Open, loss, or retries; a tiny request/response; and 20 ms server processing. Which budget is right?",
    choices: [
      "TCP 1 RTT + TLS 1.3 1 RTT + HTTP request/first byte 1 RTT + 20 ms = about 200 ms",
      "TCP's three packets + TLS's messages + HTTP = at least 8 RTTs",
      "TLS 1.3 removes transport and propagation, so about 20 ms",
      "Payload size alone is enough to compute TTFB",
    ],
    correctChoice: "TCP 1 RTT + TLS 1.3 1 RTT + HTTP request/first byte 1 RTT + 20 ms = about 200 ms",
    answer: "With DNS cached, new TCP, a full TLS 1.3 handshake, and no resumption, the estimate is 3 × 60 ms + 20 ms = 200 ms: one RTT for TCP, one RTT for TLS before client application data, then one RTT for the request and first response byte, plus server work. This is a no-loss flight budget. Connection reuse, resumption, certificate work, congestion control, intermediaries, and application dependencies can change it.",
    references: [tcpReference, tls13Reference, httpReference],
  },
  {
    id: "latency-reused-http2-ttfb",
    kind: "flashcard",
    topic: "Latency estimation",
    prompt: "Re-estimate the same tiny request when DNS is cached and an established, authenticated HTTP/2 connection is idle and usable. RTT = 60 ms, server processing is negligible, and there is no loss. What remains on the critical path?",
    choices: [
      "About one RTT for request and first response byte; reuse removes setup, while multiplexing does not remove propagation",
      "Zero time because HTTP/2 multiplexing makes the network local",
      "Three RTTs because every HTTP/2 stream repeats TCP and TLS setup",
      "Two TLS round trips because HTTP/2 requires TLS 1.2 for every request",
    ],
    correctChoice: "About one RTT for request and first response byte; reuse removes setup, while multiplexing does not remove propagation",
    answer: "With an established, authenticated HTTP/2 connection, there is no new TCP or TLS handshake in this budget. A request still has to reach the server and the first response byte has to return, about one RTT = 60 ms here, plus any server work. HTTP/2 multiplexing lets concurrent exchanges share the connection; it does not remove propagation or guarantee zero queueing behind transport loss.",
    references: [http2Reference],
  },
  {
    id: "latency-tls12-quic-comparison",
    kind: "flashcard",
    topic: "Latency estimation",
    prompt: "For client-first HTTP with cached DNS and no loss, which bounded setup comparison is accurate? Contrast new TCP + full TLS 1.2 without False Start, new QUIC with a full handshake, and QUIC 0-RTT. Do not count the later request/response RTT unless it is sent as early data.",
    choices: [
      "TCP adds 1 RTT and full TLS 1.2 adds 2 more; new QUIC combines transport and crypto in about 1 RTT; QUIC 0-RTT needs prior server state and early data can be replayed",
      "TLS 1.2, TLS 1.3, and QUIC always have identical setup flights",
      "New QUIC is 0-RTT without prior communication, and 0-RTT data cannot be replayed",
      "TLS 1.2 uses fewer setup flights than TLS 1.3 because it has more handshake messages",
    ],
    correctChoice: "TCP adds 1 RTT and full TLS 1.2 adds 2 more; new QUIC combines transport and crypto in about 1 RTT; QUIC 0-RTT needs prior server state and early data can be replayed",
    answer: "Bounded comparison: ordinary new TCP costs about one RTT before TLS. A full TLS 1.2 handshake without False Start adds two TLS round trips before client application data. QUIC combines transport and cryptographic establishment, so a full new QUIC connection is generally secured in one round trip. QUIC 0-RTT can send application data immediately only using prior server information; that early data has weaker replay guarantees and is unsuitable for non-idempotent effects without safeguards. These are setup costs, not total page-load predictions.",
    references: [tls12Reference, tls13Reference, quicReference, http3Reference],
  },
  {
    id: "latency-payload-transfer",
    kind: "flashcard",
    topic: "Latency estimation",
    prompt: "A response has 10 MB of content, using decimal MB, and the path sustains 100 Mb/s. If TTFB is 180 ms, what is the simplest full-transfer estimate? Assume throughput is already steady and ignore framing, congestion ramp-up, retransmission, and compression.",
    choices: [
      "10 MB × 8 ÷ 100 Mb/s = 0.8 s, then add 0.18 s TTFB: about 0.98 s",
      "10 MB ÷ 100 Mb/s = 0.1 s, so about 0.28 s total",
      "100 Mb/s ÷ 10 MB = 10 s, so about 10.18 s total",
      "RTT alone determines transfer time, so the payload adds nothing",
    ],
    correctChoice: "10 MB × 8 ÷ 100 Mb/s = 0.8 s, then add 0.18 s TTFB: about 0.98 s",
    answer: "Convert bytes to bits before dividing by bit-rate: 10 MB × 8 = 80 Mb; 80 Mb ÷ 100 Mb/s = 0.8 s = 800 ms. Add the supplied 180 ms TTFB for about 980 ms total. This deliberately ignores protocol overhead, slow start or other congestion-control ramp-up, competing traffic, retransmissions, compression, and application rendering.",
    references: [httpReference],
  },
  {
    id: "latency-dominant-term-diagnosis",
    kind: "flashcard",
    topic: "Latency estimation",
    prompt: "A request takes 8.25 s. Measurement shows 60 ms RTT, a reused HTTP/2 connection, 8.0 s server processing, 40 ms transfer after first byte, and the remainder in client work. Which optimization follows from the latency budget?",
    choices: [
      "Server processing dominates; investigate that 8 s before changing transport setup",
      "Switch TLS versions first because handshake setup must dominate every HTTPS request",
      "Reduce fiber propagation first because 60 ms is larger than 8 s",
      "Add HTTP/2 multiplexing even though the measured connection is already reused HTTP/2",
    ],
    correctChoice: "Server processing dominates; investigate that 8 s before changing transport setup",
    answer: "The measured 8 s server term dominates the 8.25 s total. Changing TLS setup on an already reused connection might save zero or only tens of milliseconds, not meaningfully alter an eight-second wait. A latency budget is useful because it ranks terms before optimization; re-measure after fixing the dominant term because the next bottleneck can change.",
    references: [http2Reference, httpReference],
  },
];
