export type Rating = "again" | "hard" | "good" | "easy";
export type StaticItem = {
  id: string;
  kind: "flashcard" | "bash";
  topic: string;
  prompt: string;
  answer: string;
  choices?: string[];
  source?: { label: string; url: string };
};
export type GeneratedDefinition = { id: string; generator: string; grader: string };
export type GeneratedQuestion = {
  stableId: string;
  seed: number;
  prompt: string;
  expectedAnswer: string;
  grader: string;
};

export const contentBank: StaticItem[] = [
  {
    id: "systems-latency-orders",
    kind: "flashcard",
    topic: "Systems",
    prompt: "Put these in typical fastest-to-slowest order: L1 cache, DRAM, local SSD, cross-region network, HDD.",
    answer: "L1 cache (about 1 ns), DRAM (about 100 ns), local SSD (about 100 µs), HDD (about 10 ms), then a cross-region round trip (tens to hundreds of ms). The orders of magnitude matter more than exact hardware numbers.",
    source: { label: "Systems Performance: Enterprise and the Cloud", url: "https://www.brendangregg.com/systems-performance-2nd-edition-book.html" },
  },
  {
    id: "protocol-first-visit",
    kind: "flashcard",
    topic: "Protocols",
    prompt: "On a first HTTPS visit by hostname, what broad sequence gets bytes from the site?",
    answer: "Resolve DNS, establish a transport connection, negotiate TLS and authenticate the server, send the HTTP request, then receive the response. HTTP/3 combines transport and cryptographic setup, but the dependencies remain memorable.",
    source: { label: "MDN, How the web works", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works" },
  },
  {
    id: "auth-cookie-v-token",
    kind: "flashcard",
    topic: "Authentication",
    prompt: "What is the core trade-off between an opaque server-side session cookie and a self-contained signed token?",
    answer: "Opaque sessions make revocation and server-side control straightforward, at the cost of a state lookup. Self-contained tokens can be checked without that lookup, but revocation and stale claims become harder. Both still need secure transport, expiry, and careful storage.",
    source: { label: "OWASP Session Management Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html" },
  },
  {
    id: "auth-password-hashing",
    kind: "flashcard",
    topic: "Authentication",
    prompt: "Why store passwords with a slow, salted password hash instead of a fast general-purpose hash?",
    answer: "A unique salt defeats precomputed tables and separates identical passwords. A deliberately expensive password KDF makes each offline guess costly. The server stores the salt and parameters beside the derived hash.",
    source: { label: "OWASP Password Storage Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html" },
  },
  {
    id: "bash-single-quotes",
    kind: "bash",
    topic: "Bash",
    prompt: "name=world\nprintf '%s\\n' 'hello $name'",
    answer: "It prints: hello $name. Single quotes preserve every character inside them, so parameter expansion does not happen.",
    choices: ["hello world", "hello $name", "hello", "It is a syntax error"],
    source: { label: "GNU Bash manual, Quoting", url: "https://www.gnu.org/software/bash/manual/html_node/Quoting.html" },
  },
  {
    id: "bash-pipeline-status",
    kind: "bash",
    topic: "Bash",
    prompt: "false | true\nprintf '%s\\n' \"$?\"",
    answer: "It prints 0. Without pipefail, a pipeline's status is the status of its last command, here true.",
    choices: ["0", "1", "false", "Nothing"],
    source: { label: "GNU Bash manual, Pipelines", url: "https://www.gnu.org/software/bash/manual/html_node/Pipelines.html" },
  },
  {
    id: "bash-redirection-order",
    kind: "bash",
    topic: "Bash",
    prompt: "command >out.txt 2>&1",
    answer: "Standard output is opened on out.txt, then standard error is duplicated from the new standard output. Both streams go to the file. Redirections are processed left to right.",
    choices: ["Only stdout goes to the file", "Only stderr goes to the file", "Both go to the file", "The order is irrelevant"],
    source: { label: "GNU Bash manual, Redirections", url: "https://www.gnu.org/software/bash/manual/html_node/Redirections.html" },
  },
];

export const generatedDefinitions: GeneratedDefinition[] = [
  { id: "mental-arithmetic", generator: "arithmetic", grader: "integer" },
  { id: "decimal-units", generator: "decimal-units", grader: "integer" },
  { id: "binary-units", generator: "binary-units", grader: "integer" },
];

function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const generators: Record<string, (seed: number) => Omit<GeneratedQuestion, "stableId" | "grader">> = {
  arithmetic(seed) {
    const next = random(seed);
    const a = 2 + Math.floor(next() * 98);
    const b = 2 + Math.floor(next() * 18);
    const multiply = next() < 0.45;
    return multiply
      ? { seed, prompt: `${a} × ${b} = ?`, expectedAnswer: String(a * b) }
      : { seed, prompt: `${a + b} − ${b} = ?`, expectedAnswer: String(a) };
  },
  "decimal-units"(seed) {
    const next = random(seed);
    const amount = 1 + Math.floor(next() * 999);
    const unit = next() < 0.5 ? "MB" : "GB";
    const factor = unit === "MB" ? 1_000_000 : 1_000_000_000;
    return { seed, prompt: `${amount} ${unit} = how many bytes? (decimal SI)`, expectedAnswer: String(amount * factor) };
  },
  "binary-units"(seed) {
    const next = random(seed);
    const amount = 1 + Math.floor(next() * 128);
    const unit = next() < 0.5 ? "MiB" : "GiB";
    const factor = unit === "MiB" ? 1_048_576 : 1_073_741_824;
    return { seed, prompt: `${amount} ${unit} = how many bytes? (binary IEC)`, expectedAnswer: String(amount * factor) };
  },
};

const graders: Record<string, (response: string, expected: string) => boolean> = {
  integer: (response, expected) => /^[-+]?\d+$/.test(response.trim()) && BigInt(response.trim()) === BigInt(expected),
  decimal: (response, expected) => {
    const value = response.trim();
    return /^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(value) && Number(value) === Number(expected);
  },
};

export function generateQuestion(id: string, seed: number): GeneratedQuestion {
  const definition = generatedDefinitions.find((candidate) => candidate.id === id);
  if (!definition) throw new Error(`Unknown generated question: ${id}`);
  const generator = generators[definition.generator];
  if (!generator) throw new Error(`Missing generator: ${definition.generator}`);
  return { stableId: id, grader: definition.grader, ...generator(seed) };
}

export function gradeAnswer(grader: string, response: string, expected: string): boolean {
  const registered = graders[grader];
  if (!registered) return false;
  try { return registered(response, expected); } catch { return false; }
}

export function validateContent(items: StaticItem[], definitions: GeneratedDefinition[]): void {
  const ids = new Set<string>();
  for (const item of [...items, ...definitions]) {
    if (ids.has(item.id)) throw new Error(`Duplicate question ID: ${item.id}`);
    ids.add(item.id);
  }
  for (const definition of definitions) {
    const problems = [];
    if (!generators[definition.generator]) problems.push(`generator ${definition.generator}`);
    if (!graders[definition.grader]) problems.push(`grader ${definition.grader}`);
    if (problems.length) throw new Error(`Missing registrations: ${problems.join(", ")}`);
  }
}

validateContent(contentBank, generatedDefinitions);
