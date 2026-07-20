import { describe, expect, it } from "vitest";
import { commandConcepts, commandExerciseId, commandExercises } from "../src/content.js";

function lessConcept(id: string) {
  return commandConcepts.find((candidate) => candidate.command === "less" && candidate.concept === id);
}

describe("practical less and documentation fluency", () => {
  it("starts with a reusable pager model and four executable entry paths", () => {
    const concept = lessConcept("pager-entry-points");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/interactive pager.*less CHANGELOG\.md.*rg --help \| less.*git log --oneline \| less.*man bash/is);
    expect(concept!.read.correctChoice).toBe("man bash; rg --help | less; less server.log; git log --oneline | less");
    expect(concept!.write.correctChoice).toBe("rg --help | less");
    expect(concept!.references.some(({ label }) => /upstream less manual/i.test(label))).toBe(true);
    expect(commandExercises.filter((item) => item.command?.command === "less"
      && item.command.concept === "pager-entry-points").map((item) => item.id).sort()).toEqual([
      commandExerciseId("less", "pager-entry-points", "definition"),
      commandExerciseId("less", "pager-entry-points", "read"),
      commandExerciseId("less", "pager-entry-points", "write"),
    ].sort());
  });

  it("chooses common screen and line movement by retrieval goal", () => {
    const concept = lessConcept("movement");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/Space.*forward.*screen.*b.*backward.*screen.*j.*forward.*line.*k.*backward.*line/is);
    expect(concept!.read.correctChoice).toBe("Space, b, j, k");
    expect(concept!.write.correctChoice).toBe("b");
  });

  it("keeps search direction attached to the search and reverses it with N", () => {
    const concept = lessConcept("search-direction");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/\/pattern.*forward.*\?pattern.*backward.*n.*same direction.*N.*opposite direction/is);
    expect(concept!.read.correctChoice).toBe("?WARN, n, N");
    expect(concept!.write.correctChoice).toBe("n");
  });

  it("uses bounds, built-in help, and quit as recovery tools", () => {
    const concept = lessConcept("bounds-help-quit");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/g.*beginning.*G.*end.*h.*help.*q.*quit/is);
    expect(concept!.read.correctChoice).toBe("g, G, h, q");
    expect(concept!.write.correctChoice).toBe("h");
  });

  it("distinguishes wrapped long lines from chopped horizontally shifted lines", () => {
    const concept = lessConcept("long-lines");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/default.*wrap.*-S.*chop.*not discarded.*RightArrow.*horizontal/is);
    expect(concept!.read.correctChoice).toBe("less -S report.tsv, then RightArrow");
    expect(concept!.write.correctChoice).toBe("less -S report.tsv");
  });

  it("leaves follow mode before resuming ordinary pager control", () => {
    const concept = lessConcept("follow-mode");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/F.*follow.*growing file.*Ctrl-C.*normal.*q.*quit/is);
    expect(concept!.read.correctChoice).toBe("F, Ctrl-C, /ERROR");
    expect(concept!.write.correctChoice).toBe("Ctrl-C");
  });

  it("identifies shell command kinds before choosing documentation", () => {
    const concept = lessConcept("command-kind");
    expect(concept).toBeDefined();
    expect(concept!.read.prompt).toMatch(/interactive Bash fixture/i);
    expect(concept!.definition.answer).toMatch(/type.*command -V.*alias.*function.*builtin.*executable/is);
    expect(concept!.definition.answer).toMatch(/type read.*command -V rg.*type -a printf/i);
    expect(concept!.read.correctChoice).toBe("ll: alias; build: function; cd: builtin; rg: executable file");
    expect(concept!.write.correctChoice).toBe("command -V deploy");
    expect(concept!.references.some(({ url }) => url.includes("gnu.org/software/bash"))).toBe(true);
  });

  it("chooses help, --help, or man based on command kind and retrieval depth", () => {
    const concept = lessConcept("documentation-source");
    expect(concept).toBeDefined();
    expect(concept!.references).toContainEqual({
      label: "ripgrep user guide",
      url: "https://github.com/BurntSushi/ripgrep/blob/master/GUIDE.md",
    });
    expect(concept!.definition.answer).toMatch(/help.*builtin.*--help.*quick.*man.*authoritative/is);
    expect(concept!.definition.answer).toMatch(/help read.*help -m read \| less.*rg --help.*man rg/is);
    expect(concept!.read.correctChoice).toBe("help printf; rg --help; man rg");
    expect(concept!.write.correctChoice).toBe("help read");
  });

  it("keeps examples supplemental and offers an Emacs study-buffer path", () => {
    const concept = lessConcept("examples-and-emacs");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/TLDR.*example.*supplemental.*not.*semantic authority.*M-x man.*persistent.*fontified/is);
    expect(concept!.read.correctChoice).toBe("tldr tar; man tar; M-x man");
    expect(concept!.write.correctChoice).toBe("M-x man");
    expect(concept!.references).toContainEqual({
      label: "GNU tar manual",
      url: "https://www.gnu.org/software/tar/manual/tar.html",
    });
  });

  it("ships a bounded, referenced, uniquely scheduled cohort", () => {
    const concepts = commandConcepts.filter((candidate) => candidate.command === "less");
    const exercises = commandExercises.filter((item) => item.command?.command === "less");
    expect(concepts).toHaveLength(9);
    expect(new Set(concepts.map(({ concept }) => concept)).size).toBe(9);
    expect(concepts.every(({ platform }) => /less 708-era/.test(platform)
      || !platform.includes("less"))).toBe(true);
    expect(concepts.flatMap(({ references }) => references)
      .some(({ url }) => url.includes("gwsw/less/blob/28ce5500f4f90f5be93204403c7e43462b9280eb/less.nro.VER")))
      .toBe(true);
    expect(exercises).toHaveLength(27);
    expect(new Set(exercises.map(({ id }) => id)).size).toBe(27);
    expect(concepts.every(({ references }) => references.length > 0
      && references.every(({ url }) => url.startsWith("https://")))).toBe(true);
    expect(exercises.every((item) => !item.correctChoice || item.choices?.includes(item.correctChoice))).toBe(true);
    for (const concept of concepts) {
      expect(exercises.filter((item) => item.command?.concept === concept.concept)
        .map((item) => item.command!.mode).sort()).toEqual(["definition", "read", "write"]);
    }
  });
});
