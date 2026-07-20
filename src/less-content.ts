import type { CommandConcept } from "./command-content.js";

const lessReferences = {
  manual: {
    label: "Upstream less manual",
    url: "https://github.com/gwsw/less/blob/28ce5500f4f90f5be93204403c7e43462b9280eb/less.nro.VER",
  },
  man: {
    label: "man-db manual",
    url: "https://man7.org/linux/man-pages/man1/man.1.html",
  },
  bashBuiltins: {
    label: "GNU Bash manual, Bash Builtins",
    url: "https://www.gnu.org/software/bash/manual/html_node/Bash-Builtins.html",
  },
  rgManual: {
    label: "ripgrep user guide",
    url: "https://github.com/BurntSushi/ripgrep/blob/master/GUIDE.md",
  },
  tldr: {
    label: "TLDR pages",
    url: "https://github.com/tldr-pages/tldr",
  },
  tarManual: {
    label: "GNU tar manual",
    url: "https://www.gnu.org/software/tar/manual/tar.html",
  },
  emacsMan: {
    label: "GNU Emacs man.el",
    url: "https://github.com/emacs-mirror/emacs/blob/0f086c307c12b74aeedfba07cfe5b57ef2f99808/lisp/man.el",
  },
};

export const lessConcepts: CommandConcept[] = [
  {
    command: "less",
    concept: "pager-entry-points",
    label: "Pager entry points",
    platform: "less 708-era behavior; Bash pipelines; man configured to use less",
    references: [lessReferences.manual, lessReferences.man],
    definition: {
      prompt: "What job does less do, and how do files, command output, help output, and manual pages enter that workflow?",
      answer: "less is an interactive pager: it lets you inspect text without loading it into an editor or changing the input. Use less CHANGELOG.md for a file, rg --help | less for long help written to stdout, and git log --oneline | less for a producer pipeline. man bash normally renders the manual page and invokes its configured pager itself when stdout is a terminal, so do not add a redundant | less.\n\nMemory hook: produce or open text, then page it; man already knows the pager.",
    },
    read: {
      prompt: "Assume Bash, all named commands are installed, and man uses less as its pager. Match these needs in order: deep Bash reference; quick ripgrep syntax; inspect server.log; browse compact Git history.",
      choices: [
        "man bash; rg --help | less; less server.log; git log --oneline | less",
        "help bash; man rg --help; cat less server.log; less git log --oneline",
        "man bash | less; less rg --help; man server.log; git less log",
        "tldr bash; help rg; man server.log; git log --less",
      ],
      correctChoice: "man bash; rg --help | less; less server.log; git log --oneline | less",
      answer: "man bash; rg --help | less; less server.log; git log --oneline | less. The four paths are a manual, long help on stdout, a file, and a real producer pipeline.",
    },
    write: {
      prompt: "Assume rg writes its long help to stdout. Which complete short command pages that help?",
      choices: ["rg --help | less", "less rg --help", "man rg --help", "rg less --help"],
      correctChoice: "rg --help | less",
      answer: "rg --help | less. The pipe connects rg's stdout to less's stdin.",
    },
  },
  {
    command: "less",
    concept: "movement",
    label: "Space/b and j/k movement",
    platform: "less 708-era default keymap; fixture lines fit the terminal width",
    references: [lessReferences.manual],
    definition: {
      prompt: "Which common less keys move by a screen versus by one displayed line?",
      answer: "Space moves forward one screen and b moves backward one screen. j moves forward one displayed line and k moves backward one displayed line. These familiar pager and vi-style pairs cover most ordinary scanning without memorizing the full keymap.\n\nMemory hook: Space/b make big screen moves; j/k make small line moves.",
    },
    read: {
      prompt: "Assume every file line fits the terminal width. While reading less, you want to move one screen forward, one screen back, one line forward, then one line back. Which sequence fits?",
      choices: ["Space, b, j, k", "b, Space, k, j", "j, k, Space, b", "G, g, n, N"],
      correctChoice: "Space, b, j, k",
      answer: "Space, b, j, k. Space/b move by a screen; j/k move by one displayed line.",
    },
    write: {
      prompt: "You overshot while paging and want to move backward one screen. Which minimal key fits?",
      choices: ["b", "k", "N", "g"],
      correctChoice: "b",
      answer: "b moves backward one screen. k would move only one displayed line.",
    },
  },
  {
    command: "less",
    concept: "search-direction",
    label: "/ ? n N search",
    platform: "less 708-era default keymap; case-sensitive search default",
    references: [lessReferences.manual],
    definition: {
      prompt: "How do forward and backward search work in less, including repeated matches?",
      answer: "/pattern starts a forward search, while ?pattern starts a backward search. After either one, n repeats the previous search in the same direction and N repeats it in the opposite direction. n does not always mean forward; its direction comes from the search you started.\n\nMemory hook: n = next in the search's direction; Shift-N negates that direction.",
    },
    read: {
      prompt: "You are below several WARN lines. Search backward for WARN, continue to the next WARN toward the beginning, then reverse toward the end. Which sequence fits?",
      choices: ["?WARN, n, N", "/WARN, n, N", "?WARN, N, n", "/WARN, N, n"],
      correctChoice: "?WARN, n, N",
      answer: "?WARN, n, N. ? establishes a backward search; n continues backward, and N reverses toward the end.",
    },
    write: {
      prompt: "Your last search was ?timeout. Continue to another match toward the beginning. Which minimal key fits?",
      choices: ["n", "N", "/", "G"],
      correctChoice: "n",
      answer: "n repeats the previous search in its original direction, which is backward after ?timeout.",
    },
  },
  {
    command: "less",
    concept: "bounds-help-quit",
    label: "g G h q",
    platform: "less 708-era default keymap",
    references: [lessReferences.manual],
    definition: {
      prompt: "Which less keys jump to a file boundary, recover forgotten controls, and leave the pager?",
      answer: "g jumps to the beginning of the file and G jumps to the end. h opens less's built-in help, the best recovery when you forget a key, and q quits the pager.\n\nMemory hook: lowercase g goes to the first line, uppercase G to the far end; h = help and q = quit.",
    },
    read: {
      prompt: "In less, do these tasks in order: jump to the beginning; jump to the end; open pager help; exit. Which sequence fits?",
      choices: ["g, G, h, q", "G, g, q, h", "b, Space, man, exit", "Home, End, ?, Esc"],
      correctChoice: "g, G, h, q",
      answer: "g, G, h, q. These are direct beginning, end, built-in help, and quit commands.",
    },
    write: {
      prompt: "You are inside less and forgot the search key. Which single key opens less's own command summary?",
      choices: ["h", "?", "man", "q"],
      correctChoice: "h",
      answer: "h opens built-in pager help. ? starts a backward search instead.",
    },
  },
  {
    command: "less",
    concept: "long-lines",
    label: "Wrap vs -S chop",
    platform: "less 708-era defaults; ordinary text without preconfigured LESS options",
    references: [lessReferences.manual],
    definition: {
      prompt: "How does less display lines wider than the terminal, and when does -S help?",
      answer: "By default, less wraps a long file line onto additional screen lines. -S, or --chop-long-lines, chops the display at the right edge instead; the hidden text is not discarded. RightArrow shifts horizontally right to reveal later columns, and LeftArrow shifts back. Horizontal shifting temporarily behaves as if chopping were active.\n\nMemory hook: -S keeps each source line on one screen row; arrows slide across it.",
    },
    read: {
      prompt: "report.tsv has one very wide row per record. You want one screen row per record, then need to inspect columns beyond the right edge. Which workflow fits?",
      choices: [
        "less -S report.tsv, then RightArrow",
        "less report.tsv, then Space",
        "less -s report.tsv, then DownArrow",
        "less --wrap report.tsv, then G",
      ],
      correctChoice: "less -S report.tsv, then RightArrow",
      answer: "less -S report.tsv, then RightArrow. -S chops the display rather than wrapping; RightArrow shifts to hidden later columns.",
    },
    write: {
      prompt: "Open report.tsv with long lines chopped rather than wrapped. Which complete short command fits?",
      choices: ["less -S report.tsv", "less -s report.tsv", "less -R report.tsv", "less --wrap report.tsv"],
      correctChoice: "less -S report.tsv",
      answer: "less -S report.tsv uses --chop-long-lines. Lowercase -s instead squeezes repeated blank lines.",
    },
  },
  {
    command: "less",
    concept: "follow-mode",
    label: "F follow and Ctrl-C",
    platform: "less 708-era default interrupt character; regular growing file",
    references: [lessReferences.manual],
    definition: {
      prompt: "How do you follow a growing file in less, then return to normal navigation?",
      answer: "Press uppercase F to follow a growing file, continuing to read as new data arrives at end-of-file, similar to tail -f. Press the interrupt character, usually Ctrl-C, to stop waiting and return to normal pager control; then searches and movement work again. q quits less after you have returned to normal control. less +F app.log starts the pager in follow mode.\n\nMemory hook: F follows; Ctrl-C cancels following without closing the pager.",
    },
    read: {
      prompt: "You are viewing app.log in less at end-of-file. Start following new lines, stop waiting without exiting less, then search existing text forward for ERROR. Which sequence fits?",
      choices: ["F, Ctrl-C, /ERROR", "f, q, ?ERROR", "G, Ctrl-Z, n", "tail, Esc, /ERROR"],
      correctChoice: "F, Ctrl-C, /ERROR",
      answer: "F, Ctrl-C, /ERROR. F follows; Ctrl-C returns to normal pager control; /ERROR then searches forward.",
    },
    write: {
      prompt: "less is waiting in F follow mode. Which key chord normally returns to ordinary pager control without quitting?",
      choices: ["Ctrl-C", "q", "Ctrl-Z", "Esc"],
      correctChoice: "Ctrl-C",
      answer: "Ctrl-C is normally the interrupt character that stops waiting in F mode and returns to normal less control.",
    },
  },
  {
    command: "less",
    concept: "command-kind",
    label: "type and command -V",
    platform: "GNU Bash 5.x command resolution",
    references: [lessReferences.bashBuiltins],
    definition: {
      prompt: "Before looking up an unfamiliar command name in Bash, how do you identify what the shell will run?",
      answer: "Use type read or command -V rg for a descriptive answer. Bash can resolve a name to an alias, shell function, builtin, keyword, or executable file, and that kind determines where its behavior is defined. type -a printf shows every resolution Bash can find, while type -t printf returns a compact kind such as alias, function, builtin, or file.\n\nMemory hook: identify the command kind before choosing its documentation.",
    },
    read: {
      prompt: "Interactive Bash fixture: alias ll='ls -l'; build is a shell function; cd is the Bash builtin; /usr/bin/rg exists with no alias or function named rg. How does type -t classify ll, build, cd, and rg?",
      choices: [
        "ll: alias; build: function; cd: builtin; rg: executable file",
        "ll: function; build: alias; cd: executable file; rg: builtin",
        "ll: executable file; build: builtin; cd: alias; rg: function",
        "All four are executable files because Bash eventually runs code",
      ],
      correctChoice: "ll: alias; build: function; cd: builtin; rg: executable file",
      answer: "ll is an alias, build a function, cd a builtin, and rg an executable file. Bash's type -t prints file for the last category.",
    },
    write: {
      prompt: "Use Bash's command builtin to print a verbose description of what deploy resolves to. Which complete short command fits?",
      choices: ["command -V deploy", "command deploy -V", "man command deploy", "deploy --type"],
      correctChoice: "command -V deploy",
      answer: "command -V deploy asks Bash for a verbose command-resolution description without executing deploy.",
    },
  },
  {
    command: "less",
    concept: "documentation-source",
    label: "help vs --help vs man",
    platform: "GNU Bash 5.x; external commands following common --help and man conventions",
    references: [lessReferences.bashBuiltins, lessReferences.man, lessReferences.rgManual],
    definition: {
      prompt: "When should you use Bash help, a command's --help, or man?",
      answer: "Use Bash help read for a shell builtin because Bash itself defines that command; help -m read | less gives a longer pager-friendly form. Use rg --help for a quick invocation synopsis. Use man rg for authoritative, structured detail and related semantics. First identify the command kind, then choose the source and depth you need.\n\nMemory hook: help for the shell, --help for a quick start, man for the full contract.",
    },
    read: {
      prompt: "Assume Bash says printf is a builtin and rg is an external executable with both --help and a manual. Choose, in order: builtin syntax; quick rg invocation syntax; authoritative rg detail.",
      choices: [
        "help printf; rg --help; man rg",
        "printf --help; help rg; tldr rg",
        "man printf; man rg; rg --help",
        "type printf; type rg; command -V rg",
      ],
      correctChoice: "help printf; rg --help; man rg",
      answer: "help printf; rg --help; man rg. The sequence matches builtin ownership, quick executable syntax, and deep authoritative reference.",
    },
    write: {
      prompt: "Bash type reports that read is a shell builtin. Which complete short command opens its builtin documentation?",
      choices: ["help read", "read --help", "man read", "type --help read"],
      correctChoice: "help read",
      answer: "help read asks Bash for the builtin's own documentation.",
    },
  },
  {
    command: "less",
    concept: "examples-and-emacs",
    label: "TLDR and M-x man",
    platform: "TLDR client installed; GNU Emacs man.el; man pages installed",
    references: [lessReferences.tldr, lessReferences.tarManual, lessReferences.emacsMan, lessReferences.man],
    definition: {
      prompt: "Where do example-first TLDR pages and Emacs M-x man fit beside terminal manuals?",
      answer: "TLDR is an example-first aid for quickly seeing a few common invocations. It is supplemental, not semantic authority; confirm edge cases and complete behavior in --help or man. When already in Emacs, M-x man opens a persistent, fontified manual buffer suited to study, navigation, and following references without turning the terminal pager into an editor workflow.\n\nMemory hook: TLDR for an example, man for the contract, M-x man for a durable study buffer.",
    },
    read: {
      prompt: "Assume a TLDR client, man pages, and GNU Emacs are installed. Choose, in order: see a common tar invocation quickly; read authoritative tar detail; keep a fontified manual open while studying in Emacs.",
      choices: [
        "tldr tar; man tar; M-x man",
        "man tar; tldr tar; less tar",
        "tar --example; help tar; M-x less",
        "M-x man; man tar; tldr tar",
      ],
      correctChoice: "tldr tar; man tar; M-x man",
      answer: "tldr tar; man tar; M-x man. TLDR serves the example-first need, man supplies authority, and Emacs provides the persistent study buffer.",
    },
    write: {
      prompt: "You are already in Emacs and want a persistent, fontified manual buffer. Which short command path fits?",
      choices: ["M-x man", "M-x less", "man | emacs", "tldr --emacs"],
      correctChoice: "M-x man",
      answer: "M-x man uses Emacs's built-in manual-page workflow.",
    },
  },
];
