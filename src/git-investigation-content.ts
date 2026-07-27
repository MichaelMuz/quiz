import type { StaticItem } from "./content.js";

const statusReference = {
  label: "Git 2.47.3 git-status documentation, accessed 2026-07-27",
  url: "https://git-scm.com/docs/git-status",
};
const diffReference = {
  label: "Git 2.47.3 git-diff documentation, accessed 2026-07-27",
  url: "https://git-scm.com/docs/git-diff",
};
const logReference = {
  label: "Git 2.47.3 git-log documentation, accessed 2026-07-27",
  url: "https://git-scm.com/docs/git-log",
};
const showReference = {
  label: "Git 2.47.3 git-show documentation, accessed 2026-07-27",
  url: "https://git-scm.com/docs/git-show",
};
const blameReference = {
  label: "Git 2.47.3 git-blame documentation, accessed 2026-07-27",
  url: "https://git-scm.com/docs/git-blame",
};
const revisionsReference = {
  label: "Git 2.47.3 gitrevisions documentation, accessed 2026-07-27",
  url: "https://git-scm.com/docs/gitrevisions",
};
const mergeBaseReference = {
  label: "Git 2.47.3 git-merge-base documentation, accessed 2026-07-27",
  url: "https://git-scm.com/docs/git-merge-base",
};
const branchReference = {
  label: "Git 2.47.3 git-branch documentation, accessed 2026-07-27",
  url: "https://git-scm.com/docs/git-branch",
};
const remoteReference = {
  label: "Git 2.47.3 git-remote documentation, accessed 2026-07-27",
  url: "https://git-scm.com/docs/git-remote",
};
const showRefReference = {
  label: "Git 2.47.3 git-show-ref documentation, accessed 2026-07-27",
  url: "https://git-scm.com/docs/git-show-ref",
};
const revParseReference = {
  label: "Git 2.47.3 git-rev-parse documentation, accessed 2026-07-27",
  url: "https://git-scm.com/docs/git-rev-parse",
};
const lsFilesReference = {
  label: "Git 2.47.3 git-ls-files documentation, accessed 2026-07-27",
  url: "https://git-scm.com/docs/git-ls-files",
};
const checkIgnoreReference = {
  label: "Git 2.47.3 git-check-ignore documentation, accessed 2026-07-27",
  url: "https://git-scm.com/docs/git-check-ignore",
};
const reflogReference = {
  label: "Git 2.47.3 git-reflog documentation, accessed 2026-07-27",
  url: "https://git-scm.com/docs/git-reflog",
};

export const gitInvestigationItems: StaticItem[] = [
  {
    id: "git-investigate-status-layers",
    kind: "command",
    topic: "Git investigation",
    prompt: "Repository state:\n$ git status --short --branch\n## main\n M app.txt\nM  config.txt\n?? notes.txt\n\nWhich interpretation is supported by this snapshot?",
    choices: [
      "HEAD names main; app.txt differs in the worktree, config.txt differs in the index, and notes.txt is untracked. This does not prove whether main matches a remote.",
      "app.txt is staged, config.txt is only in the worktree, and notes.txt is ignored. main is synchronized with every remote.",
      "Both app.txt and config.txt are committed in HEAD; notes.txt is staged for addition.",
      "The worktree is clean because the branch header contains no ahead or behind count.",
    ],
    correctChoice: "HEAD names main; app.txt differs in the worktree, config.txt differs in the index, and notes.txt is untracked. This does not prove whether main matches a remote.",
    answer: "In short status, the first column reports the index relative to HEAD and the second reports the worktree relative to the index. ` M app.txt` is an unstaged worktree change, `M  config.txt` is a staged index change, and `?? notes.txt` is untracked. `## main` names the current branch, but without upstream evidence this output does not prove whether the local branch matches any remote.",
    references: [statusReference],
  },
  {
    id: "git-investigate-diff-layers",
    kind: "command",
    topic: "Git investigation",
    prompt: "The same repository has an unstaged edit in app.txt and a staged edit in config.txt. Match each read-only query to its evidence:\n\ngit diff -- app.txt\ngit diff --staged -- config.txt\ngit diff --stat\ngit diff --staged --name-status",
    choices: [
      "app.txt worktree vs index patch; config.txt index vs HEAD patch; unstaged summary; staged path plus status letter",
      "app.txt index vs HEAD patch; config.txt worktree vs index patch; staged summary; untracked paths",
      "Two commit-to-commit patches; remote summary; local branch names; reflog entries",
      "All four queries compare the worktree directly with HEAD and include untracked files",
    ],
    correctChoice: "app.txt worktree vs index patch; config.txt index vs HEAD patch; unstaged summary; staged path plus status letter",
    answer: "Plain `git diff` compares the worktree with the index, so it shows the unstaged app.txt patch. `git diff --staged` compares the index with HEAD, so it shows the staged config.txt patch. `--stat` summarizes changed paths and line counts for the selected comparison, while `--name-status` reports paths with status letters. Neither view includes an untracked file merely because status reported it.",
    references: [diffReference],
  },
  {
    id: "git-investigate-history-overview",
    kind: "command",
    topic: "Git investigation",
    prompt: "You need a compact view of commits reachable from every local ref, with ref names and graph shape. Which query starts there?\n\ngit log --oneline --decorate --graph --all\ngit show HEAD\ngit status --short --branch\ngit reflog",
    choices: [
      "git log --oneline --decorate --graph --all",
      "git show HEAD",
      "git status --short --branch",
      "git reflog",
    ],
    correctChoice: "git log --oneline --decorate --graph --all",
    answer: "`git log --oneline --decorate --graph --all` shows compact commit history reachable from the selected refs, with decorations and a graph aid. It does not show every object or explain intent. After identifying a commit, `git show HEAD` inspects one object and, for a commit, normally shows its metadata and patch. A patch records a change, but still does not prove the author's intent.",
    references: [logReference, showReference],
  },
  {
    id: "git-investigate-path-history",
    kind: "command",
    topic: "Git investigation",
    prompt: "A docs-only commit should not distract you. Which query lists commits that changed app.txt?\n\ngit log --oneline -- app.txt\ngit show HEAD -- app.txt\ngit log --oneline --all\ngit diff -- app.txt",
    choices: [
      "git log --oneline -- app.txt",
      "git show HEAD -- app.txt",
      "git log --oneline --all",
      "git diff -- app.txt",
    ],
    correctChoice: "git log --oneline -- app.txt",
    answer: "`git log --oneline -- app.txt` limits history to commits whose changes touch app.txt. The `--` ends revision parsing and makes the following token a pathspec. This basic form does not follow renames; add `--follow` deliberately for the limited single-path rename heuristic when that is the investigation.",
    references: [logReference],
  },
  {
    id: "git-investigate-pickaxe-v-regex",
    kind: "command",
    topic: "Git investigation",
    prompt: "After tag base, commit “rename mode value” changes mode=old to mode=new, then “add needle” appends needle. Which query finds the rename commit?\n\ngit log --format='%s' -S'mode=' base..HEAD -- app.txt\ngit log --format='%s' -G'^mode=' base..HEAD -- app.txt\ngit log --format='%s' -S'needle' base..HEAD -- app.txt",
    choices: [
      "git log --format='%s' -G'^mode=' base..HEAD -- app.txt",
      "git log --format='%s' -S'mode=' base..HEAD -- app.txt",
      "git log --format='%s' -S'needle' base..HEAD -- app.txt",
      "All three queries return only rename mode value",
    ],
    correctChoice: "git log --format='%s' -G'^mode=' base..HEAD -- app.txt",
    answer: "`-S'mode='` selects commits that change the number of occurrences of the exact string, so replacing mode=old with mode=new keeps that count unchanged. `-G'^mode='` selects commits whose added or removed patch lines match the regex, so it finds the rename commit. `-S'needle'` finds the later commit that changes needle's occurrence count. Pickaxe evidence identifies matching patches, not why the change was made.",
    references: [logReference],
  },
  {
    id: "git-investigate-line-provenance",
    kind: "command",
    topic: "Git investigation",
    prompt: "Normalized excerpt:\n$ git blame -L 2,2 --line-porcelain app.txt\n<oid> 2 2 1\nauthor Quiz Author\nsummary revise greeting\nfilename app.txt\n\thello new\n\nWhat does this evidence support?",
    choices: [
      "The current line 2 is attributed to the most recent commit that changed it, revise greeting; this does not establish original authorship, intent, or culpability.",
      "Quiz Author originally invented the line and is responsible for every later behavior involving it.",
      "The line has never moved, been copied, or been reformatted because blame returned one commit.",
      "The commit is the first commit in repository history because the output includes an object ID.",
    ],
    correctChoice: "The current line 2 is attributed to the most recent commit that changed it, revise greeting; this does not establish original authorship, intent, or culpability.",
    answer: "For the current line and selected revision, blame attributes the line to the most recent commit that changed it under the chosen detection options. It does not prove the original author, the author's intent, or culpability. Moves, copies, large formatting changes, and later edits can change the attribution, so use the commit as a provenance lead and inspect its context.",
    references: [blameReference],
  },
  {
    id: "git-investigate-two-dot-history",
    kind: "command",
    topic: "Git investigation",
    prompt: "Diverged graph: main has “main only”; topic has “topic one” then “topic two”; both descend from base.\n\ngit merge-base main topic\n→ <base-oid>\n\ngit log --format='%s' main..topic\n→ topic two\n→ topic one\n\nWhat do these queries establish?",
    choices: [
      "merge-base identifies the best common ancestor; main..topic lists commits reachable from topic while excluding commits reachable from main",
      "merge-base identifies the newest commit on main; main..topic compares the two endpoint file trees",
      "Both queries list commits reachable from either side but not both",
      "main..topic lists only the common history shared by the branches",
    ],
    correctChoice: "merge-base identifies the best common ancestor; main..topic lists commits reachable from topic while excluding commits reachable from main",
    answer: "`git merge-base main topic` identifies a best common ancestor for the two tips. In a log revision walk, `main..topic` means commits reachable from topic excluding every commit reachable from main, so it returns topic two and topic one. This is a commit-set query, not a statement about uncommitted changes or remote synchronization.",
    references: [mergeBaseReference, revisionsReference, logReference],
  },
  {
    id: "git-investigate-log-three-dot",
    kind: "command",
    topic: "Git investigation",
    prompt: "On the same diverged graph, normalized output is:\n\ngit log --left-right --format='%m%s' main...topic\n→ <main only\n→ >topic two\n→ >topic one\n\nWhich commit set does log's three-dot range select?",
    choices: [
      "Commits reachable from either main or topic but not from both; --left-right marks which side alone reaches each commit",
      "Only commits reachable from topic but not main",
      "The patch from the merge base to topic",
      "Only the common ancestors of main and topic",
    ],
    correctChoice: "Commits reachable from either main or topic but not from both; --left-right marks which side alone reaches each commit",
    answer: "For revision walking, `git log main...topic` selects the symmetric difference: commits reachable from either endpoint but not both. The shared base is excluded. `--left-right` annotates which endpoint alone reaches each result; it does not change the selected set.",
    references: [revisionsReference, logReference],
  },
  {
    id: "git-investigate-diff-three-dot",
    kind: "command",
    topic: "Git investigation",
    prompt: "Same graph and files:\n\ngit diff --name-status main...topic\n→ A  topic-one.txt\n→ A  topic-two.txt\n\ngit diff --name-status main..topic\n→ D  main.txt\n→ A  topic-one.txt\n→ A  topic-two.txt\n\nWhy do these differ?",
    choices: [
      "diff main...topic compares merge-base(main, topic) with topic; diff main..topic compares the main and topic endpoint trees",
      "diff main...topic is log's symmetric-difference commit set rendered as one patch",
      "diff main..topic means commits reachable from topic excluding main",
      "Three dots include untracked files while two dots exclude them",
    ],
    correctChoice: "diff main...topic compares merge-base(main, topic) with topic; diff main..topic compares the main and topic endpoint trees",
    answer: "For `git diff`, `main...topic` compares the merge-base tree with topic, so main-only changes are outside that patch. It is not the symmetric difference used by `git log main...topic`. In two-endpoint diff syntax, `main..topic` is equivalent to comparing the main and topic endpoint trees, so main.txt appears as deleted while topic files appear as added.",
    references: [diffReference, revisionsReference],
  },
  {
    id: "git-investigate-refs-upstreams-remotes",
    kind: "command",
    topic: "Git investigation",
    prompt: "Normalized local evidence:\n\ngit branch -vv --no-color\n→ * main  <oid> [origin/main] base\n→   topic <oid> [origin/topic] base\n\ngit remote -v\n→ origin  <fixture>/remote.git (fetch)\n→ origin  <fixture>/remote.git (push)\n\ngit show-ref --verify refs/heads/topic\n→ <oid> refs/heads/topic\n\ngit rev-parse --abbrev-ref main@{upstream}\n→ origin/main\n\nWhat is justified?",
    choices: [
      "The repository has local main and topic refs, configured upstreams, and configured origin URLs; these local records do not prove the server's current state",
      "origin/main is live server output fetched by branch -vv, so local main is certainly synchronized now",
      "remote -v contacts the server and verifies both branches exist there",
      "show-ref proves topic is the current branch and has no upstream",
    ],
    correctChoice: "The repository has local main and topic refs, configured upstreams, and configured origin URLs; these local records do not prove the server's current state",
    answer: "`git branch -vv` lists local branches and their configured upstream relationships. `git remote -v` lists configured remote URLs. `git show-ref --verify refs/heads/topic` verifies that exact local ref, while `git rev-parse --abbrev-ref main@{upstream}` resolves main's configured upstream name. These are local records and do not prove the server's current state; a network fetch would update remote-tracking evidence.",
    references: [branchReference, remoteReference, showRefReference, revParseReference],
  },
  {
    id: "git-investigate-tracked-v-ignored",
    kind: "command",
    topic: "Git investigation",
    prompt: "Fixture has .gitignore containing *.log. Normalized output:\n\ngit ls-files\n→ .gitignore\n→ tracked.log\n\ngit check-ignore -v ignored.log\n→ .gitignore:1:*.log  ignored.log\n\ngit status --short\n→ ?? notes.txt\n\nWhich interpretation is supported?",
    choices: [
      "tracked.log remains tracked; ignored.log matches the shown ignore rule; notes.txt is untracked and not ignored",
      "Both log files are untracked because .gitignore applies retroactively to tracked files",
      "notes.txt is ignored because status reports it with question marks",
      "check-ignore proves ignored.log was never committed anywhere in history",
    ],
    correctChoice: "tracked.log remains tracked; ignored.log matches the shown ignore rule; notes.txt is untracked and not ignored",
    answer: "`git ls-files` shows tracked.log in the index, so a later *.log rule does not make it untracked. `git check-ignore -v ignored.log` names the exact ignore rule that excludes ignored.log. `?? notes.txt` means notes.txt is untracked and visible to status, therefore it is not hidden by an ignore rule. None of these queries searches past commits.",
    references: [lsFilesReference, checkIgnoreReference, statusReference],
  },
  {
    id: "git-investigate-reflog-local",
    kind: "command",
    topic: "Git investigation",
    prompt: "Normalized local output:\n\ngit reflog --format='%gs' -2 HEAD\n→ commit: second\n→ commit (initial): base\n\nWhat can this recoverable-looking evidence actually establish?",
    choices: [
      "This clone recorded two recent HEAD movements; reflog entries are local and may expire, so this is not shared repository history",
      "Every clone and remote stores these exact two reflog entries forever",
      "The repository has only two commits reachable from all refs",
      "The second commit is unreachable because it appears in the reflog",
    ],
    correctChoice: "This clone recorded two recent HEAD movements; reflog entries are local and may expire, so this is not shared repository history",
    answer: "A reflog is a local journal of ref movement, useful for finding prior values after local operations. Entries may expire under retention rules. The journal is not shared with other clones or remotes, and it is not commit history: reachable commits can appear there, while an old reflog entry can also be the temporary lead to an otherwise unreachable commit.",
    references: [reflogReference],
  },
];
