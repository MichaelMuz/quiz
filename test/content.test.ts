import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  commandConcepts,
  commandExercises,
  contentBank,
  generateQuestion,
  generatedDefinitions,
  gradeAnswer,
  validateContent,
} from "../src/content.js";

describe("content validation", () => {
  it("rejects duplicate stable IDs", () => {
    expect(() => validateContent([contentBank[0]!, contentBank[0]!], generatedDefinitions))
      .toThrow(/duplicate question id/i);
  });

  it("rejects missing generator and grader registrations", () => {
    expect(() => validateContent(contentBank, [{ id: "broken", generator: "missing", grader: "missing" }]))
      .toThrow(/generator.*missing.*grader.*missing/i);
  });

  it("accepts the shipped bank", () => {
    expect(() => validateContent(contentBank, generatedDefinitions)).not.toThrow();
  });

  it("keeps the Bash redirection slice bounded, uniquely identified, and choice-gradable", () => {
    const ids = [
      "bash-fd-standard-streams",
      "bash-file-redirection-defaults",
      "bash-output-append-v-truncate",
      "bash-redirection-order",
      "bash-redirection-order-reversed",
      "bash-heredoc-basic",
      "bash-heredoc-expansion",
      "bash-heredoc-tab-strip",
      "bash-here-string",
      "bash-stdin-input-forms",
    ];
    const items = ids.map((id) => contentBank.find((candidate) => candidate.id === id));
    expect(items.every(Boolean)).toBe(true);
    expect(new Set(items.map((item) => item!.id)).size).toBe(ids.length);
    expect(items.every((item) => item!.choices?.includes(item!.correctChoice!))).toBe(true);
  });
});

describe("static questions", () => {
  it("tests numerical latency anchors rather than relative ordering", () => {
    const item = contentBank.find((candidate) => candidate.id === "systems-latency-orders");
    expect(item).toBeDefined();
    expect(item!.prompt).toMatch(/latency.*order of magnitude/i);
    expect(item!.prompt).toMatch(/L1.*DRAM.*NVMe.*HDD.*cross-region/i);
    expect(item!.prompt).not.toMatch(/fastest-to-slowest|capacity/i);
    expect(item!.answer).toMatch(/1 ns.*100 ns.*100 µs.*10 ms.*100 ms/i);
  });

  it("makes the VIPT L1D geometry derivable instead of teaching 64 KiB as universal", () => {
    const item = contentBank.find((candidate) => candidate.id === "systems-vipt-l1-geometry");
    expect(item).toBeDefined();
    expect(item!.prompt).toMatch(/4 KiB.*64 B.*8.*12.*16/i);
    expect(item!.answer).toMatch(/virtually indexed.*physically tagged/i);
    expect(item!.answer).toMatch(/64 sets.*32 KiB.*48 KiB.*64 KiB/i);
    expect(item!.answer).toMatch(/per physical core.*SMT/i);
    expect(item!.answer).toMatch(/not.*mandatory/i);
  });

  it("explains the IEC exponent ladder and distinguishes it from decimal SI", () => {
    const item = contentBank.find((candidate) => candidate.id === "binary-prefix-ladder");
    expect(item).toBeDefined();
    expect(item!.prompt).toMatch(/IEC.*step.*exponent/i);
    expect(item!.answer).toMatch(/1024 = 2\^10/i);
    expect(item!.answer).toMatch(/KiB.*2\^10.*MiB.*2\^20.*GiB.*2\^30.*TiB.*2\^40.*PiB.*2\^50.*EiB.*2\^60/i);
    expect(item!.answer).toMatch(/GB = 10\^9.*GiB = 2\^30/i);
  });

  it("teaches the standard file descriptor mapping explicitly", () => {
    const item = contentBank.find((candidate) => candidate.id === "bash-fd-standard-streams");
    expect(item).toBeDefined();
    expect(item!.prompt).toMatch(/file descriptors 0, 1, and 2/i);
    expect(item!.answer).toMatch(/0 = standard input.*1 = standard output.*2 = standard error/i);
    expect(item!.correctChoice).toBe("0 = stdin, 1 = stdout, 2 = stderr");
  });

  it("covers the default descriptors for input, output, and error file redirections", () => {
    const item = contentBank.find((candidate) => candidate.id === "bash-file-redirection-defaults");
    expect(item).toBeDefined();
    expect(item!.prompt).toContain("command <input.txt >out.txt 2>errors.txt");
    expect(item!.answer).toMatch(/<input\.txt.*0<input\.txt.*>out\.txt.*1>out\.txt.*2>errors\.txt/i);
    expect(item!.correctChoice).toMatch(/stdin.*input\.txt.*stdout.*out\.txt.*stderr.*errors\.txt/i);
  });

  it("executes the displayed producers and derives exact truncate and append bytes", () => {
    const item = contentBank.find((candidate) => candidate.id === "bash-output-append-v-truncate");
    const transcript = "$ cat out.txt\nOLD\n$ cat log.txt\nOLD";
    const commands = "printf '%s\\n' FIRST >out.txt\nprintf '%s\\n' SECOND >>log.txt";
    expect(item).toBeDefined();
    expect(item!.prompt).toContain(`Initial shell transcript:\n${transcript}`);
    expect(item!.prompt).toContain(`\n\nCommands to run:\n${commands}`);
    expect(item!.prompt).toMatch(/each final line.*last.*newline-terminated/i);
    expect(item!.prompt).not.toContain("Initial bytes: out.txt =");
    expect(item!.answer).toMatch(/fd 1.*>.*truncates.*>>.*appends/i);
    expect(item!.answer).toMatch(/out\.txt:\nFIRST.*log\.txt:\nOLD\nSECOND/s);
    expect(item!.correctChoice).toMatch(/out\.txt:\nFIRST.*log\.txt:\nOLD\nSECOND/s);
    expect(item!.correctChoice).not.toMatch(/(?:out|log)\.txt\s*=/);

    const fixture = mkdtempSync(join(tmpdir(), "quiz-redirection-"));
    try {
      writeFileSync(join(fixture, "out.txt"), "OLD\n");
      writeFileSync(join(fixture, "log.txt"), "OLD\n");
      execFileSync("bash", ["-c", commands], { cwd: fixture });
      expect(readFileSync(join(fixture, "out.txt"), "utf8")).toBe("FIRST\n");
      expect(readFileSync(join(fixture, "log.txt"), "utf8")).toBe("OLD\nSECOND\n");
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  });

  it("makes the existing stdout-then-duplication ordering example deterministic", () => {
    const item = contentBank.find((candidate) => candidate.id === "bash-redirection-order");
    expect(item).toBeDefined();
    expect(item!.prompt).toMatch(/initial.*fd 1.*fd 2.*terminal/i);
    expect(item!.prompt).toContain("command >out.txt 2>&1");
    expect(item!.answer).toMatch(/left to right.*fd 1.*out\.txt.*fd 2.*duplicates.*current destination.*out\.txt/i);
    expect(item!.correctChoice).toBe("stdout: out.txt; stderr: out.txt");
  });

  it("contrasts duplication-before-stdout-redirection using the initial terminal destination", () => {
    const item = contentBank.find((candidate) => candidate.id === "bash-redirection-order-reversed");
    expect(item).toBeDefined();
    expect(item!.prompt).toMatch(/initial.*fd 1.*fd 2.*terminal/i);
    expect(item!.prompt).toContain("command 2>&1 >out.txt");
    expect(item!.answer).toMatch(/left to right.*fd 2.*duplicates.*fd 1.*terminal.*fd 1.*out\.txt.*fd 2.*terminal/i);
    expect(item!.correctChoice).toBe("stdout: out.txt; stderr: terminal");
  });

  it("teaches that a heredoc body feeds stdin until its delimiter line", () => {
    const item = contentBank.find((candidate) => candidate.id === "bash-heredoc-basic");
    expect(item).toBeDefined();
    expect(item!.prompt).toContain("cat <<END\nalpha\nbeta\nEND");
    expect(item!.answer).toMatch(/body.*standard input.*until.*delimiter line/i);
    expect(item!.answer).toMatch(/delimiter.*not.*input/i);
    expect(item!.correctChoice).toMatch(/alpha.*beta.*END.*not/i);
  });

  it("contrasts expansion for unquoted and quoted heredoc delimiters", () => {
    const item = contentBank.find((candidate) => candidate.id === "bash-heredoc-expansion");
    expect(item).toBeDefined();
    expect(item!.prompt).toMatch(/<<EOF[\s\S]*<<'EOF'/);
    expect(item!.correctChoice).toBe("First: hello world; second: hello $name");
    expect(item!.answer).toMatch(/any part.*delimiter.*quoted/i);
    expect(item!.answer).toMatch(/parameter.*command.*arithmetic expansion/i);
  });

  it("limits heredoc indentation stripping to leading tab characters", () => {
    const item = contentBank.find((candidate) => candidate.id === "bash-heredoc-tab-strip");
    expect(item).toBeDefined();
    expect(item!.prompt).toMatch(/<<-END.*\[TAB\].*\[SPACES\]/s);
    expect(item!.answer).toMatch(/leading tab.*body.*delimiter/i);
    expect(item!.answer).toMatch(/ordinary spaces.*remain/i);
    expect(item!.correctChoice).toMatch(/tab.*stripped.*spaces.*remain/i);
  });

  it("teaches that a Bash here string supplies one expanded word plus a newline to stdin", () => {
    const item = contentBank.find((candidate) => candidate.id === "bash-here-string");
    expect(item).toBeDefined();
    expect(item!.prompt).toContain("cat <<< \"$name\"");
    expect(item!.answer).toMatch(/Bash here string.*expanded.*standard input.*trailing newline/i);
    expect(item!.correctChoice).toMatch(/two words.*trailing newline.*stdin/i);
  });

  it("contrasts stdin sources without inventing an input command", () => {
    const item = contentBank.find((candidate) => candidate.id === "bash-stdin-input-forms");
    expect(item).toBeDefined();
    expect(item!.prompt).toMatch(/<input\.txt.*\|.*<<WORD.*<<< word/s);
    expect(item!.answer).toMatch(/file.*previous command.*inline body.*expanded word/i);
    expect(item!.answer).toMatch(/no standard.*input command/i);
    expect(item!.answer).toMatch(/IFS= read -r/i);
  });
});

describe("command literacy corpus", () => {
  it("teaches bare fzf as an interactive stdin-to-stdout selection boundary", () => {
    const concept = commandConcepts.find((candidate) =>
      candidate.command === "fzf" && candidate.concept === "stream-selection");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/newline-delimited.*interactive.*selected line.*standard output/i);
    expect(concept!.read.correctChoice).toBe("src/app.ts");
    expect(concept!.write.correctChoice).toBe("choice=$(printf '%s\\n' src/app.ts README.md | fzf)");
    expect(commandExercises.filter((item) => item.command?.command === "fzf"
      && item.command.concept === "stream-selection").map((item) => item.command!.mode).sort())
      .toEqual(["definition", "read", "write"]);
  });

  it("teaches grep's regex default before fixed-string matching", () => {
    const concept = commandConcepts.find((candidate) =>
      candidate.command === "grep" && candidate.concept === "fixed-strings");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/basic regular expression.*-F.*literal fixed strings/i);
    expect(concept!.read.correctChoice).toBe("a.b");
    expect(concept!.write.correctChoice).toBe("grep -F 'a.b' data.txt");
    expect(commandExercises.filter((item) => item.command?.command === "grep"
      && item.command.concept === "fixed-strings").map((item) => item.command!.mode).sort())
      .toEqual(["definition", "read", "write"]);
  });

  it("frames grep -q as an existence check rather than a complete error-reporting mode", () => {
    const concept = commandConcepts.find((candidate) =>
      candidate.command === "grep" && candidate.concept === "result-mode");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/boolean existence check.*rather than.*error-reporting/i);
    expect(concept!.definition.answer).toMatch(/GNU grep.*status 0.*even if.*error/i);
    expect(concept!.definition.answer).toMatch(/other grep implementations.*error status.*vary/i);
  });

  it("teaches rg's recursive ignore-aware defaults before filtering flags", () => {
    const concept = commandConcepts.find((candidate) =>
      candidate.command === "rg" && candidate.concept === "default-filtering");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/recursively.*ignore files.*hidden.*binary/i);
    expect(concept!.read.correctChoice).toBe("src/app.ts only");
    expect(concept!.write.correctChoice).toBe("rg TODO");
    expect(commandExercises.filter((item) => item.command?.command === "rg"
      && item.command.concept === "default-filtering").map((item) => item.command!.mode).sort())
      .toEqual(["definition", "read", "write"]);
  });

  it("states the Git repository context required by rg ignore-file fixtures", () => {
    const ignoreFixtures = commandConcepts.filter((candidate) =>
      candidate.command === "rg" && candidate.read.prompt.includes(".gitignore"));
    expect(ignoreFixtures.length).toBeGreaterThan(0);
    for (const concept of ignoreFixtures) {
      expect(concept.read.prompt).toMatch(/Git repository/i);
    }
  });

  it("teaches jq identity, field access, and array indexing before transformations", () => {
    const concept = commandConcepts.find((candidate) =>
      candidate.command === "jq" && candidate.concept === "identity-access");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/identity.*field.*array.*zero-based/i);
    expect(concept!.read.correctChoice).toBe('"Lin"');
    expect(concept!.write.correctChoice).toBe(".users[0].name");
    expect(commandExercises.filter((item) => item.command?.command === "jq"
      && item.command.concept === "identity-access").map((item) => item.command!.mode).sort())
      .toEqual(["definition", "read", "write"]);
  });

  it("teaches awk's record and field model before programs and options", () => {
    const concept = commandConcepts.find((candidate) =>
      candidate.command === "awk" && candidate.concept === "records-fields");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/record.*line.*fields.*\$0.*\$1.*\$NF/i);
    expect(concept!.read.correctChoice).toBe("alpha 10\nbeta 20");
    expect(concept!.write.correctChoice).toBe("awk '{print $NF}' data.txt");
    expect(commandExercises.filter((item) => item.command?.command === "awk"
      && item.command.concept === "records-fields").map((item) => item.command!.mode).sort())
      .toEqual(["definition", "read", "write"]);
  });

  it("teaches printf to keep data out of the format string", () => {
    const concept = commandConcepts.find((candidate) =>
      candidate.command === "printf" && candidate.concept === "literal-format");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/literal format string.*data.*argument.*%s\\n/i);
    expect(concept!.read.correctChoice).toBe("%s%s");
    expect(concept!.write.correctChoice).toBe("printf '%s\\n' \"$value\"");
    expect(commandExercises.filter((item) => item.command?.command === "printf"
      && item.command.concept === "literal-format").map((item) => item.command!.mode).sort())
      .toEqual(["definition", "read", "write"]);
  });

  it("does not present shell printf floating-point formatting as portable POSIX", () => {
    const concept = commandConcepts.find((candidate) =>
      candidate.command === "printf" && candidate.concept === "numeric-and-shell-quote");
    expect(concept).toBeDefined();
    expect(concept!.platform).toMatch(/integer width.*portable.*floating.*Bash.*%q.*Bash/i);
    expect(concept!.definition.answer).toMatch(/POSIX.*floating-point conversions.*need not be supported/i);
    expect(concept!.read.prompt).toMatch(/Bash commands/i);
  });

  it("ships the mandatory concepts with definition, read, and write mastery IDs", () => {
    expect(commandConcepts.map(({ command, concept }) => `${command}:${concept}`)).toEqual(expect.arrayContaining([
      "fd:type",
      "fd:max-depth",
      "xargs:replace",
      "xargs:max-lines",
    ]));

    for (const concept of commandConcepts) {
      const exercises = commandExercises.filter((item) =>
        item.command?.command === concept.command && item.command.concept === concept.concept);
      expect(exercises.map((item) => item.command!.mode).sort()).toEqual(["definition", "read", "write"]);
      expect(new Set(exercises.map((item) => item.id)).size).toBe(3);
    }
  });

  it.each([
    ["fd", "type", /Memory hook: t = type/i],
    ["fd", "max-depth", /Memory hook: d = depth/i],
    ["xargs", "replace", /Memory hook: I = insert the input at this placeholder/i],
    ["xargs", "max-lines", /Memory hook: L = lines per command invocation/i],
  ])("gives %s %s a labeled memory hook and both learner references", (command, concept, hook) => {
    const definition = commandExercises.find((item) =>
      item.command?.command === command && item.command.concept === concept && item.command.mode === "definition");
    expect(definition?.answer).toMatch(hook);
    expect(definition?.references?.map(({ label }) => label)).toEqual(["Manual", "TLDR"]);
    expect(definition?.references?.every(({ url }) => url.startsWith("https://"))).toBe(true);
  });

  it("teaches portable xargs short forms without inventing GNU long forms on macOS", () => {
    const replace = commandConcepts.find((concept) => concept.command === "xargs" && concept.concept === "replace");
    const lines = commandConcepts.find((concept) => concept.command === "xargs" && concept.concept === "max-lines");
    expect(replace?.label).toBe("-I replace-str");
    expect(replace?.definition.answer).toMatch(/GNU.*--replace.*not.*portable.*macOS/i);
    expect(lines?.label).toBe("-L max-lines");
    expect(lines?.definition.answer).toMatch(/GNU.*--max-lines.*not.*portable.*macOS/i);
  });

  it("encodes representative deterministic fd, sed, and xargs results", () => {
    const correctChoice = (command: string, concept: string, mode: "read" | "write") =>
      commandExercises.find((item) => item.command?.command === command
        && item.command.concept === concept && item.command.mode === mode)?.correctChoice;

    expect(correctChoice("fd", "type", "read")).toBe("notes.md and src/app.ts");
    expect(correctChoice("sed", "global-substitution", "read")).toBe("blue blue green");
    expect(correctChoice("xargs", "max-lines", "read")).toBe("Two invocations: echo run a b c d, then echo run e");
    expect(correctChoice("xargs", "null-input", "write")).toBe("find . -type f -print0 | xargs -0 sha256sum");
  });

  it("rejects unsafe references and choice answers outside their choices", () => {
    const base = contentBank[0]!;
    expect(() => validateContent([{ ...base, id: "unsafe", references: [{ label: "Bad", url: "javascript:alert(1)" }] }], []))
      .toThrow(/reference url/i);
    expect(() => validateContent([{ ...base, id: "choice", choices: ["a"], correctChoice: "b" }], []))
      .toThrow(/correct choice/i);
  });
});

describe("generated questions", () => {
  it("replays every registered generator exactly and grades its expected answer correct", () => {
    fc.assert(fc.property(
      fc.constantFrom(...generatedDefinitions),
      fc.integer({ min: 0, max: 0x7fffffff }),
      (definition, seed) => {
        const first = generateQuestion(definition.id, seed);
        expect(generateQuestion(definition.id, seed)).toEqual(first);
        expect(gradeAnswer(first.grader, first.expectedAnswer, first.expectedAnswer)).toBe(true);
      },
    ));
  });

  it("never crashes on bounded arbitrary grader input", () => {
    fc.assert(fc.property(
      fc.constantFrom("integer", "decimal"),
      fc.string({ maxLength: 200 }),
      fc.string({ maxLength: 80 }),
      (grader, response, expected) => {
        expect(() => gradeAnswer(grader, response, expected)).not.toThrow();
      },
    ));
  });

  it.each([
    [1972, "KiB", "10"],
    [0, "MiB", "20"],
    [251, "GiB", "30"],
    [682, "TiB", "40"],
    [1112, "PiB", "50"],
    [1542, "EiB", "60"],
  ])("maps a binary IEC prefix to its exponent for seed %i", (seed, prefix, exponent) => {
    const question = generateQuestion("binary-prefix-exponent", seed);
    expect(question.prompt).toBe(`1 ${prefix} is 2^? bytes.`);
    expect(question.expectedAnswer).toBe(exponent);
    expect(gradeAnswer(question.grader, exponent, question.expectedAnswer)).toBe(true);
  });

  it("applies exponent arithmetic to a power-of-two GiB amount", () => {
    const question = generateQuestion("binary-amount-exponent", 255);
    expect(question.prompt).toBe("Express 4 GiB as 2^? bytes.");
    expect(question.expectedAnswer).toBe("32");
    expect(gradeAnswer(question.grader, "32", question.expectedAnswer)).toBe(true);
    expect(gradeAnswer(question.grader, "34", question.expectedAnswer)).toBe(false);
  });

  it.each([
    [1972, "10", "KiB"],
    [0, "20", "MiB"],
    [251, "30", "GiB"],
    [682, "40", "TiB"],
    [1112, "50", "PiB"],
    [1542, "60", "EiB"],
  ])("maps a binary exponent to its IEC prefix for seed %i", (seed, exponent, prefix) => {
    const question = generateQuestion("binary-exponent-prefix", seed);
    expect(question.prompt).toBe(`Which IEC unit equals 2^${exponent} bytes?`);
    expect(question.expectedAnswer).toBe(prefix);
    expect(gradeAnswer(question.grader, prefix.toLowerCase(), question.expectedAnswer)).toBe(true);
    expect(gradeAnswer(question.grader, prefix.replace("i", ""), question.expectedAnswer)).toBe(true);
    expect(gradeAnswer(question.grader, prefix === "KiB" ? "mb" : "kb", question.expectedAnswer)).toBe(false);
  });
});
