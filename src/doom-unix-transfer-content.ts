import type { StaticItem } from "./content.js";

const currentDoomConfig = {
  label: "Michael's Doom config at 8bc5034",
  url: "https://gitlab.com/michael-muzafarov/doom_emacs_config/-/blob/8bc50346e38376bd06d2bffd077304598d5507a2/config.org",
};
const doomBindings = {
  label: "Doom default bindings at 28f09d8",
  url: "https://github.com/doomemacs/modules/blob/28f09d8afe81fa47ab83020b072f0dfa2f79dbdb/modules/config/default/+evil-bindings.el",
};
const doomSearch = {
  label: "Doom search wrappers at 28f09d8",
  url: "https://github.com/doomemacs/modules/blob/28f09d8afe81fa47ab83020b072f0dfa2f79dbdb/modules/config/default/autoload/search.el#L4-L125",
};
const doomVertico = {
  label: "Doom Vertico search at 28f09d8",
  url: "https://github.com/doomemacs/modules/blob/28f09d8afe81fa47ab83020b072f0dfa2f79dbdb/modules/completion/vertico/autoload/vertico.el#L4-L44",
};
const consultSource = {
  label: "Consult at 540ad1e",
  url: "https://github.com/minad/consult/blob/540ad1e59ef80b1c8dd712cbbaae8957533ad02c/consult.el#L5315-L5406",
};
const evilSource = {
  label: "Evil at 3b678a2",
  url: "https://github.com/emacs-evil/evil/blob/3b678a221ee99cc6a95b01d7a3129ce5efc4c3da/evil-commands.el#L3292-L3607",
};
const wgrepSource = {
  label: "wgrep at 49f09ab",
  url: "https://github.com/mhayashi1120/Emacs-wgrep/blob/49f09ab9b706d2312cab1199e1eeb1bcd3f27f6f/wgrep.el#L996-L1010",
};

export const doomUnixTransferItems: StaticItem[] = [
  {
    id: "doom-unix-search-surface-map",
    kind: "flashcard",
    topic: "Doom ↔ Unix transfer",
    prompt: "For SPC SPC, SPC /, SPC s d, SPC s p, SPC s b, and SPC s B, name the source and search engine. Which prompts are not raw rg syntax?",
    answer: "SPC SPC asks Projectile for project file-name candidates. Doom enumerates them with fd when available, then rg --files as fallback; completion filters those paths. It does not search file content. SPC / searches the current project's files on disk through Consult and ripgrep. SPC s d uses that same content-search path under the current directory. Michael remaps SPC s p to the same search in another known project. SPC s b uses consult-line on the current buffer's in-memory contents, while SPC s B uses consult-line-multi across open buffers, so both can see unsaved text. The SPC / and SPC s d/p prompts accept Consult's Emacs regexp input, split space-separated components, and translate them before invoking ripgrep. They are not raw rg command lines or raw Rust/PCRE2 regex prompts.",
    references: [currentDoomConfig, doomBindings, doomSearch, doomVertico, consultSource],
  },
  {
    id: "doom-unix-search-scope-choice",
    kind: "flashcard",
    topic: "Doom ↔ Unix transfer",
    prompt: "You added TODO99 to an unsaved buffer and want one search across every open buffer. Which current Doom binding has the right source and scope?",
    answer: "Use SPC s B. It runs consult-line-multi over all open buffer contents and can see unsaved text. SPC s b is only the current buffer. SPC / and SPC s d/p search files on disk through ripgrep, so they do not see unsaved buffer changes.",
    choices: [
      "SPC s B, because Consult searches all open buffer contents",
      "SPC /, because ripgrep searches the current project files",
      "SPC s d, because ripgrep searches below the current directory",
      "SPC SPC, because Projectile enumerates project file names",
    ],
    correctChoice: "SPC s B, because Consult searches all open buffer contents",
    references: [currentDoomConfig, doomBindings],
  },
  {
    id: "doom-unix-filter-exact-output",
    kind: "bash",
    topic: "Doom ↔ Unix transfer",
    prompt: "Shared fixture, four newline-terminated lines:\nbeta\nALPHA\nbeta\nAlpha\n\nShell form:\nprintf '%s\\n' beta ALPHA beta Alpha | tr '[:upper:]' '[:lower:]' | sort -u\n\nDoom/Evil form: select those same four lines, press !, then enter:\ntr '[:upper:]' '[:lower:]' | sort -u\n\nWhat exact stdout does the shell produce, and what exact text replaces the selected buffer range?",
    answer: "Both forms produce two newline-terminated lines:\nalpha\nbeta\n\nThe shell pipeline receives the fixture on stdin and writes normalized, unique, sorted text to stdout. Evil's visual ! sends the selected in-memory text to the same shell pipeline and replaces that range with successful stdout. The replacement changes the buffer, not the file on disk, until a save.",
    choices: [
      "alpha\nbeta\n(final newline present)",
      "beta\nalpha\n(final newline present)",
      "ALPHA\nAlpha\nbeta\n(final newline present)",
      "alpha\nbeta\nbeta\n(final newline present)",
    ],
    correctChoice: "alpha\nbeta\n(final newline present)",
    references: [evilSource, { label: "POSIX tr", url: "https://pubs.opengroup.org/onlinepubs/9799919799/utilities/tr.html" }, { label: "POSIX sort", url: "https://pubs.opengroup.org/onlinepubs/9799919799/utilities/sort.html" }],
  },
  {
    id: "doom-unix-filter-scope-map",
    kind: "flashcard",
    topic: "Doom ↔ Unix transfer",
    prompt: "Match Evil's shell-filter forms to their source scope: !{motion}, visual !, !!, and :%!. What changes immediately?",
    answer: "!{motion} filters the text covered by the motion. Visual ! filters the selected range. !! filters the current line. :%! filters the whole buffer. Each sends the range to the shell command's stdin and replaces it with successful stdout. This mutates the in-memory buffer only; the file on disk changes when you deliberately save. At the pinned Evil implementation, a failing filter preserves the original range and displays the command error instead of replacing it with failed output.",
    choices: [
      "motion range; visual range; current line; whole buffer",
      "current file; selected files; current line; whole project",
      "motion range; visual range; whole buffer; current file on disk",
      "current line; visual range; motion range; all open buffers",
    ],
    correctChoice: "motion range; visual range; current line; whole buffer",
    references: [evilSource],
  },
  {
    id: "doom-unix-read-v-write-boundary",
    kind: "flashcard",
    topic: "Doom ↔ Unix transfer",
    prompt: "Which Evil Ex forms insert command output and inspect the whole buffer without replacing it?",
    answer: ":read !command runs the command and inserts its stdout below the current line; it does not replace existing text. :%write !command sends the whole buffer to the command's stdin; it does not replace the in-memory text. The % range makes the whole-buffer scope explicit. Neither form writes the visited file merely because it ran a shell command.",
    choices: [
      ":read !command inserts stdout; :%write !command sends the whole buffer without replacing it",
      ":read !command replaces the buffer; :%!command only inspects it",
      ":write !command inserts stdout; :read !command saves it to disk",
      ":%!command inserts stdout; :%write !command replaces the whole buffer",
    ],
    correctChoice: ":read !command inserts stdout; :%write !command sends the whole buffer without replacing it",
    references: [evilSource],
  },
  {
    id: "doom-unix-wgrep-write-pipeline",
    kind: "ordering",
    topic: "Doom ↔ Unix transfer",
    prompt: "Order the current Doom SPC / to multi-file write path. Stop at the first operation that persists file bytes.",
    orderedItems: [
      "SPC / asks Doom for an rg-backed project search over files on disk",
      "C-c C-e exports the Consult grep candidates through Embark into writable wgrep results",
      "Editing the exported result changes the wgrep buffer, not the files yet",
      "Finishing the wgrep edit applies changes and Doom's auto-save setting writes the affected file buffers",
    ],
    answer: "Search is read-only: rg supplies matches and Consult presents candidates. C-c C-e deliberately exports those candidates through Embark and enters wgrep. Typing in the exported results still edits only that result buffer. Finishing the wgrep edit is the write boundary in this Doom configuration: wgrep applies edits to file-backed buffers, and Doom sets wgrep-auto-save-buffer, so those affected buffers are saved to disk. Abort instead if you do not intend to write.",
    references: [doomVertico, { label: "Doom Vertico config at 28f09d8", url: "https://github.com/doomemacs/modules/blob/28f09d8afe81fa47ab83020b072f0dfa2f79dbdb/modules/completion/vertico/config.el#L315-L325" }, wgrepSource],
  },
  {
    id: "doom-unix-regex-common-subset",
    kind: "flashcard",
    topic: "Doom ↔ Unix transfer",
    prompt: "Which pattern is a useful common subset for matching TODO followed by one or more ASCII digits in plain rg, the SPC / Consult prompt, and Michael's default Evil search?",
    answer: "TODO[0-9][0-9]* is a deliberately small common subset: literal text, a character class, and *. It is not a universal regex language. The engines and wrappers still differ: plain rg uses Rust regex, SPC / accepts Emacs regexp and translates it for rg, and Evil search uses its configured Vim-style translation. Prefer each dialect's clearer operator when staying on one surface.",
    choices: [
      "TODO[0-9][0-9]*",
      "TODO\\d+",
      "(?<=TODO)[0-9]+",
      "TODO{digit}+",
    ],
    correctChoice: "TODO[0-9][0-9]*",
    references: [consultSource, { label: "ripgrep regex syntax", url: "https://docs.rs/regex/latest/regex/#syntax" }, { label: "Evil search variables at 3b678a2", url: "https://github.com/emacs-evil/evil/blob/3b678a221ee99cc6a95b01d7a3129ce5efc4c3da/evil-vars.el" }],
  },
  {
    id: "doom-unix-regex-lookbehind-boundary",
    kind: "flashcard",
    topic: "Doom ↔ Unix transfer",
    prompt: "You used (?<=ticket:)[0-9]+ with rg -P to print only the digits after ticket:. Where can you paste that exact pattern unchanged?",
    answer: "Only the explicit rg -P case promises PCRE2 syntax here. Do not paste that lookbehind unchanged into plain rg, SPC /, or Evil search. Plain rg defaults to Rust regex without look-around. SPC / accepts Emacs regexp and lets Consult translate it. Evil uses its configured Vim-style search translation. On those surfaces, rewrite the goal in that dialect, for example match ticket: plus the digits when a wider match is acceptable, rather than assuming PCRE2 syntax transfers.",
    choices: [
      "Only rg -P, because it selects PCRE2; not plain rg, SPC /, or Evil search",
      "Plain rg and rg -P, but not SPC / or Evil search",
      "SPC / only, because Consult invokes ripgrep",
      "Every surface, because all regular expressions share lookbehind syntax",
    ],
    correctChoice: "Only rg -P, because it selects PCRE2; not plain rg, SPC /, or Evil search",
    references: [consultSource, { label: "ripgrep FAQ, look-around", url: "https://github.com/BurntSushi/ripgrep/blob/master/FAQ.md#how-do-i-use-lookaround-and-backreferences" }],
  },
  {
    id: "doom-unix-boundary-diagnosis",
    kind: "flashcard",
    topic: "Doom ↔ Unix transfer",
    prompt: "SPC s b finds UNSAVED_ONLY, but rg UNSAVED_ONLY . in the project terminal finds nothing. What does this prove, and what does it not prove?",
    answer: "It proves the searches read different sources: SPC s b uses consult-line over the current in-memory buffer, while rg reads saved files on disk. It does not prove either regex engine is wrong, that ignore rules hid the text, or that saving happened. Save the buffer, then rerun rg if you want both tools to inspect the same bytes.",
    choices: [
      "SPC s b reads the in-memory buffer; rg reads saved files on disk, so save before comparing engines",
      "SPC s b secretly runs rg with an unsaved-buffer flag",
      "rg cannot search uppercase text unless -P is enabled",
      "Doom automatically saved the buffer but rg ignored the file",
    ],
    correctChoice: "SPC s b reads the in-memory buffer; rg reads saved files on disk, so save before comparing engines",
    references: [doomBindings, consultSource],
  },
];
