import { execFileSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, truncateSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { commandConcepts, commandExercises } from "../src/content.js";
import { chooseStableId } from "../src/scheduler.js";

const perlConceptIds = [
  "record-loop",
  "substitution",
  "conditional-filter",
  "end-aggregate",
  "chomp-whitespace",
];

const findConceptIds = [
  "traversal-patterns",
  "path-depth-empty",
  "boolean-expression",
  "size-ranges",
  "timestamps",
  "permission-bits",
  "safe-actions",
  "symlink-delete-safety",
];

function runPerl(args: string[], input: string): string {
  return execFileSync("perl", args, { encoding: "utf8", input, env: { ...process.env, LC_ALL: "C" } });
}

function exposureOrder(command: string, limit: number): string[] {
  const states: Array<{ stableId: string; interval: number; reviews: number; successfulReviews: number; dueAt: string; updatedAt: string }> = [];
  const seen: string[] = [];
  const targetIds = new Set(commandExercises
    .filter((item) => item.command?.command === command)
    .map((item) => item.id));

  for (let position = 0; position < limit && seen.length < targetIds.size; position += 1) {
    const id = chooseStableId(position, states, new Date("2026-01-02T00:00:00.000Z"));
    if (!targetIds.has(id)) continue;
    seen.push(id);
    states.push({ stableId: id, interval: 2, reviews: 1, successfulReviews: 1,
      dueAt: "2099-01-01T00:00:00.000Z", updatedAt: "2026-01-02T00:00:00.000Z" });
  }
  return seen;
}

function withFindFixture(check: (root: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), "quiz-find-"));
  try {
    mkdirSync(join(root, "tree/src/sub"), { recursive: true });
    mkdirSync(join(root, "tree/archive"), { recursive: true });
    mkdirSync(join(root, "tree/empty-dir"), { recursive: true });
    mkdirSync(join(root, "tree/links"), { recursive: true });
    writeFileSync(join(root, "tree/src/app.ts"), "app\n");
    writeFileSync(join(root, "tree/src/app.test.ts"), "test\n");
    writeFileSync(join(root, "tree/src/sub/deep.ts"), "deep\n");
    writeFileSync(join(root, "tree/archive/report.log"), "log\n");
    writeFileSync(join(root, "tree/src/empty"), "");
    writeFileSync(join(root, "tree/src/two words.txt"), "space\n");
    writeFileSync(join(root, "tree/src/line\nbreak.txt"), "newline\n");
    symlinkSync("../src", join(root, "tree/links/source-link"));
    writeFileSync(join(root, "tree/archive/exactly-1MiB.bin"), "");
    writeFileSync(join(root, "tree/archive/over-1MiB.bin"), "");
    writeFileSync(join(root, "tree/archive/exactly-2MiB.bin"), "");
    truncateSync(join(root, "tree/archive/exactly-1MiB.bin"), 1_048_576);
    truncateSync(join(root, "tree/archive/over-1MiB.bin"), 1_048_577);
    truncateSync(join(root, "tree/archive/exactly-2MiB.bin"), 2_097_152);
    chmodSync(join(root, "tree/src/app.ts"), 0o644);
    chmodSync(join(root, "tree/src/app.test.ts"), 0o744);
    chmodSync(join(root, "tree/src/sub/deep.ts"), 0o711);
    const now = Date.now() / 1_000;
    utimesSync(join(root, "tree/src/app.ts"), now - 12 * 60 * 60, now - 12 * 60 * 60);
    utimesSync(join(root, "tree/src/app.test.ts"), now - 36 * 60 * 60, now - 36 * 60 * 60);
    utimesSync(join(root, "tree/src/sub/deep.ts"), now - 60 * 60 * 60, now - 60 * 60 * 60);
    check(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function runFind(root: string, args: string[]): string {
  return execFileSync("find", args, { cwd: root, encoding: "utf8", env: { ...process.env, LC_ALL: "C" } });
}

function sortedLines(output: string): string[] {
  return output.trim().split("\n").filter(Boolean).sort();
}

describe("practical Perl command-literacy cohort", () => {
  it("defines a bounded sourced cohort with definition, read, and write modes", () => {
    const concepts = commandConcepts.filter((concept) => concept.command === "perl");

    expect(concepts.map(({ concept }) => concept)).toEqual(perlConceptIds);
    for (const concept of concepts) {
      expect(concept.platform).toMatch(/Perl 5.*Linux.*macOS/);
      expect(concept.references.some(({ url }) => url.startsWith("https://perldoc.perl.org/"))).toBe(true);
      for (const mode of ["definition", "read", "write"] as const) {
        expect(concept[mode].prompt.length).toBeGreaterThan(30);
        expect(concept[mode].answer.length).toBeGreaterThan(30);
      }
      expect(concept.read.choices).toHaveLength(4);
      expect(concept.read.choices).toContain(concept.read.correctChoice);
      expect(concept.write.choices).toHaveLength(4);
      expect(concept.write.choices).toContain(concept.write.correctChoice);
    }
  });

  it("executes the displayed filtering, transformation, aggregation, and cleanup forms", () => {
    expect(runPerl(["-ne", "print if /error/"], "error one\nok\nerror two\n"))
      .toBe("error one\nerror two\n");
    expect(runPerl(["-pe", "s#/#:#g"], "/api/v1\n/a/b\n"))
      .toBe(":api:v1\n:a:b\n");
    expect(runPerl(["-ne", "$sum += $_; END { print \"total=$sum\\n\" }"], "3\n7\n"))
      .toBe("total=10\n");
    expect(runPerl(["-ne", "chomp; s/\\s+/_/g; print \"$_\\n\""], "alpha  beta\ngamma\tdelta"))
      .toBe("alpha_beta\ngamma_delta\n");
  });

  it("exposes every mode deterministically in prerequisite order", () => {
    const first = exposureOrder("perl", 2_000);
    const second = exposureOrder("perl", 2_000);

    expect(first).toEqual(second);
    expect(first).toHaveLength(perlConceptIds.length * 3);
    for (const concept of perlConceptIds) {
      const definition = first.indexOf(`command:perl:${concept}:definition`);
      const read = first.indexOf(`command:perl:${concept}:read`);
      const write = first.indexOf(`command:perl:${concept}:write`);
      expect(definition).toBeGreaterThanOrEqual(0);
      expect(read).toBeGreaterThan(definition);
      expect(write).toBeGreaterThan(read);
    }
  });
});

describe("practical find command-literacy cohort", () => {
  it("defines a bounded sourced cohort with explicit implementation scope and three modes", () => {
    const concepts = commandConcepts.filter((concept) => concept.command === "find");

    expect(concepts.map(({ concept }) => concept)).toEqual(findConceptIds);
    for (const concept of concepts) {
      expect(concept.platform).toMatch(/GNU|POSIX/);
      expect(concept.platform).toMatch(/BSD\/macOS/);
      expect(concept.references.some(({ url }) => url.includes("pubs.opengroup.org") || url.includes("gnu.org/software/findutils") || url.includes("apple-oss-distributions"))).toBe(true);
      for (const mode of ["definition", "read", "write"] as const) {
        expect(concept[mode].prompt.length).toBeGreaterThan(30);
        expect(concept[mode].answer.length).toBeGreaterThan(30);
      }
      expect(concept.read.choices).toHaveLength(4);
      expect(concept.read.choices).toContain(concept.read.correctChoice);
      expect(concept.write.choices).toHaveLength(4);
      expect(concept.write.choices).toContain(concept.write.correctChoice);
    }
  });

  it("executes traversal, expression, metadata, link, and safe-boundary fixtures", () => withFindFixture((root) => {
    expect(sortedLines(runFind(root, ["tree", "-maxdepth", "2", "-type", "f", "-name", "*.ts", "-print"])))
      .toEqual(["tree/src/app.test.ts", "tree/src/app.ts"]);
    expect(sortedLines(runFind(root, ["tree", "-maxdepth", "2", "-path", "*/src/*", "-empty", "-print"])))
      .toEqual(["tree/src/empty"]);
    expect(sortedLines(runFind(root, ["tree", "-type", "f", "-name", "*.ts", "-o", "-name", "*.log", "-print"])))
      .toEqual(["tree/archive/report.log"]);
    expect(sortedLines(runFind(root, ["tree", "-type", "f", "(", "-name", "*.ts", "-o", "-name", "*.log", ")", "-print"])))
      .toEqual(["tree/archive/report.log", "tree/src/app.test.ts", "tree/src/app.ts", "tree/src/sub/deep.ts"]);
    expect(sortedLines(runFind(root, ["tree", "-type", "f", "-size", "+1M", "-size", "-3M", "-print"])))
      .toEqual(["tree/archive/exactly-2MiB.bin", "tree/archive/over-1MiB.bin"]);
    expect(sortedLines(runFind(root, ["tree/src", "-type", "f", "-mtime", "1", "-print"])))
      .toEqual(["tree/src/app.test.ts"]);
    expect(sortedLines(runFind(root, ["tree", "-type", "f", "-perm", "-111", "-print"])))
      .toEqual(["tree/src/sub/deep.ts"]);
    expect(sortedLines(runFind(root, ["tree", "-type", "f", "-perm", "/111", "-print"])))
      .toEqual(["tree/src/app.test.ts", "tree/src/sub/deep.ts"]);
    expect(sortedLines(runFind(root, ["tree/links", "-type", "l", "-print"])))
      .toEqual(["tree/links/source-link"]);
    expect(sortedLines(runFind(root, ["-L", "tree/links", "-type", "f", "-name", "*.ts", "-print"])))
      .toEqual(["tree/links/source-link/app.test.ts", "tree/links/source-link/app.ts", "tree/links/source-link/sub/deep.ts"]);

    const nulOutput = execFileSync("find", ["tree/src", "-maxdepth", "1", "-type", "f", "-print0"], { cwd: root });
    const nulNames = nulOutput.toString("utf8").split("\0").filter(Boolean).sort();
    expect(nulNames).toContain("tree/src/two words.txt");
    expect(nulNames).toContain("tree/src/line\nbreak.txt");

    const xargsNames = execFileSync("xargs", ["-0", "printf", "%s\\0"], { cwd: root, input: nulOutput })
      .toString("utf8").split("\0").filter(Boolean).sort();
    expect(xargsNames).toEqual(nulNames);

    const executedNames = execFileSync("find", ["tree/src", "-maxdepth", "1", "-type", "f", "-exec", "printf", "%s\\0", "{}", "+"], { cwd: root })
      .toString("utf8").split("\0").filter(Boolean).sort();
    expect(executedNames).toEqual(nulNames);
  }));

  it("teaches find's implicit print action and explicit action boundaries", () => {
    const actions = commandConcepts.find((concept) =>
      concept.command === "find" && concept.concept === "safe-actions");

    expect(actions).toBeDefined();
    expect(actions!.definition.answer).toMatch(/without an explicit action.*-print/i);
    expect(actions!.definition.answer).toMatch(/-exec.*\\;.*once per path.*-exec.*\+.*batch/is);
    expect(actions!.definition.answer).toMatch(/-ok.*confirm/i);
  });

  it("scopes current POSIX and implementation-specific find features accurately", () => {
    const pathTests = commandConcepts.find((concept) =>
      concept.command === "find" && concept.concept === "path-depth-empty");
    const actions = commandConcepts.find((concept) =>
      concept.command === "find" && concept.concept === "safe-actions");
    const symlinks = commandConcepts.find((concept) =>
      concept.command === "find" && concept.concept === "symlink-delete-safety");

    expect(pathTests!.platform).toMatch(/POSIX.*-path/i);
    expect(pathTests!.definition.answer).toMatch(/-path.*POSIX/is);
    expect(pathTests!.definition.answer).toMatch(/-maxdepth.*-empty.*GNU.*BSD\/macOS/is);
    expect(actions!.platform).toMatch(/POSIX Issue 8/i);
    expect(actions!.definition.answer).toMatch(/POSIX Issue 8.*-print0.*xargs -0/is);
    expect(actions!.write.correctChoice).toContain("cksum");
    expect(actions!.write.choices!.join("\n")).not.toContain("sha256sum");
    expect(symlinks!.platform).toMatch(/-P.*GNU.*BSD\/macOS/i);
    expect(symlinks!.definition.answer).toMatch(/-P.*GNU.*BSD\/macOS/is);
    expect(symlinks!.definition.answer).toMatch(/POSIX.*-H.*-L/is);
  });

  it("exposes every mode deterministically in prerequisite order", () => {
    const first = exposureOrder("find", 3_000);
    const second = exposureOrder("find", 3_000);

    expect(first).toEqual(second);
    expect(first).toHaveLength(findConceptIds.length * 3);
    for (const concept of findConceptIds) {
      const definition = first.indexOf(`command:find:${concept}:definition`);
      const read = first.indexOf(`command:find:${concept}:read`);
      const write = first.indexOf(`command:find:${concept}:write`);
      expect(definition).toBeGreaterThanOrEqual(0);
      expect(read).toBeGreaterThan(definition);
      expect(write).toBeGreaterThan(read);
    }
  });
});
