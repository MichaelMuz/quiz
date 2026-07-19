import { commandExercises } from "./command-content.js";

export { commandConcepts, commandExerciseId, commandExercises } from "./command-content.js";
export type { CommandConcept } from "./command-content.js";

export type Rating = "again" | "hard" | "good" | "easy";
export type CommandName = "fd" | "sed" | "xargs";
export type CommandExerciseMode = "definition" | "read" | "write";
export type Reference = { label: string; url: string };
export type CommandMetadata = {
  command: CommandName;
  concept: string;
  label: string;
  mode: CommandExerciseMode;
  platform: string;
};
export type StaticItem = {
  id: string;
  kind: "flashcard" | "bash" | "command";
  topic: string;
  prompt: string;
  answer: string;
  choices?: string[];
  correctChoice?: string;
  source?: { label: string; url: string };
  references?: Reference[];
  command?: CommandMetadata;
};
export type GeneratedDefinition = { id: string; generator: string; grader: string; active?: boolean };
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
    prompt: "Recall these latency anchors and their order of magnitude: L1 hit; DRAM access; NVMe random read; HDD seek; cross-region RTT. Use cycles, ns, µs, and ms.",
    answer: "L1 hit: about 3–5 cycles, roughly 1 ns. DRAM access: about 100 ns. Local NVMe SSD random read: about 100 µs. HDD seek: about 10 ms. Cross-region round trip: about 100 ms, often tens to hundreds of ms. Roughly: DRAM is 100× L1, SSD is 1,000× DRAM, HDD is 100× SSD, and cross-region is 10× HDD. Hardware, workload, and geography vary, so remember the powers of ten rather than treating these as constants.",
    source: { label: "Systems Performance: Enterprise and the Cloud", url: "https://www.brendangregg.com/systems-performance-2nd-edition-book.html" },
  },
  {
    id: "systems-vipt-l1-geometry",
    kind: "flashcard",
    topic: "Systems",
    prompt: "For a straightforward VIPT L1D with 4 KiB pages and 64 B cache lines, derive the set count and capacities at 8-, 12-, and 16-way associativity. Is 64 KiB mandatory, and who shares L1?",
    answer: "VIPT means virtually indexed, physically tagged. A 4 KiB page is 2^12 B and a 64 B line is 2^6 B, leaving 6 page-offset bits for the set index: 64 sets. Capacity = sets × line size × ways = 4 KiB × ways, so 8-way gives 32 KiB, 12-way gives 48 KiB, and 16-way gives 64 KiB. Therefore 64 KiB is not mandatory; associativity selects the capacity under this alias-safe model. L1D and L1I are normally separate and private per physical core; SMT siblings share that core's L1 caches. Do not accidentally add L1D and L1I sizes when quoting L1D capacity. Exact geometry remains microarchitecture-specific.",
    source: { label: "Intel Optimization Reference Manual v50, Volume 1", url: "https://cdrdv2.intel.com/v1/dl/getContent/671488" },
  },
  {
    id: "binary-prefix-ladder",
    kind: "flashcard",
    topic: "Computer arithmetic",
    prompt: "Why does each IEC prefix step add 10 to the byte exponent, and how do IEC units differ from decimal SI?",
    answer: "Each IEC step multiplies by 1024 = 2^10, so the exponent rises by 10: KiB = 2^10 B, MiB = 2^20 B, GiB = 2^30 B, TiB = 2^40 B, PiB = 2^50 B, and EiB = 2^60 B. Decimal SI instead advances by 10^3 per step: GB = 10^9 B, while GiB = 2^30 B.",
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
    id: "bash-fd-standard-streams",
    kind: "flashcard",
    topic: "Bash",
    prompt: "What do file descriptors 0, 1, and 2 conventionally represent?",
    answer: "0 = standard input (stdin), 1 = standard output (stdout), and 2 = standard error (stderr). A redirection changes where one of these numbered descriptors reads from or writes to.",
    choices: [
      "0 = stdin, 1 = stdout, 2 = stderr",
      "0 = stdout, 1 = stdin, 2 = stderr",
      "0 = stdin, 1 = stderr, 2 = stdout",
      "0 = stderr, 1 = stdout, 2 = stdin",
    ],
    correctChoice: "0 = stdin, 1 = stdout, 2 = stderr",
    source: { label: "GNU Bash manual, Redirections", url: "https://www.gnu.org/software/bash/manual/html_node/Redirections.html" },
  },
  {
    id: "bash-file-redirection-defaults",
    kind: "bash",
    topic: "Bash",
    prompt: "command <input.txt >out.txt 2>errors.txt\n\nThe command reads stdin and writes to both stdout and stderr. Where does each stream go? Assume both output files already exist.",
    answer: "stdin reads from input.txt, stdout writes to out.txt, and stderr writes to errors.txt. <input.txt defaults to fd 0 and is equivalent to 0<input.txt; >out.txt defaults to fd 1 and is equivalent to 1>out.txt; 2>errors.txt names fd 2 explicitly. Both > output redirections truncate their files before the command writes.",
    choices: [
      "stdin reads input.txt; stdout writes out.txt; stderr writes errors.txt; both output files are truncated first",
      "stdin reads input.txt; stdout and stderr both write out.txt; errors.txt is unchanged",
      "stdin reads from the terminal; stdout writes out.txt; stderr writes errors.txt",
      "stdin reads input.txt; stdout appends to out.txt; stderr appends to errors.txt",
    ],
    correctChoice: "stdin reads input.txt; stdout writes out.txt; stderr writes errors.txt; both output files are truncated first",
    source: { label: "GNU Bash manual, Redirections", url: "https://www.gnu.org/software/bash/manual/html_node/Redirections.html" },
  },
  {
    id: "bash-output-append-v-truncate",
    kind: "bash",
    topic: "Bash",
    prompt: "first >out.txt\nsecond >>log.txt\n\nEach command writes one line to stdout. Both files initially contain OLD. What happens?",
    answer: "> redirects stdout and truncates the destination before writing, so out.txt loses OLD. >> redirects stdout but appends instead, so log.txt keeps OLD and gains the new line. Without a descriptor number, both forms redirect fd 1.",
    choices: [
      "out.txt's old contents are replaced; log.txt's old contents are kept and new output is added",
      "Both files keep their old contents and add the new output",
      "Both files lose their old contents before receiving the new output",
      "out.txt keeps its old contents; log.txt loses its old contents",
    ],
    correctChoice: "out.txt's old contents are replaced; log.txt's old contents are kept and new output is added",
    source: { label: "GNU Bash manual, Redirections", url: "https://www.gnu.org/software/bash/manual/html_node/Redirections.html" },
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
    prompt: "Initial destination: fd 1 and fd 2 both write to the terminal.\n\ncommand >out.txt 2>&1\n\nThe command writes to both stdout and stderr. Where does each stream go?",
    answer: "Bash applies redirections left to right. First, fd 1 is redirected to out.txt. Then fd 2 duplicates fd 1's current destination, which is now out.txt. Both streams write to the file. 2>&1 copies that destination at that moment; it does not permanently merge stderr with stdout.",
    choices: [
      "stdout: out.txt; stderr: out.txt",
      "stdout: out.txt; stderr: terminal",
      "stdout: terminal; stderr: out.txt",
      "stdout: terminal; stderr: terminal",
    ],
    correctChoice: "stdout: out.txt; stderr: out.txt",
    source: { label: "GNU Bash manual, Redirections", url: "https://www.gnu.org/software/bash/manual/html_node/Redirections.html" },
  },
  {
    id: "bash-redirection-order-reversed",
    kind: "bash",
    topic: "Bash",
    prompt: "Initial destination: fd 1 and fd 2 both write to the terminal.\n\ncommand 2>&1 >out.txt\n\nThe command writes to both stdout and stderr. Where does each stream go?",
    answer: "Bash applies redirections left to right. First, fd 2 duplicates fd 1's current destination, the terminal. Then fd 1 is redirected to out.txt. fd 2 still writes to the terminal because duplication copied a destination; it did not link the descriptors permanently.",
    choices: [
      "stdout: out.txt; stderr: terminal",
      "stdout: out.txt; stderr: out.txt",
      "stdout: terminal; stderr: out.txt",
      "stdout: terminal; stderr: terminal",
    ],
    correctChoice: "stdout: out.txt; stderr: terminal",
    source: { label: "GNU Bash manual, Redirections", url: "https://www.gnu.org/software/bash/manual/html_node/Redirections.html" },
  },
  {
    id: "bash-heredoc-basic",
    kind: "bash",
    topic: "Bash",
    prompt: "cat <<END\nalpha\nbeta\nEND\n\nWhat does cat print, and does END reach its stdin?",
    answer: "The lines alpha and beta form the here-document body. Bash supplies that body to cat's standard input until it reads the delimiter line END. The delimiter line terminates the here-document and is not part of the input. cat copies the two input lines to stdout.",
    choices: [
      "stdout is alpha then beta; END only terminates the body and is not input",
      "stdout is alpha, beta, then END",
      "stdout is empty because END redirects output",
      "cat reads from a file named END",
    ],
    correctChoice: "stdout is alpha then beta; END only terminates the body and is not input",
    source: { label: "GNU Bash manual, Redirections", url: "https://www.gnu.org/software/bash/manual/html_node/Redirections.html" },
  },
  {
    id: "bash-heredoc-expansion",
    kind: "bash",
    topic: "Bash",
    prompt: "name=world\n\ncat <<EOF\nhello $name\nEOF\n\ncat <<'EOF'\nhello $name\nEOF\n\nWhat does each cat print?",
    answer: "With unquoted EOF, Bash expands the body, so the first command prints hello world. If any part of the delimiter word is quoted, Bash removes the quotes to get the delimiter but performs no parameter, command, or arithmetic expansion in the body, so the second prints hello $name literally.",
    choices: [
      "First: hello world; second: hello $name",
      "First: hello $name; second: hello world",
      "Both: hello world",
      "Both: hello $name",
    ],
    correctChoice: "First: hello world; second: hello $name",
    source: { label: "GNU Bash manual, Redirections", url: "https://www.gnu.org/software/bash/manual/html_node/Redirections.html" },
  },
  {
    id: "bash-heredoc-tab-strip",
    kind: "bash",
    topic: "Bash",
    prompt: "Notation: [TAB] means one leading tab; [SPACES] means four ordinary spaces.\n\ncat <<-END\n[TAB]alpha\n[SPACES]beta\n[TAB]END\n\nWhich indentation reaches cat's stdin?",
    answer: "<<- strips leading tab characters from here-document body lines and the delimiter line. The leading tab before alpha and END is removed; the ordinary spaces before beta remain. END still only terminates the input.",
    choices: [
      "alpha's leading tab is stripped; beta's spaces remain",
      "Both alpha's tab and beta's spaces are stripped",
      "Neither indentation is stripped",
      "Only beta's spaces are stripped",
    ],
    correctChoice: "alpha's leading tab is stripped; beta's spaces remain",
    source: { label: "GNU Bash manual, Redirections", url: "https://www.gnu.org/software/bash/manual/html_node/Redirections.html" },
  },
  {
    id: "bash-here-string",
    kind: "bash",
    topic: "Bash",
    prompt: "name='two words'\ncat <<< \"$name\"\n\nWhat reaches cat's stdin?",
    answer: "A Bash here string takes the expanded word, supplies it to the command's standard input, and appends a trailing newline. Here, cat receives two words followed by a newline, then copies it to stdout.",
    choices: [
      "two words followed by a trailing newline reaches stdin",
      "The literal text $name reaches stdin without a newline",
      "cat opens a file named two words",
      "Nothing; <<< redirects stdout",
    ],
    correctChoice: "two words followed by a trailing newline reaches stdin",
    source: { label: "GNU Bash manual, Redirections", url: "https://www.gnu.org/software/bash/manual/html_node/Redirections.html" },
  },
  {
    id: "bash-stdin-input-forms",
    kind: "flashcard",
    topic: "Bash",
    prompt: "Match each form to cat's stdin source:\n\ncat <input.txt\nprintf '%s\\n' hi | cat\ncat <<WORD ... WORD\ncat <<< word",
    answer: "These are all ways to supply standard input: <input.txt reads a file; a pipe uses the previous command's stdout; <<WORD reads an inline body up to its delimiter; <<< word supplies the expanded word plus a newline. Bash has no standard input command. To consume one line into a variable without treating backslashes as escapes or trimming IFS whitespace, use IFS= read -r line.",
    choices: [
      "file; previous command's stdout; inline body; expanded word plus newline",
      "file; terminal; file named WORD; literal word without newline",
      "terminal; file; previous command's stdout; inline body",
      "All four forms read a named file",
    ],
    correctChoice: "file; previous command's stdout; inline body; expanded word plus newline",
    references: [
      { label: "GNU Bash manual, Redirections", url: "https://www.gnu.org/software/bash/manual/html_node/Redirections.html" },
      { label: "GNU Bash manual, Bourne Shell Builtins", url: "https://www.gnu.org/software/bash/manual/html_node/Bourne-Shell-Builtins.html" },
    ],
  },
  ...commandExercises,
];

export const generatedDefinitions: GeneratedDefinition[] = [
  { id: "mental-arithmetic", generator: "arithmetic", grader: "integer" },
  { id: "decimal-units", generator: "decimal-units", grader: "integer", active: false },
  { id: "binary-units", generator: "binary-units", grader: "integer", active: false },
  { id: "binary-prefix-exponent", generator: "binary-prefix-exponent", grader: "integer" },
  { id: "binary-amount-exponent", generator: "binary-amount-exponent", grader: "integer" },
  { id: "binary-exponent-prefix", generator: "binary-exponent-prefix", grader: "iec-prefix" },
];

export const activeGeneratedDefinitions = generatedDefinitions.filter((definition) => definition.active !== false);

function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const binaryPrefixes = [
  { unit: "KiB", exponent: 10 },
  { unit: "MiB", exponent: 20 },
  { unit: "GiB", exponent: 30 },
  { unit: "TiB", exponent: 40 },
  { unit: "PiB", exponent: 50 },
  { unit: "EiB", exponent: 60 },
] as const;

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
  "binary-prefix-exponent"(seed) {
    const next = random(seed);
    const prefix = binaryPrefixes[Math.floor(next() * binaryPrefixes.length)]!;
    return { seed, prompt: `1 ${prefix.unit} is 2^? bytes.`, expectedAnswer: String(prefix.exponent) };
  },
  "binary-amount-exponent"(seed) {
    const next = random(seed);
    const prefix = binaryPrefixes[Math.floor(next() * binaryPrefixes.length)]!;
    const amountExponent = Math.floor(next() * 5);
    const amount = 2 ** amountExponent;
    return { seed, prompt: `Express ${amount} ${prefix.unit} as 2^? bytes.`, expectedAnswer: String(prefix.exponent + amountExponent) };
  },
  "binary-exponent-prefix"(seed) {
    const next = random(seed);
    const prefix = binaryPrefixes[Math.floor(next() * binaryPrefixes.length)]!;
    return { seed, prompt: `Which IEC unit equals 2^${prefix.exponent} bytes?`, expectedAnswer: prefix.unit };
  },
};

const graders: Record<string, (response: string, expected: string) => boolean> = {
  integer: (response, expected) => /^[-+]?\d+$/.test(response.trim()) && BigInt(response.trim()) === BigInt(expected),
  "iec-prefix": (response, expected) => {
    const normalize = (value: string) => value.trim().toLowerCase().replace(/ib$/, "b");
    return normalize(response) === normalize(expected);
  },
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
  for (const item of items) {
    if (item.correctChoice && !item.choices?.includes(item.correctChoice)) {
      throw new Error(`Correct choice is not listed: ${item.id}`);
    }
    for (const reference of item.references ?? []) {
      if (!/^https?:\/\//.test(reference.url)) throw new Error(`Invalid reference URL: ${item.id}`);
    }
  }
}

validateContent(contentBank, generatedDefinitions);
