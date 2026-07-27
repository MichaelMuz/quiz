import { execFileSync, spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { commandConcepts, commandExerciseId, commandExercises } from "../src/content.js";
import { chooseStableId } from "../src/scheduler.js";

function run(command: string, args: string[], input: string): string {
  return execFileSync(command, args, {
    input,
    encoding: "utf8",
    env: { ...process.env, LC_ALL: "C" },
  });
}

describe("Unix stream and observation command literacy", () => {
  it("teaches tr as a character-stream translator, deleter, and squeezer with executable fixtures", () => {
    const concepts = commandConcepts.filter(({ command }) => command === "tr");
    expect(concepts.map(({ concept }) => concept)).toEqual([
      "translate-characters",
      "delete-characters",
      "squeeze-repeats",
    ]);

    const exercises = commandExercises.filter((item) => item.command?.command === "tr");
    expect(exercises).toHaveLength(9);
    expect(new Set(exercises.map(({ id }) => id)).size).toBe(9);
    for (const concept of concepts) {
      expect(concept.platform).toMatch(/POSIX Issue 8.*GNU coreutils 9\.7.*C locale/i);
      expect(concept.references.map(({ url }) => url)).toEqual(expect.arrayContaining([
        "https://pubs.opengroup.org/onlinepubs/9799919799/utilities/tr.html",
        "https://www.gnu.org/software/coreutils/manual/html_node/tr-invocation.html",
      ]));
      expect(exercises.filter((item) => item.command?.concept === concept.concept)
        .map((item) => item.command!.mode).sort()).toEqual(["definition", "read", "write"]);
      expect(concept.read.choices).toContain(concept.read.correctChoice);
      expect(concept.write.choices).toContain(concept.write.correctChoice);
    }

    expect(concepts[0]!.definition.answer).toMatch(/characters.*not.*multi-character strings/is);
    expect(concepts[0]!.definition.answer).toMatch(/ranges.*character classes.*locale/is);
    expect(concepts[0]!.read.correctChoice).toBe("dog godo");
    expect(concepts[1]!.read.correctChoice).toBe("user \nroom ");
    expect(concepts[2]!.read.correctChoice).toBe("alpha beta gamma");
    expect(concepts[0]!.write.choices).toEqual([
      "tr 'a-z' 'A-Z'", "tr '[:lower:]' 'upper'", "tr -d 'a-z'", "sed 's/a-z/A-Z/'",
    ]);
    expect(concepts[1]!.write.choices).toEqual([
      "tr -d ':'", "tr -s ':'", "tr ':' ';'", "tr -d 'colon'",
    ]);
    expect(concepts[2]!.write.choices).toEqual([
      "tr -s ':'", "tr -d ':'", "tr ':' ';'", "tr -s ' ' ':'",
    ]);

    expect(run("tr", ["cat", "dog"], "cat taco\n")).toBe("dog godo\n");
    expect(run("tr", ["-d", "[:digit:]"], "user 42\nroom 7\n")).toBe("user \nroom \n");
    expect(run("tr", ["-s", " "], "alpha   beta    gamma\n")).toBe("alpha beta gamma\n");
    expect(run("tr", ["a-z", "A-Z"], "Alpha-42!\n")).toBe("ALPHA-42!\n");
  });

  it("teaches portable head and tail line selection plus an honest follow boundary", () => {
    const headConcepts = commandConcepts.filter(({ command }) => command === "head");
    const tailConcepts = commandConcepts.filter(({ command }) => command === "tail");
    expect(headConcepts.map(({ concept }) => concept)).toEqual(["first-lines"]);
    expect(tailConcepts.map(({ concept }) => concept)).toEqual([
      "last-lines",
      "start-at-line",
      "follow-appends",
    ]);

    for (const concept of [...headConcepts, ...tailConcepts]) {
      expect(concept.platform).toMatch(/POSIX Issue 8.*GNU coreutils 9\.7.*BSD\/macOS/i);
      expect(concept.read.choices).toContain(concept.read.correctChoice);
      expect(concept.write.choices).toContain(concept.write.correctChoice);
      expect(commandExercises.filter((item) => item.command?.command === concept.command
        && item.command.concept === concept.concept).map((item) => item.command!.mode).sort())
        .toEqual(["definition", "read", "write"]);
    }

    expect(headConcepts[0]!.references.map(({ url }) => url)).toEqual(expect.arrayContaining([
      "https://pubs.opengroup.org/onlinepubs/9799919799/utilities/head.html",
      "https://www.gnu.org/software/coreutils/manual/html_node/head-invocation.html",
    ]));
    expect(tailConcepts[0]!.references.map(({ url }) => url)).toEqual(expect.arrayContaining([
      "https://pubs.opengroup.org/onlinepubs/9799919799/utilities/tail.html",
      "https://www.gnu.org/software/coreutils/manual/html_node/tail-invocation.html",
      "https://manp.gs/mac/1/tail",
    ]));

    expect(tailConcepts[1]!.definition.answer).toMatch(/tail -n N.*last N.*tail -n \+N.*line N/is);
    expect(tailConcepts[2]!.definition.answer).toMatch(/appended bytes.*not.*history/is);
    expect(tailConcepts[2]!.definition.answer).toMatch(/GNU.*-F.*follow=name.*retry.*BSD\/macOS.*filename/is);
    expect(tailConcepts[2]!.read.choices).toEqual([
      "tail -F app.log", "tail -f app.log.1", "watch 'tail -n 10 app.log'", "tail -n +1 app.log.1",
    ]);
    expect(tailConcepts[2]!.write.choices).toEqual([
      "tail -f app.log", "watch 'tail -n 10 app.log'", "head -n 10 app.log", "tail -n 10 app.log",
    ]);

    const lines = "one\ntwo\nthree\nfour\nfive\n";
    expect(run("head", ["-n", "2"], lines)).toBe("one\ntwo\n");
    expect(run("tail", ["-n", "2"], lines)).toBe("four\nfive\n");
    expect(run("tail", ["-n", "+3"], lines)).toBe("three\nfour\nfive\n");
  });

  it("teaches ps as a normalized snapshot and labels its option-family boundaries", () => {
    const concepts = commandConcepts.filter(({ command }) => command === "ps");
    expect(concepts.map(({ concept }) => concept)).toEqual([
      "snapshot-columns",
      "forms-and-tool-boundaries",
    ]);
    for (const concept of concepts) {
      expect(concept.platform).toMatch(/procps-ng 4\.0\.4.*Linux.*BSD\/macOS/i);
      expect(concept.references.map(({ url }) => url)).toEqual(expect.arrayContaining([
        "https://man7.org/linux/man-pages/man1/ps.1.html",
        "https://manp.gs/mac/1/ps",
      ]));
      expect(concept.read.choices).toContain(concept.read.correctChoice);
      expect(concept.write.choices).toContain(concept.write.correctChoice);
      expect(commandExercises.filter((item) => item.command?.command === "ps"
        && item.command.concept === concept.concept).map((item) => item.command!.mode).sort())
        .toEqual(["definition", "read", "write"]);
    }

    expect(concepts[0]!.definition.answer).toMatch(/snapshot.*PID.*PPID.*STAT.*ELAPSED.*%CPU.*%MEM.*COMM.*ARGS/is);
    expect(concepts[0]!.read.prompt).toContain("4242  4010  S     01:23    2.5   0.4  python  python worker.py --queue sync");
    expect(concepts[0]!.read.correctChoice).toMatch(/PID 4242.*child of 4010.*sleeping.*1 minute 23 seconds.*2\.5% CPU.*0\.4% memory/is);
    expect(concepts[1]!.definition.answer).toMatch(/ps aux.*BSD-style.*ps -ef.*System V.*POSIX/is);
    expect(concepts[1]!.definition.answer).toMatch(/-u.*overloaded.*Linux.*macOS/is);
    expect(concepts[1]!.definition.answer).toMatch(/pgrep.*top.*\/proc/is);
    expect(concepts[0]!.write.choices).toEqual([
      "ps -p 4242 -o pid,ppid,stat,etime,comm,args", "ps aux", "pgrep -f 4242", "top -p 4242",
    ]);
    expect(concepts[1]!.write.choices).toEqual([
      "pgrep -x sshd", "ps aux", "top", "cat /proc/self/status",
    ]);

    const output = run("ps", [
      "-p", String(process.pid),
      "-o", "pid=PID,ppid=PPID,stat=STAT,etime=ELAPSED,pcpu=%CPU,pmem=%MEM,comm=COMM,args=ARGS",
    ], "");
    const [header, row] = output.trim().split("\n");
    expect(header).toMatch(/PID\s+PPID\s+STAT\s+ELAPSED\s+%CPU\s+%MEM\s+COMM\s+ARGS/);
    expect(row).toMatch(new RegExp(`^\\s*${process.pid}\\s+${process.ppid}\\s+\\S+\\s+\\S+\\s+[0-9.]+\\s+[0-9.]+\\s+\\S+\\s+.+$`));
  });

  it("teaches watch as Linux snapshot polling with explicit shell ownership", () => {
    const concepts = commandConcepts.filter(({ command }) => command === "watch");
    expect(concepts.map(({ concept }) => concept)).toEqual([
      "refresh-snapshots",
      "shell-command-boundary",
    ]);
    for (const concept of concepts) {
      expect(concept.platform).toMatch(/procps-ng 4\.0\.4.*GNU\/Linux.*not POSIX.*not bundled with macOS/i);
      expect(concept.references.map(({ url }) => url)).toContain("https://man7.org/linux/man-pages/man1/watch.1.html");
      expect(concept.read.choices).toContain(concept.read.correctChoice);
      expect(concept.write.choices).toContain(concept.write.correctChoice);
      expect(commandExercises.filter((item) => item.command?.command === "watch"
        && item.command.concept === concept.concept).map((item) => item.command!.mode).sort())
        .toEqual(["definition", "read", "write"]);
    }

    expect(concepts[0]!.definition.answer).toMatch(/repeated snapshots.*two seconds.*-n.*-d.*successive visible outputs.*not.*history/is);
    expect(concepts[0]!.definition.answer).toMatch(/tail -f.*appended bytes/is);
    expect(concepts[0]!.read.prompt).toContain("watch -n 2 -d \"printf 'queue=%s\\n' 7\"");
    expect(concepts[1]!.definition.answer).toMatch(/\/bin\/sh -c.*quote.*pipeline.*calling shell.*-x.*bypass/is);
    expect(concepts[0]!.write.choices).toEqual([
      "watch -n 5 -d 'ps -eo pid,stat,etime,comm | head -n 12'",
      "watch -n 5 -d ps -eo pid,stat,etime,comm | head -n 12",
      "tail -f app.log",
      "watch -n 5 'ps -eo pid,stat,etime,comm | head -n 12'",
    ]);
    expect(concepts[1]!.write.choices).toEqual([
      "watch -x -- ps -p 4242 -o pid,stat,etime,comm",
      "watch -- ps -p 4242 -o pid,stat,etime,comm",
      "watch 'ps -p 4242 -o pid,stat,etime,comm'",
      "watch ps -p 4242 > snapshot.txt",
    ]);

    const watched = spawnSync("timeout", [
      "0.35", "watch", "-n", "0.1", "-t", "printf 'left\\nright\\n' | head -n 1",
    ], {
      encoding: "utf8",
      env: { ...process.env, LC_ALL: "C", TERM: "xterm", COLUMNS: "80", LINES: "24" },
    });
    expect(watched.status).toBe(124);
    const visible = watched.stdout.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "").replace(/\r/g, "");
    expect(visible).toContain("left");
    expect(visible).not.toContain("right");

    const direct = spawnSync("timeout", [
      "0.35", "watch", "-n", "0.1", "-t", "-x", "--",
      "ps", "-p", String(process.pid), "-o", "pid=,stat=,etime=,comm=",
    ], {
      encoding: "utf8",
      env: { ...process.env, LC_ALL: "C", TERM: "xterm", COLUMNS: "80", LINES: "24" },
    });
    expect(direct.status).toBe(124);
    expect(direct.stdout.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, ""))
      .toContain(String(process.pid));
  });

  it("keeps every new stable ID unique and reachable through definition, read, write progression", () => {
    const commands = new Set(["tr", "head", "tail", "ps", "watch"]);
    const concepts = commandConcepts.filter(({ command }) => commands.has(command));
    const exercises = commandExercises.filter((item) => commands.has(item.command!.command));
    const expectedIds = concepts.flatMap(({ command, concept }) =>
      (["definition", "read", "write"] as const).map((mode) => commandExerciseId(command, concept, mode)));

    expect(exercises.map(({ id }) => id)).toEqual(expectedIds);
    expect(new Set(expectedIds).size).toBe(33);

    const states: Array<{ stableId: string; interval: number; reviews: number; successfulReviews: number; dueAt: string; updatedAt: string }> = [];
    const seen = new Set<string>();
    const expected = new Set(expectedIds);
    for (let position = 0; position < 3_000 && seen.size < expected.size; position += 1) {
      const id = chooseStableId(position, states, new Date("2026-01-02T00:00:00.000Z"));
      if (!expected.has(id) || seen.has(id)) continue;
      seen.add(id);
      states.push({ stableId: id, interval: 2, reviews: 1, successfulReviews: 1,
        dueAt: "2099-01-01T00:00:00.000Z", updatedAt: "2026-01-02T00:00:00.000Z" });
    }
    expect(seen).toEqual(expected);

    const dueId = commandExerciseId("watch", "refresh-snapshots", "definition");
    expect(chooseStableId(0, [{ stableId: dueId, interval: 0, reviews: 1, successfulReviews: 0,
      dueAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }],
    new Date("2026-01-02T00:00:00.000Z"))).toBe(dueId);
  });
});
