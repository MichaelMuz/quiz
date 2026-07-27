import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contentBank } from "../src/content.js";
import { chooseStableId } from "../src/scheduler.js";
import { QuizStore } from "../src/store.js";

const gitVersion = "2.47.3";
const accessedAt = "2026-07-27";

type Repo = {
  dir: string;
  git: (args: string[], extraEnv?: Record<string, string>) => string;
};

function withRepo(run: (repo: Repo) => void): void {
  const dir = mkdtempSync(join(tmpdir(), "quiz-git-investigation-"));
  const baseEnv = {
    ...process.env,
    HOME: dir,
    LC_ALL: "C",
    LANG: "C",
    TERM: "dumb",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_PAGER: "cat",
    GIT_AUTHOR_NAME: "Quiz Author",
    GIT_AUTHOR_EMAIL: "quiz@example.invalid",
    GIT_COMMITTER_NAME: "Quiz Committer",
    GIT_COMMITTER_EMAIL: "quiz@example.invalid",
  };
  const git = (args: string[], extraEnv: Record<string, string> = {}) => execFileSync("git", args, {
    cwd: dir,
    encoding: "utf8",
    env: { ...baseEnv, ...extraEnv },
  });

  try {
    git(["init", "--initial-branch=main"]);
    run({ dir, git });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function commit(repo: Repo, message: string, timestamp: string): void {
  repo.git(["add", "--all"]);
  repo.git(["commit", "-m", message], {
    GIT_AUTHOR_DATE: timestamp,
    GIT_COMMITTER_DATE: timestamp,
  });
}

function item(id: string) {
  return contentBank.find((candidate) => candidate.id === id);
}

describe("read-only Git repository investigation", () => {
  it("keeps worktree, index, and HEAD evidence distinct", () => {
    const status = item("git-investigate-status-layers");
    const diffs = item("git-investigate-diff-layers");
    expect(status).toBeDefined();
    expect(diffs).toBeDefined();
    expect(status!.topic).toBe("Git investigation");
    expect(status!.prompt).toContain("git status --short --branch");
    expect(status!.prompt).toContain(" M app.txt");
    expect(status!.prompt).toContain("M  config.txt");
    expect(status!.prompt).toContain("?? notes.txt");
    expect(status!.answer).toMatch(/index.*HEAD.*worktree.*index/is);
    expect(status!.answer).toMatch(/untracked.*does not prove.*remote/is);
    expect(diffs!.prompt).toMatch(/git diff -- app\.txt.*git diff --staged -- config\.txt.*git diff --stat.*git diff --staged --name-status/s);
    expect(diffs!.answer).toMatch(/worktree.*index.*--staged.*index.*HEAD/is);
    expect(diffs!.answer).toMatch(/--stat.*--name-status/is);

    for (const candidate of [status!, diffs!]) {
      expect(candidate.correctChoice).toBeDefined();
      expect(candidate.choices).toContain(candidate.correctChoice);
      expect(candidate.references?.map(({ label }) => label).join(" ")).toContain(`Git ${gitVersion}`);
      expect(candidate.references?.map(({ label }) => label).join(" ")).toContain(accessedAt);
    }

    withRepo((repo) => {
      writeFileSync(join(repo.dir, "app.txt"), "base\n");
      writeFileSync(join(repo.dir, "config.txt"), "base\n");
      commit(repo, "base", "2026-01-01T00:00:00Z");
      writeFileSync(join(repo.dir, "config.txt"), "base\nstaged\n");
      repo.git(["add", "config.txt"]);
      writeFileSync(join(repo.dir, "app.txt"), "base\nworktree\n");
      writeFileSync(join(repo.dir, "notes.txt"), "untracked\n");

      expect(repo.git(["status", "--short", "--branch"])).toBe(
        "## main\n M app.txt\nM  config.txt\n?? notes.txt\n",
      );
      expect(repo.git(["diff", "--", "app.txt"])).toContain("+worktree");
      expect(repo.git(["diff", "--staged", "--", "config.txt"])).toContain("+staged");
      expect(repo.git(["diff", "--stat"])).toMatch(/app\.txt\s+\|\s+1 \+/);
      expect(repo.git(["diff", "--staged", "--name-status"])).toBe("M\tconfig.txt\n");
      expect(readFileSync(join(repo.dir, "notes.txt"), "utf8")).toBe("untracked\n");
    });
  });

  it("uses history queries to inspect reachability, one object, a path, and changed text", () => {
    const overview = item("git-investigate-history-overview");
    const pathHistory = item("git-investigate-path-history");
    const pickaxe = item("git-investigate-pickaxe-v-regex");
    expect(overview).toBeDefined();
    expect(pathHistory).toBeDefined();
    expect(pickaxe).toBeDefined();
    expect(overview!.prompt).toContain("git log --oneline --decorate --graph --all");
    expect(overview!.answer).toMatch(/reachable.*refs.*git show.*one object.*patch.*does not prove.*intent/is);
    expect(pathHistory!.prompt).toContain("git log --oneline -- app.txt");
    expect(pathHistory!.answer).toMatch(/touch.*app\.txt.*pathspec.*does not follow renames/is);
    expect(pickaxe!.prompt).toMatch(/git log.*-S'mode='.*git log.*-G'\^mode='.*git log.*-S'needle'/s);
    expect(pickaxe!.answer).toMatch(/-S.*number of occurrences.*exact string/is);
    expect(pickaxe!.answer).toMatch(/-G.*patch lines.*regex/is);
    expect(pickaxe!.correctChoice).toMatch(/-G'\^mode='/);

    for (const candidate of [overview!, pathHistory!, pickaxe!]) {
      expect(candidate.choices).toContain(candidate.correctChoice);
      expect(candidate.references?.every(({ url }) => url.startsWith("https://git-scm.com/docs/"))).toBe(true);
    }

    withRepo((repo) => {
      writeFileSync(join(repo.dir, "app.txt"), "mode=old\n");
      commit(repo, "base", "2026-01-01T00:00:00Z");
      repo.git(["tag", "base"]);
      writeFileSync(join(repo.dir, "app.txt"), "mode=new\n");
      commit(repo, "rename mode value", "2026-01-02T00:00:00Z");
      writeFileSync(join(repo.dir, "app.txt"), "mode=new\nneedle\n");
      commit(repo, "add needle", "2026-01-03T00:00:00Z");
      writeFileSync(join(repo.dir, "README.md"), "docs\n");
      commit(repo, "docs only", "2026-01-04T00:00:00Z");

      const graph = repo.git(["log", "--oneline", "--decorate", "--graph", "--all"])
        .replace(/[0-9a-f]{7,40}/g, "<oid>");
      expect(graph).toBe(
        "* <oid> (HEAD -> main) docs only\n* <oid> add needle\n* <oid> rename mode value\n* <oid> (tag: base) base\n",
      );
      expect(repo.git(["show", "--format=%s", "--no-ext-diff", "HEAD", "--", "README.md"]))
        .toMatch(/^docs only\n[\s\S]*\+docs\n$/);
      expect(repo.git(["show", "HEAD"])).toContain("docs only");
      expect(repo.git(["log", "--format=%s", "--", "app.txt"])).toBe(
        "add needle\nrename mode value\nbase\n",
      );
      expect(repo.git(["show", "HEAD", "--", "app.txt"])).toBe("");
      expect(repo.git(["log", "--oneline", "--all"])).toContain("docs only");
      expect(repo.git(["diff", "--", "app.txt"])).toBe("");
      expect(repo.git(["log", "--format=%s", "-S", "mode=", "base..HEAD", "--", "app.txt"])).toBe("");
      expect(repo.git(["log", "--format=%s", "-G", "^mode=", "base..HEAD", "--", "app.txt"])).toBe(
        "rename mode value\n",
      );
      expect(repo.git(["log", "--format=%s", "-S", "needle", "base..HEAD", "--", "app.txt"])).toBe(
        "add needle\n",
      );
    });
  });

  it("treats narrow blame output as line provenance rather than culpability", () => {
    const blame = item("git-investigate-line-provenance");
    expect(blame).toBeDefined();
    expect(blame!.prompt).toContain("git blame -L 2,2 --line-porcelain app.txt");
    expect(blame!.prompt).toMatch(/<oid>.*summary revise greeting.*hello new/s);
    expect(blame!.answer).toMatch(/current line.*most recent commit.*not prove.*original author.*intent.*culpability/is);
    expect(blame!.choices).toContain(blame!.correctChoice);
    expect(blame!.references?.map(({ url }) => url)).toContain("https://git-scm.com/docs/git-blame");

    withRepo((repo) => {
      writeFileSync(join(repo.dir, "app.txt"), "title\nhello old\nfooter\n");
      commit(repo, "base", "2026-01-01T00:00:00Z");
      writeFileSync(join(repo.dir, "app.txt"), "title\nhello new\nfooter\n");
      commit(repo, "revise greeting", "2026-01-02T00:00:00Z");

      const output = repo.git(["blame", "-L", "2,2", "--line-porcelain", "app.txt"]);
      expect(output).toMatch(/^[0-9a-f]{40} 2 2 1\n/);
      expect(output).toContain("author Quiz Author\n");
      expect(output).toContain("summary revise greeting\n");
      expect(output).toContain("filename app.txt\n\thello new\n");
    });
  });

  it("distinguishes merge bases, log ranges, and diff three-dot semantics", () => {
    const twoDot = item("git-investigate-two-dot-history");
    const logThreeDot = item("git-investigate-log-three-dot");
    const diffThreeDot = item("git-investigate-diff-three-dot");
    expect(twoDot).toBeDefined();
    expect(logThreeDot).toBeDefined();
    expect(diffThreeDot).toBeDefined();
    expect(twoDot!.prompt).toMatch(/git merge-base main topic.*git log --format='%s' main\.\.topic/s);
    expect(twoDot!.answer).toMatch(/best common ancestor.*reachable from topic.*excluding.*main/is);
    expect(logThreeDot!.prompt).toContain("git log --left-right --format='%m%s' main...topic");
    expect(logThreeDot!.answer).toMatch(/symmetric difference.*reachable from either.*not both/is);
    expect(diffThreeDot!.prompt).toMatch(/git diff --name-status main\.\.\.topic.*git diff --name-status main\.\.topic/s);
    expect(diffThreeDot!.answer).toMatch(/merge-base.*topic.*not.*symmetric difference.*endpoint trees/is);

    for (const candidate of [twoDot!, logThreeDot!, diffThreeDot!]) {
      expect(candidate.choices).toContain(candidate.correctChoice);
      expect(candidate.references?.map(({ url }) => url)).toEqual(expect.arrayContaining([
        "https://git-scm.com/docs/gitrevisions",
      ]));
    }

    withRepo((repo) => {
      writeFileSync(join(repo.dir, "base.txt"), "base\n");
      commit(repo, "base", "2026-01-01T00:00:00Z");
      repo.git(["branch", "topic"]);
      writeFileSync(join(repo.dir, "main.txt"), "main\n");
      commit(repo, "main only", "2026-01-02T00:00:00Z");
      repo.git(["switch", "--quiet", "topic"]);
      writeFileSync(join(repo.dir, "topic-one.txt"), "one\n");
      commit(repo, "topic one", "2026-01-03T00:00:00Z");
      writeFileSync(join(repo.dir, "topic-two.txt"), "two\n");
      commit(repo, "topic two", "2026-01-04T00:00:00Z");

      expect(repo.git(["merge-base", "main", "topic"]).trim()).toBe(
        repo.git(["rev-parse", "main~1"]).trim(),
      );
      expect(repo.git(["log", "--format=%s", "main..topic"])).toBe("topic two\ntopic one\n");
      expect(repo.git(["log", "--left-right", "--format=%m%s", "main...topic"])
        .trim().split("\n").sort()).toEqual(["<main only", ">topic one", ">topic two"]);
      expect(repo.git(["diff", "--name-status", "main...topic"])).toBe(
        "A\ttopic-one.txt\nA\ttopic-two.txt\n",
      );
      expect(repo.git(["diff", "--name-status", "main..topic"])).toBe(
        "D\tmain.txt\nA\ttopic-one.txt\nA\ttopic-two.txt\n",
      );
    });
  });

  it("separates local refs, upstream configuration, remote URLs, tracked files, and ignore rules", () => {
    const refs = item("git-investigate-refs-upstreams-remotes");
    const tracked = item("git-investigate-tracked-v-ignored");
    expect(refs).toBeDefined();
    expect(tracked).toBeDefined();
    expect(refs!.prompt).toMatch(/git branch -vv.*git remote -v.*git show-ref --verify refs\/heads\/topic.*git rev-parse --abbrev-ref main@\{upstream\}/s);
    expect(refs!.answer).toMatch(/local branches.*upstream.*configured remote URLs.*local ref.*do(?:es)? not prove.*server/is);
    expect(tracked!.prompt).toMatch(/git ls-files.*git check-ignore -v ignored\.log.*git status --short/s);
    expect(tracked!.answer).toMatch(/tracked\.log.*tracked.*ignored\.log.*ignore rule.*notes\.txt.*untracked/is);
    for (const candidate of [refs!, tracked!]) {
      expect(candidate.choices).toContain(candidate.correctChoice);
      expect(candidate.references?.every(({ url }) => url.startsWith("https://git-scm.com/docs/"))).toBe(true);
    }

    withRepo((repo) => {
      writeFileSync(join(repo.dir, "base.txt"), "base\n");
      commit(repo, "base", "2026-01-01T00:00:00Z");
      const remote = join(repo.dir, "remote.git");
      repo.git(["init", "--bare", "--quiet", remote]);
      repo.git(["remote", "add", "origin", remote]);
      repo.git(["push", "--quiet", "-u", "origin", "main"]);
      repo.git(["branch", "topic"]);
      repo.git(["push", "--quiet", "-u", "origin", "topic"]);

      const branches = repo.git(["branch", "-vv", "--no-color"])
        .replace(/[0-9a-f]{7,40}/g, "<oid>");
      expect(branches).toContain("* main  <oid> [origin/main] base\n");
      expect(branches).toContain("  topic <oid> [origin/topic] base\n");
      expect(repo.git(["remote", "-v"]).replaceAll(remote, "<fixture>/remote.git")).toBe(
        "origin\t<fixture>/remote.git (fetch)\norigin\t<fixture>/remote.git (push)\n",
      );
      expect(repo.git(["show-ref", "--verify", "refs/heads/topic"]))
        .toMatch(/^[0-9a-f]{40} refs\/heads\/topic\n$/);
      expect(repo.git(["rev-parse", "--abbrev-ref", "main@{upstream}"])).toBe("origin/main\n");
    });

    withRepo((repo) => {
      writeFileSync(join(repo.dir, "tracked.log"), "tracked\n");
      commit(repo, "track log", "2026-01-01T00:00:00Z");
      writeFileSync(join(repo.dir, ".gitignore"), "*.log\n");
      commit(repo, "ignore logs", "2026-01-02T00:00:00Z");
      writeFileSync(join(repo.dir, "ignored.log"), "ignored\n");
      writeFileSync(join(repo.dir, "notes.txt"), "notes\n");

      expect(repo.git(["ls-files"])).toBe(".gitignore\ntracked.log\n");
      expect(repo.git(["check-ignore", "-v", "ignored.log"])).toBe(
        ".gitignore:1:*.log\tignored.log\n",
      );
      expect(repo.git(["status", "--short"])).toBe("?? notes.txt\n");
    });
  });

  it("keeps reflog limits explicit and participates in stable replay and due scheduling", () => {
    const reflog = item("git-investigate-reflog-local");
    expect(reflog).toBeDefined();
    expect(reflog!.prompt).toContain("git reflog --format='%gs' -2 HEAD");
    expect(reflog!.answer).toMatch(/local.*ref movement.*expire.*not shared.*commit history/is);
    expect(reflog!.choices).toContain(reflog!.correctChoice);
    expect(reflog!.references?.map(({ url }) => url)).toContain("https://git-scm.com/docs/git-reflog");

    withRepo((repo) => {
      writeFileSync(join(repo.dir, "app.txt"), "base\n");
      commit(repo, "base", "2026-01-01T00:00:00Z");
      writeFileSync(join(repo.dir, "app.txt"), "second\n");
      commit(repo, "second", "2026-01-02T00:00:00Z");
      expect(repo.git(["reflog", "--format=%gs", "-2", "HEAD"])).toBe(
        "commit: second\ncommit (initial): base\n",
      );
      expect(repo.git(["reflog"])).toContain("second");
    });

    const ids = contentBank
      .filter(({ id }) => id.startsWith("git-investigate-"))
      .map(({ id }) => id);
    expect(ids).toEqual([
      "git-investigate-status-layers",
      "git-investigate-diff-layers",
      "git-investigate-history-overview",
      "git-investigate-path-history",
      "git-investigate-pickaxe-v-regex",
      "git-investigate-line-provenance",
      "git-investigate-two-dot-history",
      "git-investigate-log-three-dot",
      "git-investigate-diff-three-dot",
      "git-investigate-refs-upstreams-remotes",
      "git-investigate-tracked-v-ignored",
      "git-investigate-reflog-local",
    ]);
    for (const stableId of ids) {
      const candidate = item(stableId)!;
      expect(candidate.references?.length).toBeGreaterThan(0);
      expect(candidate.references?.every(({ label }) => label.includes(gitVersion) && label.includes(accessedAt))).toBe(true);
    }

    const now = new Date("2026-07-27T09:00:00Z");
    const mixedQueueIds = new Set(
      Array.from({ length: contentBank.length * 2 }, (_, index) => chooseStableId((index * 2) + 1, [], now)),
    );
    expect(ids.every((stableId) => mixedQueueIds.has(stableId))).toBe(true);
    expect(chooseStableId(0, [{
      stableId: reflog!.id,
      interval: 1,
      reviews: 1,
      successfulReviews: 0,
      dueAt: "2026-07-26T09:00:00.000Z",
      updatedAt: "2026-07-25T09:00:00.000Z",
    }], now)).toBe(reflog!.id);

    const store = new QuizStore(":memory:");
    try {
      store.recordAttempt({
        submissionId: "git-reflog-replay",
        stableId: reflog!.id,
        seed: null,
        prompt: reflog!.prompt,
        expectedAnswer: reflog!.answer,
        response: reflog!.correctChoice!,
        correct: true,
        rating: "good",
        reviewedAt: now.toISOString(),
      });
      expect(store.attemptBySubmission("git-reflog-replay")).toMatchObject({
        stableId: reflog!.id,
        prompt: reflog!.prompt,
        expectedAnswer: reflog!.answer,
        response: reflog!.correctChoice,
      });
      expect(store.reviewState(reflog!.id)).toMatchObject({
        interval: 2,
        reviews: 1,
        successfulReviews: 1,
        dueAt: "2026-07-29T09:00:00.000Z",
      });
    } finally {
      store.close();
    }
  });
});
