import type { CommandConcept } from "./command-content.js";

const cutReferences = [
  { label: "POSIX", url: "https://pubs.opengroup.org/onlinepubs/9799919799/utilities/cut.html" },
  { label: "TLDR", url: "https://tldr.inbrowser.app/pages/common/cut" },
];

export const cutCommandConcepts: CommandConcept[] = [
  {
    command: "cut",
    concept: "field-selection",
    label: "-d DELIM with -f LIST",
    platform: "POSIX cut field mode; portable GNU and BSD/macOS short forms",
    references: cutReferences,
    definition: {
      prompt: "In cut field mode, what do -d DELIM and -f LIST select?",
      answer: "-d DELIM selects one literal input delimiter character, and -f LIST selects 1-based fields from each input line. A list can name fields with commas, such as 1,2, or a range such as 1-3. Selected fields are written in input order and separated by the delimiter.\n\nMemory hook: d = delimiter character; f = field list.\n\nExample: cut -d' ' -f1,2 names.txt selects the first two literal-space-delimited fields.",
    },
    read: {
      prompt: "Input:\nroot:x:0:0\nsvc:x:1000:1000\n\nCommand:\ncut -d: -f1,3\n\nWhat is printed?",
      choices: ["root:0\nsvc:1000", "root:x\nsvc:x", "root 0\nsvc 1000", "x:0\nx:1000"],
      correctChoice: "root:0\nsvc:1000",
      answer: "root:0 and svc:1000. -d: makes each colon a delimiter; -f1,3 selects fields 1 and 3 and writes one colon between the selected fields.",
    },
    write: {
      prompt: "names.txt uses one literal space as its delimiter. Select fields 1 and 2 from each line. Which complete command fits?",
      choices: [
        "cut -d' ' -f1,2 names.txt",
        "cut -f' ' -d1,2 names.txt",
        "cut -d' ' -f2- names.txt",
        "cut -d: -f1,2 names.txt",
      ],
      correctChoice: "cut -d' ' -f1,2 names.txt",
      answer: "cut -d' ' -f1,2 names.txt uses one literal space as the delimiter and selects the first two 1-based fields.",
    },
  },
  {
    command: "cut",
    concept: "literal-space-fields",
    label: "literal spaces can create empty fields",
    platform: "POSIX cut and awk field semantics; portable GNU and BSD/macOS behavior",
    references: [
      ...cutReferences,
      { label: "POSIX awk", url: "https://pubs.opengroup.org/onlinepubs/9799919799/utilities/awk.html" },
    ],
    definition: {
      prompt: "Why can cut -d' ' and awk's default field splitting disagree when spaces repeat?",
      answer: "cut -d' ' treats every literal space as a delimiter, so adjacent spaces surround an empty field. awk's default separator, and the special value FS=\" \", skip leading and trailing blanks and split ordinary line records on runs of spaces or tabs. Therefore awk normally collapses repeated spaces for field numbering while cut preserves their effect as separate delimiter occurrences.\n\nMemory hook: cut counts delimiter characters; awk's space separator groups blanks.",
    },
    read: {
      prompt: "Input (there are two spaces after alpha):\nalpha  beta gamma\n\nCommand:\ncut -d' ' -f1-3\n\nWhat exact line is printed?",
      choices: ["alpha  beta", "alpha beta gamma", "alpha beta", "alpha  beta gamma"],
      correctChoice: "alpha  beta",
      answer: "alpha, two spaces, then beta. The first space ends field 1, the adjacent second space ends empty field 2, and beta is field 3. Selecting fields 1 through 3 preserves two delimiter occurrences in the output.",
    },
    write: {
      prompt: "data.txt uses literal spaces as delimiters, and empty fields created by adjacent spaces matter. Select fields 1 through 3. Which command fits?",
      choices: [
        "cut -d' ' -f1-3 data.txt",
        "awk '{ print $1, $2, $3 }' data.txt",
        "cut -d' ' -f3-1 data.txt",
        "cut -f' ' -d1-3 data.txt",
      ],
      correctChoice: "cut -d' ' -f1-3 data.txt",
      answer: "cut -d' ' -f1-3 data.txt selects literal-space-delimited fields 1 through 3, including an empty field created by adjacent spaces. The awk alternative uses whitespace-run field splitting and does not preserve that empty field.",
    },
  },
];
