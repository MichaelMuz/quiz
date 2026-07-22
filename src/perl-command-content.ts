import type { CommandConcept } from "./command-content.js";

const perlRun = { label: "perlrun", url: "https://perldoc.perl.org/perlrun" };
const perlOperators = { label: "perlop", url: "https://perldoc.perl.org/perlop" };
const perlRegexClasses = { label: "Perl regex classes", url: "https://perldoc.perl.org/perlrecharclass" };
const perlChomp = { label: "chomp", url: "https://perldoc.perl.org/functions/chomp" };

export const perlCommandConcepts: CommandConcept[] = [
  {
    command: "perl",
    concept: "record-loop",
    label: "-e, -n, -p, $_, and <>",
    platform: "Perl 5 on Linux and macOS",
    references: [perlRun, perlOperators],
    definition: {
      prompt: "How do perl -e, -n, and -p turn a short program into a line-oriented command?",
      answer: "-e supplies program text on the command line. -n wraps it in while (<>) { ... }, reading each line from named files or standard input into $_ without printing automatically. -p adds an automatic print after each iteration, which makes it convenient for transformations.\n\nMemory hook: n = loop, no automatic output; p = loop, then print.",
    },
    read: {
      prompt: "Input:\nalpha\nbeta\n\nCommand:\nperl -ne 'print uc $_'\n\nWhat is printed?",
      choices: ["ALPHA\nBETA", "alpha\nbeta", "Nothing, because -n never permits print", "Only BETA"],
      correctChoice: "ALPHA\nBETA",
      answer: "ALPHA and BETA are printed on separate lines. -n supplies each input record as $_, and the explicit print emits its uppercased value including the original newline.",
    },
    write: {
      prompt: "Run program once for each input line without automatic output, so the program can decide which records to print. Which form fits?",
      choices: ["perl -ne 'PROGRAM'", "perl -pe 'PROGRAM'", "perl -e 'PROGRAM'", "perl -p 'PROGRAM' -noprint"],
      correctChoice: "perl -ne 'PROGRAM'",
      answer: "perl -ne wraps PROGRAM in the implicit <> input loop but does not print each record automatically. Any output must be explicit.",
    },
  },
  {
    command: "perl",
    concept: "substitution",
    label: "s/PATTERN/REPLACEMENT/g",
    platform: "Perl 5 on Linux and macOS",
    references: [perlRun, perlOperators],
    definition: {
      prompt: "What does Perl's s/PATTERN/REPLACEMENT/g operator do, and why use an alternate delimiter?",
      answer: "s/// replaces text matching PATTERN in $_ by default. Without g it replaces the first match; /g replaces every non-overlapping match. Any non-whitespace delimiter can replace the slashes, so s#/#:#g avoids escaping every slash when transforming paths.\n\nMemory hook: s = substitute; g = global; choose a delimiter that stays quiet.",
    },
    read: {
      prompt: "Input:\n/api/v1\n/a/b\n\nCommand:\nperl -pe 's#/#:#g'\n\nWhat is printed?",
      choices: [":api:v1\n:a:b", ":api/v1\n:a/b", "/api/v1\n/a/b", "api:v1\na:b"],
      correctChoice: ":api:v1\n:a:b",
      answer: "Every slash becomes a colon because /g replaces all matches, and -p prints each transformed record. The # characters are delimiters, not input text.",
    },
    write: {
      prompt: "Replace every occurrence of error with warn on each input line and print the transformed lines. Which command fits?",
      choices: ["perl -pe 's/error/warn/g'", "perl -ne 's/error/warn/g'", "perl -pe 's/error/warn/' -g", "perl -e 's/error/warn/g'"],
      correctChoice: "perl -pe 's/error/warn/g'",
      answer: "-p supplies the record loop and automatic print; s/error/warn/g changes every matching occurrence in the current $_ record.",
    },
  },
  {
    command: "perl",
    concept: "conditional-filter",
    label: "print if /PATTERN/",
    platform: "Perl 5 on Linux and macOS",
    references: [perlRun, perlOperators],
    definition: {
      prompt: "How does perl -ne 'print if /PATTERN/' act as a stream filter?",
      answer: "-n reads one record at a time into $_ without automatic output. /PATTERN/ tests $_ by default, and the postfix if runs print only for matching records. Because $_ still contains its input record separator, selected lines normally keep their newline.\n\nMemory hook: -n stays silent until the condition chooses a record.",
    },
    read: {
      prompt: "Input:\nerror one\nok\nerror two\n\nCommand:\nperl -ne 'print if /error/'\n\nWhat is printed?",
      choices: ["error one\nerror two", "ok", "All three lines", "Nothing"],
      correctChoice: "error one\nerror two",
      answer: "Only the two records containing error are printed. -n does not emit ok automatically, while explicit print preserves the selected records' newlines.",
    },
    write: {
      prompt: "Print only input records containing WARN, preserving their existing newlines. Which command fits?",
      choices: ["perl -ne 'print if /WARN/'", "perl -pe 'print if /WARN/'", "perl -e 'print if /WARN/'", "perl -ne 'print unless /WARN/'"],
      correctChoice: "perl -ne 'print if /WARN/'",
      answer: "perl -ne reads each record without automatic printing, then print if /WARN/ emits exactly the matching records.",
    },
  },
  {
    command: "perl",
    concept: "end-aggregate",
    label: "accumulate in -n; report in END",
    platform: "Perl 5 on Linux and macOS",
    references: [perlRun],
    definition: {
      prompt: "How do a variable and an END block implement a compact Perl stream aggregate?",
      answer: "Code in a -n loop updates an accumulator once per input record. An END block runs after the implicit loop finishes, so it can print one final total. Variables default to useful empty or zero values, though explicit initialization can clarify larger programs.\n\nMemory hook: records accumulate; END reports once.",
    },
    read: {
      prompt: "Input:\n3\n7\n\nCommand:\nperl -ne '$sum += $_; END { print \"total=$sum\\n\" }'\n\nWhat is printed?",
      choices: ["total=10", "total=3\ntotal=10", "3\n7\ntotal=10", "Nothing"],
      correctChoice: "total=10",
      answer: "The implicit -n loop adds 3 and 7 to $sum without printing records. END runs once after input is exhausted and prints total=10 followed by a newline.",
    },
    write: {
      prompt: "Count input records and print one final count=N line. Which Perl one-liner body fits with -ne?",
      choices: ["'$count++; END { print \"count=$count\\n\" }'", "'print $count++'", "'BEGIN { print \"count=$count\\n\" }'", "'END { $count++ }'"],
      correctChoice: "'$count++; END { print \"count=$count\\n\" }'",
      answer: "$count++ runs once per record inside the implicit loop, and END prints the completed count once after all records have been read.",
    },
  },
  {
    command: "perl",
    concept: "chomp-whitespace",
    label: "chomp; s/\\s+/_/g",
    platform: "Perl 5 on Linux and macOS",
    references: [perlRun, perlChomp, perlRegexClasses],
    definition: {
      prompt: "Why chomp a Perl input record before normalizing whitespace with \\s+?",
      answer: "chomp removes the trailing input record separator from $_ when present, including handling a final record that has no newline. Perl \\s matches whitespace such as spaces, tabs, and newlines, so chomping first prevents the record-ending newline from becoming replacement text. The program can then print exactly one deliberate newline.\n\nCross-platform motivation: Perl gives the same \\s semantics on Linux and macOS; portable sed scripts generally use POSIX [[:space:]] rather than GNU sed's \\s extension.",
    },
    read: {
      prompt: "Input bytes represent two records; the final record has no newline:\nalpha  beta\\ngamma\\tdelta\n\nCommand:\nperl -ne 'chomp; s/\\s+/_/g; print \"$_\\n\"'\n\nWhat is printed?",
      choices: ["alpha_beta\ngamma_delta", "alpha_beta_gamma_delta", "alpha__beta\ngamma_delta", "alpha_beta_\ngamma_delta"],
      correctChoice: "alpha_beta\ngamma_delta",
      answer: "chomp removes each record-ending newline when present, \\s+ collapses each internal run of spaces or tabs to one underscore, and print adds one newline per output record.",
    },
    write: {
      prompt: "Normalize whitespace runs inside every line to one underscore and emit exactly one newline per record. Which command fits?",
      choices: ["perl -ne 'chomp; s/\\s+/_/g; print \"$_\\n\"'", "perl -pe 's/\\s+/_/g'", "perl -ne 's/\\s+/_/g'", "perl -pe 'chomp; s/\\s+/_/g'"],
      correctChoice: "perl -ne 'chomp; s/\\s+/_/g; print \"$_\\n\"'",
      answer: "The command removes the input separator before \\s+ can consume it, performs the cleanup, and explicitly restores one output newline.",
    },
  },
];
