import type { CommandConcept } from "./command-content.js";

const trReferences = [
  { label: "POSIX Issue 8", url: "https://pubs.opengroup.org/onlinepubs/9799919799/utilities/tr.html" },
  { label: "GNU coreutils 9.7 manual", url: "https://www.gnu.org/software/coreutils/manual/html_node/tr-invocation.html" },
];

const trPlatform = "POSIX Issue 8 core; GNU coreutils 9.7 fixtures in the C locale";

const headReferences = [
  { label: "POSIX Issue 8", url: "https://pubs.opengroup.org/onlinepubs/9799919799/utilities/head.html" },
  { label: "GNU coreutils 9.7 manual", url: "https://www.gnu.org/software/coreutils/manual/html_node/head-invocation.html" },
];

const tailReferences = [
  { label: "POSIX Issue 8", url: "https://pubs.opengroup.org/onlinepubs/9799919799/utilities/tail.html" },
  { label: "GNU coreutils 9.7 manual", url: "https://www.gnu.org/software/coreutils/manual/html_node/tail-invocation.html" },
  { label: "BSD/macOS tail manual", url: "https://manp.gs/mac/1/tail" },
];

const selectorPlatform = "POSIX Issue 8 line forms; GNU coreutils 9.7 fixtures; BSD/macOS behavior labeled";

const psReferences = [
  { label: "procps-ng ps(1)", url: "https://man7.org/linux/man-pages/man1/ps.1.html" },
  { label: "BSD/macOS ps(1)", url: "https://manp.gs/mac/1/ps" },
];

const psPlatform = "procps-ng 4.0.4 on Linux fixtures; BSD/macOS syntax differences labeled";

const watchReferences = [
  { label: "procps-ng 4.0.4 watch(1)", url: "https://man7.org/linux/man-pages/man1/watch.1.html" },
];

const watchPlatform = "procps-ng 4.0.4 on GNU/Linux; not POSIX and not bundled with macOS";

export const unixObservationConcepts: CommandConcept[] = [
  {
    command: "tr",
    concept: "translate-characters",
    label: "translate character sets",
    platform: trPlatform,
    references: trReferences,
    definition: {
      prompt: "What does tr STRING1 STRING2 translate, and where is the boundary with string replacement?",
      answer: "tr reads standard input, maps each character from the first set to the corresponding character in the second set, and writes the transformed stream to standard output. It translates characters, not multi-character strings or context-sensitive matches: tr 'cat' 'dog' maps c→d, a→o, and t→g wherever those characters occur. Quote sets so the shell does not reinterpret them. Ranges and character classes depend on the active locale; the fixtures use LC_ALL=C, where 'a-z' and [:lower:] have predictable ASCII behavior. Use sed or Perl when the unit to replace is a string or pattern.\n\nMemory hook: tr owns a character-to-character lookup table, not a search phrase.",
    },
    read: {
      prompt: "Assume LC_ALL=C. Input (newline-terminated):\ncat taco\n\nCommand:\ntr 'cat' 'dog'\n\nWhat exact line is printed? The final output line is newline-terminated.",
      choices: ["dog godo", "dog dogo", "dog taco", "cat taco"],
      correctChoice: "dog godo",
      answer: "dog godo, followed by a newline. tr maps c→d, a→o, and t→g one character at a time, including the characters inside taco; it does not search for the whole word cat.",
    },
    write: {
      prompt: "Assume LC_ALL=C. Translate every lowercase ASCII letter to uppercase while preserving digits and punctuation. Which complete filter fits?",
      choices: [
        "tr 'a-z' 'A-Z'",
        "tr '[:lower:]' 'upper'",
        "tr -d 'a-z'",
        "sed 's/a-z/A-Z/'",
      ],
      correctChoice: "tr 'a-z' 'A-Z'",
      answer: "tr 'a-z' 'A-Z' maps each lowercase ASCII character to its uppercase counterpart in the C locale. Other characters pass through unchanged.",
    },
  },
  {
    command: "tr",
    concept: "delete-characters",
    label: "-d delete a character set",
    platform: trPlatform,
    references: trReferences,
    definition: {
      prompt: "What does tr -d STRING1 do to a stream?",
      answer: "-d deletes every input character that belongs to the named set; all other characters retain their order. A portable character class such as '[:digit:]' names digits according to the locale. Deletion still works character by character, not by matching a whole token.\n\nMemory hook: d = drop each character in the set.",
    },
    read: {
      prompt: "Assume LC_ALL=C. Input (both lines newline-terminated):\nuser 42\nroom 7\n\nCommand:\ntr -d '[:digit:]'\n\nWhat exact two lines are printed?",
      choices: ["user \nroom ", "user\nroom", "user 4\nroom 7", "42\n7"],
      correctChoice: "user \nroom ",
      answer: "The output is user then one space and newline, followed by room then one space and newline. -d removes the digits but preserves the spaces, letters, and line breaks.",
    },
    write: {
      prompt: "Delete every colon from standard input while preserving all other characters. Which complete filter fits?",
      choices: ["tr -d ':'", "tr -s ':'", "tr ':' ';'", "tr -d 'colon'"],
      correctChoice: "tr -d ':'",
      answer: "tr -d ':' deletes each colon character. The quoted set contains exactly one character.",
    },
  },
  {
    command: "tr",
    concept: "squeeze-repeats",
    label: "-s squeeze repeated characters",
    platform: trPlatform,
    references: trReferences,
    definition: {
      prompt: "What does tr -s STRING1 squeeze, and what remains unchanged?",
      answer: "-s replaces each run of a repeated character named by the set with one occurrence. Characters outside the set are untouched. With tr -s ' ', only repeated literal spaces collapse; tabs and newlines are different characters and remain. When translation or deletion is also requested, squeezing happens afterward and uses the last specified set.\n\nMemory hook: s = squeeze a run down to one.",
    },
    read: {
      prompt: "Input (newline-terminated):\nalpha   beta    gamma\n\nCommand:\ntr -s ' '\n\nWhat exact line is printed?",
      choices: ["alpha beta gamma", "alphabetagamma", "alpha   beta    gamma", "alpha beta gamma "],
      correctChoice: "alpha beta gamma",
      answer: "alpha beta gamma, followed by a newline. Only each run of literal spaces is squeezed to one; the final newline is not in the set.",
    },
    write: {
      prompt: "Collapse every run of literal colon characters to one colon, without changing other characters. Which complete filter fits?",
      choices: ["tr -s ':'", "tr -d ':'", "tr ':' ';'", "tr -s ' ' ':'"],
      correctChoice: "tr -s ':'",
      answer: "tr -s ':' squeezes each repeated run of colons to a single colon.",
    },
  },
  {
    command: "head",
    concept: "first-lines",
    label: "-n first lines",
    platform: selectorPlatform,
    references: headReferences,
    definition: {
      prompt: "What does portable head -n N select from a file or pipeline?",
      answer: "head -n N writes the first N lines of each input. A file operand supplies the input directly; with no file, head reads standard input, so a producer can pipe lines into it. Line boundaries and final newlines come from the input; head selects lines rather than inventing or sorting them. The explicit -n form is clearer and portable across current GNU and BSD/macOS implementations.\n\nMemory hook: head starts at line 1 and keeps N lines.",
    },
    read: {
      prompt: "Input (every line newline-terminated):\none\ntwo\nthree\nfour\n\nCommand:\nhead -n 2\n\nWhat exact lines are printed?",
      choices: ["one\ntwo", "three\nfour", "one\ntwo\nthree", "two\nthree"],
      correctChoice: "one\ntwo",
      answer: "one then two, each followed by its input newline. head -n 2 selects the first two lines from standard input.",
    },
    write: {
      prompt: "Print the first three lines of report.txt. Which portable complete command fits?",
      choices: ["head -n 3 report.txt", "head +3 report.txt", "tail -n 3 report.txt", "head -c 3 report.txt"],
      correctChoice: "head -n 3 report.txt",
      answer: "head -n 3 report.txt selects the first three lines. -c would count bytes instead of lines.",
    },
  },
  {
    command: "tail",
    concept: "last-lines",
    label: "-n last lines",
    platform: selectorPlatform,
    references: tailReferences,
    definition: {
      prompt: "What does tail -n N select from a file or pipeline?",
      answer: "tail -n N writes the last N lines of each input. With no file operand, it reads standard input, so it can select from a completed producer pipeline. It is a line selector, not a sorter, search tool, or live monitor unless follow mode is requested separately.\n\nMemory hook: tail keeps N lines from the end.",
    },
    read: {
      prompt: "Input (every line newline-terminated):\none\ntwo\nthree\nfour\nfive\n\nCommand:\ntail -n 2\n\nWhat exact lines are printed?",
      choices: ["four\nfive", "one\ntwo", "three\nfour\nfive", "two\nthree"],
      correctChoice: "four\nfive",
      answer: "four then five, each followed by its input newline. tail -n 2 selects the last two lines.",
    },
    write: {
      prompt: "Print the last four lines of app.log. Which portable complete command fits?",
      choices: ["tail -n 4 app.log", "tail -n +4 app.log", "head -n 4 app.log", "tail -c 4 app.log"],
      correctChoice: "tail -n 4 app.log",
      answer: "tail -n 4 app.log selects the final four lines. The +4 form means something different: begin at line 4.",
    },
  },
  {
    command: "tail",
    concept: "start-at-line",
    label: "-n +N start at line N",
    platform: selectorPlatform,
    references: tailReferences,
    definition: {
      prompt: "How do tail -n N and tail -n +N differ?",
      answer: "tail -n N selects the last N lines. tail -n +N starts output at 1-based line N and continues through end-of-input, effectively skipping the first N−1 lines. The plus sign changes the reference point from the end to the beginning.\n\nMemory hook: +N means start positively at line N; no plus means count backward from the tail.",
    },
    read: {
      prompt: "Input (every line newline-terminated):\none\ntwo\nthree\nfour\nfive\n\nCommand:\ntail -n +3\n\nWhat exact lines are printed?",
      choices: ["three\nfour\nfive", "four\nfive", "one\ntwo\nthree", "three"],
      correctChoice: "three\nfour\nfive",
      answer: "three, four, and five, each newline-terminated. +3 starts at the third line rather than selecting the last three lines.",
    },
    write: {
      prompt: "Skip a CSV header and print from line 2 through end-of-file. Which complete command fits?",
      choices: ["tail -n +2 data.csv", "tail -n 2 data.csv", "head -n +2 data.csv", "tail -c +2 data.csv"],
      correctChoice: "tail -n +2 data.csv",
      answer: "tail -n +2 data.csv starts at line 2, so the first header line is omitted and every later line is printed.",
    },
  },
  {
    command: "tail",
    concept: "follow-appends",
    label: "-f follow appended data; -F follow a name",
    platform: selectorPlatform,
    references: tailReferences,
    definition: {
      prompt: "What evidence does tail follow mode provide, and how does -F differ across implementations?",
      answer: "tail -f first selects the requested end of a file, then waits and writes appended bytes as the open file grows. It follows one growing stream; it does not query or retain history. On GNU coreutils, -f follows the open descriptor by default, while -F means --follow=name --retry for a pathname that may be replaced during rotation. BSD/macOS also documents -F as following the filename across replacement, but the GNU long options and exact retry wording are not portable. Use plain -f for one open file and -F when log rotation by name is the realistic concern.\n\nMemory hook: -f follows growth; -F keeps finding the filename.",
    },
    read: {
      prompt: "app.log is renamed to app.log.1 during rotation and a new app.log is created. You need the new file's appended lines on GNU or macOS. Which short command is designed for that pathname-following scenario?",
      choices: ["tail -F app.log", "tail -f app.log.1", "watch 'tail -n 10 app.log'", "tail -n +1 app.log.1"],
      correctChoice: "tail -F app.log",
      answer: "tail -F app.log tracks the pathname across replacement on the documented GNU and BSD/macOS implementations. The implementation details differ, so the card does not universalize GNU long-option spelling.",
    },
    write: {
      prompt: "One regular file remains open and only grows. Stream bytes appended after the initial tail selection. Which complete command fits?",
      choices: ["tail -f app.log", "watch 'tail -n 10 app.log'", "head -n 10 app.log", "tail -n 10 app.log"],
      correctChoice: "tail -f app.log",
      answer: "tail -f app.log selects the current tail, keeps the file open, and writes data appended later. watch repeatedly reruns a command and refreshes a snapshot instead.",
    },
  },
  {
    command: "ps",
    concept: "snapshot-columns",
    label: "process snapshot and explicit columns",
    platform: psPlatform,
    references: psReferences,
    definition: {
      prompt: "What evidence does one ps invocation provide, and what do useful explicit columns mean?",
      answer: "ps reports a process snapshot gathered at one observation time, not a history or a continuously refreshed trace. PID identifies the process; PPID identifies its parent; STAT reports its current state and implementation-specific flags; ELAPSED is wall-clock time since start; %CPU and %MEM are implementation-defined utilization ratios reported in this snapshot; COMM is the executable name; ARGS is the command line. Select known processes with -p and request named fields with -o rather than parsing a platform's default layout.\n\nMemory hook: ps answers what the process table reports now; explicit columns name the evidence.",
    },
    read: {
      prompt: "Normalized Linux fixture from:\nps -p 4242 -o pid=PID,ppid=PPID,stat=STAT,etime=ELAPSED,pcpu=%CPU,pmem=%MEM,comm=COMM,args=ARGS\n\nPID   PPID  STAT  ELAPSED  %CPU  %MEM  COMM    ARGS\n4242  4010  S     01:23    2.5   0.4  python  python worker.py --queue sync\n\nWhat does this row support?",
      choices: [
        "PID 4242 is a child of 4010, is sleeping, has elapsed 1 minute 23 seconds, and reports 2.5% CPU plus 0.4% memory in this snapshot.",
        "PID 4242 used exactly 2.5 CPU cores for the entire last 1 minute 23 seconds.",
        "PID 4010 is a child of 4242 and is sleeping.",
        "The worker exited 1 minute 23 seconds ago.",
      ],
      correctChoice: "PID 4242 is a child of 4010, is sleeping, has elapsed 1 minute 23 seconds, and reports 2.5% CPU plus 0.4% memory in this snapshot.",
      answer: "PID and PPID establish the parent link; leading STAT S means interruptible sleep on this Linux fixture; ELAPSED is age, not exit time; the percentages are the implementation's reported snapshot values, not proof of a time series.",
    },
    write: {
      prompt: "On Linux procps, inspect only PID 4242 and name the identity, parent, state, age, executable, and full command-line columns. Which complete command fits?",
      choices: [
        "ps -p 4242 -o pid,ppid,stat,etime,comm,args",
        "ps aux",
        "pgrep -f 4242",
        "top -p 4242",
      ],
      correctChoice: "ps -p 4242 -o pid,ppid,stat,etime,comm,args",
      answer: "-p selects the exact PID and -o requests explicit fields. Default layouts vary, so naming columns makes the intended evidence reviewable.",
    },
  },
  {
    command: "ps",
    concept: "forms-and-tool-boundaries",
    label: "option families and neighboring tools",
    platform: psPlatform,
    references: psReferences,
    definition: {
      prompt: "How should you reason about ps aux, ps -ef, overloaded -u, and neighboring process tools?",
      answer: "ps aux uses BSD-style no-dash options; ps -ef uses the Unix/System V and POSIX-style dash options. Both commonly request broad process lists, but their selection rules, columns, and labels are not universally identical. Linux procps supports several option personalities and warns that mixing them can change behavior. -u is overloaded by syntax family: on Linux procps, bare u requests a user-oriented display while -u USER selects by effective user; current macOS uses -u USER for username selection while retaining ps aux as a legacy convenience. Do not treat ps -aux as a portable spelling. Use pgrep to find matching process IDs, top for repeated interactive utilization snapshots, and Linux /proc when raw kernel-exposed per-process files are the required evidence.\n\nMemory hook: first choose selection, snapshot versus refresh, and named fields; only then choose the local ps syntax.",
    },
    read: {
      prompt: "Which statement about these two commands is defensible across the documented Linux and macOS families?\n\nps aux\nps -ef",
      choices: [
        "They come from different option families and may select or format differently, so inspect named columns instead of assuming identical output.",
        "They are byte-for-byte aliases on every Unix-like system.",
        "Only ps aux can show processes owned by other users.",
        "ps -ef is a continuously refreshed dashboard.",
      ],
      correctChoice: "They come from different option families and may select or format differently, so inspect named columns instead of assuming identical output.",
      answer: "aux is BSD-style no-dash syntax; -ef is dash-prefixed Unix/System V and POSIX-style syntax. Implementations support overlapping behaviors, not a universal byte-for-byte alias contract.",
    },
    write: {
      prompt: "On Linux, you need only the PIDs whose command names match sshd, for use by another command. Which tool boundary fits best?",
      choices: ["pgrep -x sshd", "ps aux", "top", "cat /proc/self/status"],
      correctChoice: "pgrep -x sshd",
      answer: "pgrep is the direct process-ID selector. ps is better when you need a process snapshot with fields; top is for repeated interactive views; /proc is Linux-specific raw process state addressed by PID.",
    },
  },
  {
    command: "watch",
    concept: "refresh-snapshots",
    label: "poll and refresh snapshots",
    platform: watchPlatform,
    references: watchReferences,
    definition: {
      prompt: "What does Linux watch retain and display across refreshes, and what do -n and -d change?",
      answer: "watch produces repeated snapshots by rerunning a command and replacing the terminal with its newest full-screen output, every two seconds by default. -n SECONDS requests a different interval. -d highlights characters that changed between successive visible outputs; it does not retain or query history, build a metric series, or prove what happened between samples. tail -f serves a different boundary: it streams appended bytes from one growing file instead of rerunning a command.\n\nMemory hook: watch reruns and redraws; tail follows one stream.",
    },
    read: {
      prompt: "Normalized visible snapshots from watch -n 2 -d \"printf 'queue=%s\\n' 7\":\n\nt=0s: queue=7\nt=2s: queue=5\n\nWhat evidence does the highlighted 5 provide?",
      choices: [
        "The visible output changed from 7 to 5 between two refreshes; watch kept no full history of intermediate values.",
        "The queue decreased monotonically through every value from 7 to 5.",
        "The command emitted an append-only event containing 5.",
        "The queue stayed at 5 for exactly two seconds.",
      ],
      correctChoice: "The visible output changed from 7 to 5 between two refreshes; watch kept no full history of intermediate values.",
      answer: "-d compares successive visible screens. It can highlight the changed character, but polling did not observe any intermediate state and watch did not create a history database.",
    },
    write: {
      prompt: "On Linux, refresh a bounded process snapshot every 5 seconds and highlight changes. The inner pipeline must run anew each time. Which complete command fits?",
      choices: [
        "watch -n 5 -d 'ps -eo pid,stat,etime,comm | head -n 12'",
        "watch -n 5 -d ps -eo pid,stat,etime,comm | head -n 12",
        "tail -f app.log",
        "watch -n 5 'ps -eo pid,stat,etime,comm | head -n 12'",
      ],
      correctChoice: "watch -n 5 -d 'ps -eo pid,stat,etime,comm | head -n 12'",
      answer: "-n 5 sets the refresh request, -d highlights changed screen characters, and quoting keeps the pipeline inside the command that watch reruns.",
    },
  },
  {
    command: "watch",
    concept: "shell-command-boundary",
    label: "quote inner shell commands or use -x",
    platform: watchPlatform,
    references: watchReferences,
    definition: {
      prompt: "Which shell owns metacharacters in a watch command, and when does -x fit?",
      answer: "By default procps watch joins the command operands and gives them to /bin/sh -c on every refresh. Quote an entire pipeline or redirection in the calling shell so it reaches watch as one inner command. Without those quotes, the calling shell owns |, >, globbing, and command substitutions before watch starts. -x, also named --exec, bypasses watch's inner shell and executes the supplied argv directly; it is useful for a simple command whose arguments need no pipeline, expansion, or redirection. Use an explicit sh -c only when shell syntax is genuinely required.\n\nMemory hook: outer quotes move shell syntax across the watch boundary; -x removes that inner shell boundary.",
    },
    read: {
      prompt: "In an interactive shell, who owns the pipe here?\n\nwatch -n 2 ps -eo pid,comm | head -n 5",
      choices: [
        "The calling shell owns it, so head consumes watch's outer terminal stream rather than running inside every refresh.",
        "watch's inner /bin/sh owns it because every pipe after watch is automatically nested.",
        "ps owns it and sends five process rows back to watch.",
        "No shell parses it because watch always uses exec directly.",
      ],
      correctChoice: "The calling shell owns it, so head consumes watch's outer terminal stream rather than running inside every refresh.",
      answer: "The unquoted | is parsed before watch starts. Quote 'ps -eo pid,comm | head -n 5' to make the pipeline part of the command rerun by watch.",
    },
    write: {
      prompt: "On procps-ng, rerun ps with an exact argv and no shell parsing. Which complete command explicitly fits?",
      choices: [
        "watch -x -- ps -p 4242 -o pid,stat,etime,comm",
        "watch -- ps -p 4242 -o pid,stat,etime,comm",
        "watch 'ps -p 4242 -o pid,stat,etime,comm'",
        "watch ps -p 4242 > snapshot.txt",
      ],
      correctChoice: "watch -x -- ps -p 4242 -o pid,stat,etime,comm",
      answer: "-x bypasses /bin/sh -c and execs the supplied argument vector; -- ends watch option parsing before the ps command. A quoted pipeline is not executable syntax when the shell is bypassed.",
    },
  },
];
