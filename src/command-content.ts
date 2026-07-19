import type {
  CommandExerciseMode,
  CommandName,
  Reference,
  StaticItem,
} from "./content.js";
import { practicalCommandConcepts } from "./practical-command-content.js";
import { kubectlConcepts } from "./kubectl-content.js";

type CommandExerciseCopy = {
  prompt: string;
  answer: string;
  choices?: string[];
  correctChoice?: string;
};

export type CommandConcept = {
  command: CommandName;
  concept: string;
  label: string;
  platform: string;
  references: Reference[];
  definition: CommandExerciseCopy;
  read: CommandExerciseCopy;
  write: CommandExerciseCopy;
};

const manualReferences: Record<"fd" | "sed" | "xargs", Reference[]> = {
  fd: [
    { label: "Manual", url: "https://man.archlinux.org/man/fd.1.en" },
    { label: "TLDR", url: "https://tldr.inbrowser.app/pages/common/fd" },
  ],
  sed: [
    { label: "Manual", url: "https://man7.org/linux/man-pages/man1/sed.1.html" },
    { label: "TLDR", url: "https://tldr.inbrowser.app/pages/common/sed" },
  ],
  xargs: [
    { label: "Manual", url: "https://man7.org/linux/man-pages/man1/xargs.1.html" },
    { label: "TLDR", url: "https://tldr.inbrowser.app/pages/common/xargs" },
  ],
};

export const commandConcepts: CommandConcept[] = [
  {
    command: "fd",
    concept: "type",
    label: "-t / --type",
    platform: "fd on Linux and macOS",
    references: manualReferences.fd,
    definition: {
      prompt: "In fd, what do -t and --type mean, and which values are worth recognizing?",
      answer: "They filter results by file type. Representative values are f/file for regular files, d/directory for directories, and l/symlink for symbolic links; x/executable and e/empty are also useful.\n\nMemory hook: t = type.\n\nExample: fd -t f finds only regular files.",
    },
    read: {
      prompt: "Fixture:\nnotes.md\nsrc/app.ts\nsrc/assets/  (directory)\nlatest  (symlink)\n\nCommand:\nfd . --type f\n\nWhich listed paths match the type filter?",
      choices: ["notes.md and src/app.ts", "src/assets only", "latest only", "All four paths"],
      correctChoice: "notes.md and src/app.ts",
      answer: "notes.md and src/app.ts. --type f selects regular files, not directories or symbolic links.",
    },
    write: {
      prompt: "You want fd to return regular files only. Which minimal flag fragment expresses that?",
      choices: ["-t f", "-t d", "-e f", "-d f"],
      correctChoice: "-t f",
      answer: "-t f, equivalently --type f.",
    },
  },
  {
    command: "fd",
    concept: "max-depth",
    label: "-d / --max-depth",
    platform: "fd on Linux and macOS",
    references: manualReferences.fd,
    definition: {
      prompt: "In fd, what do -d and --max-depth control?",
      answer: "They limit directory traversal to at most the given number of levels. They do not mean an exact or minimum depth.\n\nMemory hook: d = depth.\n\nExample: fd . --max-depth 2 does not descend beyond two levels.",
    },
    read: {
      prompt: "Listed files under the current directory:\nREADME.md\nsrc/app.ts\nsrc/lib/parse.ts\ndocs/guide.md\n\nCommand:\nfd . --type f --max-depth 2\n\nWhich listed files can be selected?",
      choices: [
        "README.md, src/app.ts, and docs/guide.md",
        "README.md only",
        "src/lib/parse.ts only",
        "All four files",
      ],
      correctChoice: "README.md, src/app.ts, and docs/guide.md",
      answer: "README.md, src/app.ts, and docs/guide.md. src/lib/parse.ts is three levels below the starting directory, so --max-depth 2 excludes it.",
    },
    write: {
      prompt: "Limit fd to at most three levels of directory traversal. Which minimal flag fragment fits?",
      choices: ["-d 3", "--exact-depth 3", "--min-depth 3", "-t 3"],
      correctChoice: "-d 3",
      answer: "-d 3, equivalently --max-depth 3.",
    },
  },
  {
    command: "fd",
    concept: "extension",
    label: "-e / --extension",
    platform: "fd on Linux and macOS",
    references: manualReferences.fd,
    definition: {
      prompt: "In fd, what do -e and --extension filter?",
      answer: "They filter results by filename extension. The extension is written without the leading dot, and the option may be repeated for several extensions.\n\nMemory hook: e = extension.\n\nExample: fd -e md finds Markdown files.",
    },
    read: {
      prompt: "Fixture:\nREADME\nnotes.md\ndocs/guide.md\nsrc/app.ts\n\nCommand:\nfd . --extension md\n\nWhich paths are selected?",
      choices: ["notes.md and docs/guide.md", "README only", "src/app.ts only", "All four paths"],
      correctChoice: "notes.md and docs/guide.md",
      answer: "notes.md and docs/guide.md. --extension md filters for the md extension at any traversed depth.",
    },
    write: {
      prompt: "Find only TypeScript files with fd. Which minimal flag fragment fits?",
      choices: ["-e ts", "-t ts", "-d ts", "--type extension"],
      correctChoice: "-e ts",
      answer: "-e ts, equivalently --extension ts.",
    },
  },
  {
    command: "sed",
    concept: "substitution",
    label: "s/regexp/replacement/",
    platform: "Portable sed core on GNU and BSD/macOS",
    references: manualReferences.sed,
    definition: {
      prompt: "What does sed's s/regexp/replacement/ command do by default?",
      answer: "It replaces the first match of the regular expression in each addressed input line. Without an address, sed applies it to every input line.\n\nMemory hook: s = substitute.\n\nExample: sed 's/cat/dog/' changes the first cat on each line.",
    },
    read: {
      prompt: "Input:\ncat cat\nbobcat\n\nCommand:\nsed 's/cat/dog/'\n\nWhat is printed?",
      choices: ["dog cat\nbobdog", "dog dog\nbobdog", "dog cat\nbobcat", "cat cat\nbobcat"],
      correctChoice: "dog cat\nbobdog",
      answer: "dog cat\nbobdog\n\nThe substitution replaces only the first match on each input line.",
    },
    write: {
      prompt: "Replace the first cat on each line with dog. Which sed script fits?",
      choices: ["s/cat/dog/", "s/cat/dog/g", "/cat/p", "cat/dog"],
      correctChoice: "s/cat/dog/",
      answer: "s/cat/dog/ replaces the first matching cat in each line.",
    },
  },
  {
    command: "sed",
    concept: "global-substitution",
    label: "s///g",
    platform: "Portable sed core on GNU and BSD/macOS",
    references: manualReferences.sed,
    definition: {
      prompt: "What does g mean after a sed substitution?",
      answer: "It replaces all non-overlapping matches in each addressed line instead of only the first match.\n\nMemory hook: g = global across the line.\n\nExample: sed 's/red/blue/g' changes every red on every input line.",
    },
    read: {
      prompt: "Input:\nred red green\n\nCommand:\nsed 's/red/blue/g'\n\nWhat is printed?",
      choices: ["blue blue green", "blue red green", "red red green", "green green green"],
      correctChoice: "blue blue green",
      answer: "blue blue green. The g flag replaces both non-overlapping matches on the line.",
    },
    write: {
      prompt: "Replace every slash on each line with a colon. Which sed script fits?",
      choices: ["s#/#:#g", "s#/#:#", "g#/#:#", "/slash/p"],
      correctChoice: "s#/#:#g",
      answer: "s#/#:#g. sed permits a delimiter such as #, and g replaces every slash on each line.",
    },
  },
  {
    command: "sed",
    concept: "quiet-print",
    label: "-n with p",
    platform: "Portable sed core on GNU and BSD/macOS",
    references: manualReferences.sed,
    definition: {
      prompt: "How do sed -n and the p command work together?",
      answer: "-n is an option that suppresses sed's default printing. p is an editing command that prints the current pattern space, so together they print only explicitly selected lines.\n\nMemory hook: n = no automatic print; p = print.\n\nExample: sed -n '/ERROR/p' prints only lines matching ERROR.",
    },
    read: {
      prompt: "Input:\nINFO ready\nERROR disk\nWARN hot\nERROR network\n\nCommand:\nsed -n '/ERROR/p'\n\nWhat is printed?",
      choices: ["ERROR disk\nERROR network", "INFO ready\nWARN hot", "All four lines", "Nothing"],
      correctChoice: "ERROR disk\nERROR network",
      answer: "ERROR disk\nERROR network\n\n-n suppresses default output, and /ERROR/p prints only matching lines.",
    },
    write: {
      prompt: "Print only lines matching TODO. Which portable command fits?",
      choices: ["sed -n '/TODO/p'", "sed '/TODO/'", "sed -p TODO", "sed -n 's/TODO/'"],
      correctChoice: "sed -n '/TODO/p'",
      answer: "sed -n '/TODO/p' suppresses default output and explicitly prints matching lines.",
    },
  },
  {
    command: "xargs",
    concept: "replace",
    label: "-I replace-str",
    platform: "POSIX short form; GNU and BSD/macOS",
    references: manualReferences.xargs,
    definition: {
      prompt: "What does xargs -I replace-str do?",
      answer: "For each input line, it replaces occurrences of replace-str in the initial command arguments with that whole input line. GNU --replace is not a portable macOS long form, so retain -I when portability matters.\n\nMemory hook: I = insert the input at this placeholder. This is a memory aid; the specified behavior is placeholder replacement.\n\nExample: xargs -I {} cp {} backup/{}.",
    },
    read: {
      prompt: "Input lines:\nalpha\ntwo words\n\nCommand:\nxargs -I ITEM printf '<%s>\\n' ITEM\n\nWhat is printed?",
      choices: ["<alpha>\n<two words>", "<alpha>\n<two>\n<words>", "<ITEM> twice", "One combined line"],
      correctChoice: "<alpha>\n<two words>",
      answer: "<alpha>\n<two words>\n\n-I uses each input line as one replacement item and invokes the utility once per line.",
    },
    write: {
      prompt: "For each input line NAME, copy NAME to backup/NAME. Which command uses a placeholder correctly?",
      choices: [
        "xargs -I NAME cp NAME backup/NAME",
        "xargs -L NAME cp NAME backup/NAME",
        "xargs cp NAME backup/NAME",
        "xargs --max-lines NAME cp backup/NAME",
      ],
      correctChoice: "xargs -I NAME cp NAME backup/NAME",
      answer: "xargs -I NAME cp NAME backup/NAME replaces each NAME occurrence with the current input line.",
    },
  },
  {
    command: "xargs",
    concept: "max-lines",
    label: "-L max-lines",
    platform: "POSIX short form; GNU and BSD/macOS",
    references: manualReferences.xargs,
    definition: {
      prompt: "What does xargs -L max-lines limit?",
      answer: "It uses at most max-lines nonblank input lines for each command invocation; a final invocation may use fewer. GNU --max-lines is not a portable macOS long form, so retain -L when portability matters.\n\nMemory hook: L = Lines per command invocation.\n\nExample: xargs -L 2 echo handles at most two nonblank input lines per echo call.",
    },
    read: {
      prompt: "Input lines:\na b\nc d\ne\n\nCommand:\nxargs -L 2 echo run\n\nHow is echo invoked?",
      choices: [
        "Two invocations: echo run a b c d, then echo run e",
        "Three invocations: echo run a, then b c, then d e",
        "One invocation: echo run a b c d e",
        "Two invocations: echo run a b, then echo run c d e",
      ],
      correctChoice: "Two invocations: echo run a b c d, then echo run e",
      answer: "Two invocations: echo run a b c d, then echo run e. -L 2 groups at most two nonblank input lines into each invocation.",
    },
    write: {
      prompt: "Use at most three nonblank input lines per xargs invocation. Which fragment fits?",
      choices: ["-L 3", "-I 3", "-n L", "--replace 3"],
      correctChoice: "-L 3",
      answer: "-L 3 limits each invocation to at most three nonblank input lines.",
    },
  },
  {
    command: "xargs",
    concept: "null-input",
    label: "-0",
    platform: "Common GNU and BSD/macOS behavior",
    references: manualReferences.xargs,
    definition: {
      prompt: "What does xargs -0 change, and why is it important for filenames?",
      answer: "It reads NUL-terminated input items instead of splitting on blanks and newlines. Because Unix filenames may contain blanks and newlines but cannot contain NUL, this preserves filename boundaries when paired with a NUL-producing command.\n\nMemory hook: 0 = the NUL byte that terminates each item.\n\nExample: find . -print0 | xargs -0 sha256sum.",
    },
    read: {
      prompt: "Input items (␀ marks NUL):\ndraft one.txt␀final.txt␀\n\nCommand:\nxargs -0 printf '<%s>\\n'\n\nWhat is printed?",
      choices: ["<draft one.txt>\n<final.txt>", "<draft>\n<one.txt>\n<final.txt>", "One item containing both names", "Nothing"],
      correctChoice: "<draft one.txt>\n<final.txt>",
      answer: "<draft one.txt>\n<final.txt>\n\n-0 treats each NUL as the boundary, so the space remains inside the first filename.",
    },
    write: {
      prompt: "Hash every file safely even when names contain spaces or newlines. Which pipeline preserves filename boundaries?",
      choices: [
        "find . -type f -print0 | xargs -0 sha256sum",
        "find . -type f -print | xargs sha256sum",
        "find . -type f | xargs -L 1 sha256sum",
        "find . -type f -print0 | xargs sha256sum",
      ],
      correctChoice: "find . -type f -print0 | xargs -0 sha256sum",
      answer: "find . -type f -print0 | xargs -0 sha256sum uses NUL at both sides of the pipeline.",
    },
  },
  ...practicalCommandConcepts,
  ...kubectlConcepts,
];

export function commandExerciseId(command: CommandName, concept: string, mode: CommandExerciseMode): string {
  return `command:${command}:${concept}:${mode}`;
}

const commandModes: CommandExerciseMode[] = ["definition", "read", "write"];
export const commandExercises: StaticItem[] = commandConcepts.flatMap((concept) => commandModes.map((mode) => ({
  id: commandExerciseId(concept.command, concept.concept, mode),
  kind: "command" as const,
  topic: concept.command,
  ...concept[mode],
  references: mode === "definition" ? concept.references : undefined,
  command: {
    command: concept.command,
    concept: concept.concept,
    label: concept.label,
    mode,
    platform: concept.platform,
  },
})));
