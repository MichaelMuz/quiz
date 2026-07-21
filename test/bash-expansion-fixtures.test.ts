import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contentBank } from "../src/content.js";

function runBash(script: string, files: Record<string, string> = {}): string {
  const directory = mkdtempSync(join(tmpdir(), "quiz-expansion-"));
  try {
    for (const [name, contents] of Object.entries(files)) writeFileSync(join(directory, name), contents);
    return execFileSync("bash", ["--noprofile", "--norc", "-c", script], {
      cwd: directory,
      encoding: "utf8",
      env: { ...process.env, LC_ALL: "C" },
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function expansionItem(id: string) {
  const item = contentBank.find((candidate) => candidate.id === id);
  expect(item).toBeDefined();
  expect(item!.kind).toBe("bash");
  expect(item!.choices?.includes(item!.correctChoice!)).toBe(true);
  expect(item!.source?.url).toMatch(/^https:\/\/www\.gnu\.org\/software\/bash\/manual\//);
  return item!;
}

describe("applied Bash expansion fixtures", () => {
  it("contrasts quoted and unquoted parameter expansion through exact argv", () => {
    const item = expansionItem("bash-expansion-quoted-argv");
    const script = "value='alpha beta'; printf '<%s>\\n' $value \"$value\"";

    expect(item.prompt).toContain(script);
    expect(runBash(script)).toBe("<alpha>\n<beta>\n<alpha beta>\n");
    expect(item.correctChoice).toBe("<alpha>\\n<beta>\\n<alpha beta>\\n");
    expect(item.answer).toMatch(/unquoted.*word splitting.*quoted.*one argument/i);
  });

  it("shows brace expansion producing words before parameter expansion", () => {
    const item = expansionItem("bash-expansion-brace-before-parameter");
    const script = "prefix=Q; printf '<%s>\\n' {$prefix,tail}";

    expect(item.prompt).toContain(script);
    expect(runBash(script)).toBe("<Q>\n<tail>\n");
    expect(item.correctChoice).toBe("<Q>\\n<tail>\\n");
    expect(item.answer).toMatch(/brace expansion.*first.*parameter expansion/i);
  });

  it("limits tilde expansion to eligible unquoted positions", () => {
    const item = expansionItem("bash-expansion-tilde-contexts");
    const script = "HOME=/tmp/quiz-home; printf '<%s>\\n' ~ \"~\" x~ PATH=~/bin";

    expect(item.prompt).toContain(script);
    expect(runBash(script)).toBe("</tmp/quiz-home>\n<~>\n<x~>\n<PATH=/tmp/quiz-home/bin>\n");
    expect(item.correctChoice).toBe("</tmp/quiz-home>\\n<~>\\n<x~>\\n<PATH=/tmp/quiz-home/bin>\\n");
    expect(item.answer).toMatch(/start of a word.*after.*=.*quoted.*mid-word/i);
  });

  it("removes every trailing newline from command substitution", () => {
    const item = expansionItem("bash-expansion-command-substitution-newlines");
    const script = "value=$(printf 'alpha\\n\\n'); printf '<%s>\\n' \"$value\"";

    expect(item.prompt).toContain(script);
    expect(runBash(script)).toBe("<alpha>\n");
    expect(item.correctChoice).toBe("<alpha>\\n");
    expect(item.answer).toMatch(/removes all trailing newline/i);
  });

  it("applies word splitting before pathname expansion", () => {
    const item = expansionItem("bash-expansion-splitting-before-pathname");
    const script = "patterns='*.log note.txt'; printf '<%s>\\n' $patterns";

    expect(item.prompt).toContain(script);
    expect(runBash(script, { "red.log": "", "blue.log": "", "note.txt": "" }))
      .toBe("<blue.log>\n<red.log>\n<note.txt>\n");
    expect(item.correctChoice).toBe("<blue.log>\\n<red.log>\\n<note.txt>\\n");
    expect(item.answer).toMatch(/word splitting.*two words.*pathname expansion.*\.log/i);
  });

  it("contrasts matched and unmatched patterns under default Bash behavior", () => {
    const item = expansionItem("bash-expansion-matched-unmatched-patterns");
    const script = "shopt -u nullglob failglob; printf '<%s>\\n' *.txt *.md";

    expect(item.prompt).toContain("printf '<%s>\\n' *.txt *.md");
    expect(runBash(script, { "a.txt": "", "b.txt": "" })).toBe("<a.txt>\n<b.txt>\n<*.md>\n");
    expect(item.correctChoice).toBe("<a.txt>\\n<b.txt>\\n<*.md>\\n");
    expect(item.answer).toMatch(/default Bash.*matches.*no matches.*unchanged/i);
  });
});
