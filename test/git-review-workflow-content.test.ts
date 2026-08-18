import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contentBank, generateOrderingQuestion, gradeAnswer, type OrderingItem } from "../src/content.js";
import { chooseStableId } from "../src/scheduler.js";
import { QuizStore } from "../src/store.js";

type Repo = {
  dir: string;
  git: (args: string[], extraEnv?: Record<string, string>) => string;
};

function withRepo(run: (repo: Repo) => void): void {
  const dir = mkdtempSync(join(tmpdir(), "quiz-git-review-"));
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

describe("merge-base branch review workflow", () => {
  it("teaches the widening terminal progression against a diverged executable fixture", () => {
    const terminal = item("git-review-terminal-merge-base-progression");
    expect(terminal).toBeDefined();
    expect(terminal!.topic).toBe("Git review workflow");
    expect(terminal!.prompt).toMatch(/git diff --merge-base BASE HEAD.*git diff --cached --merge-base BASE.*git diff --merge-base BASE/s);
    expect(terminal!.correctChoice).toMatch(/committed branch changes.*committed plus staged.*committed, staged, and unstaged tracked changes/is);
    expect(terminal!.answer).toMatch(/byte-for-byte equivalent.*BASE\.\.\.HEAD/is);
    expect(terminal!.answer).toMatch(/untracked.*absent.*staged.*intent-to-add/is);
    expect(terminal!.choices).toContain(terminal!.correctChoice);
    expect(terminal!.references?.map(({ url }) => url)).toContain("https://git-scm.com/docs/git-diff");

    withRepo((repo) => {
      writeFileSync(join(repo.dir, "shared.txt"), "base\n");
      commit(repo, "base", "2026-01-01T00:00:00Z");
      repo.git(["branch", "topic"]);
      writeFileSync(join(repo.dir, "upstream-only.txt"), "upstream\n");
      commit(repo, "upstream only", "2026-01-02T00:00:00Z");
      repo.git(["switch", "--quiet", "topic"]);
      writeFileSync(join(repo.dir, "committed.txt"), "committed\n");
      commit(repo, "topic commit", "2026-01-03T00:00:00Z");
      writeFileSync(join(repo.dir, "staged.txt"), "staged\n");
      repo.git(["add", "staged.txt"]);
      writeFileSync(join(repo.dir, "shared.txt"), "base\nunstaged\n");
      writeFileSync(join(repo.dir, "untracked.txt"), "untracked\n");

      const committed = repo.git(["diff", "--name-status", "--merge-base", "main", "HEAD"]);
      const staged = repo.git(["diff", "--name-status", "--cached", "--merge-base", "main"]);
      const worktree = repo.git(["diff", "--name-status", "--merge-base", "main"]);
      expect(committed).toBe("A\tcommitted.txt\n");
      expect(staged).toBe("A\tcommitted.txt\nA\tstaged.txt\n");
      expect(worktree).toBe("A\tcommitted.txt\nM\tshared.txt\nA\tstaged.txt\n");
      expect(repo.git(["diff", "--merge-base", "main", "HEAD"]))
        .toBe(repo.git(["diff", "main...HEAD"]));
      for (const output of [committed, staged, worktree]) {
        expect(output).not.toContain("upstream-only.txt");
        expect(output).not.toContain("untracked.txt");
      }
    });
  });

  it("maps Michael's exact Magit grammar onto the same three snapshots", () => {
    const magit = item("git-review-doom-magit-merge-base-progression");
    expect(magit).toBeDefined();
    expect(magit!.topic).toBe("Doom Magit review workflow");
    expect(magit!.prompt).toMatch(/d origin\/main\.\.\.HEAD.*d -m -c origin\/main.*d -m origin\/main/s);
    expect(magit!.correctChoice).toMatch(/committed branch changes.*committed plus staged.*committed, staged, and unstaged tracked changes/is);
    expect(magit!.answer).toMatch(/-m.*--merge-base.*-c.*--cached/is);
    expect(magit!.answer).toMatch(/color-moved.*=m/is);
    expect(magit!.answer).toMatch(/range reader.*one range argument.*rejects.*--merge-base.*range expression/is);
    expect(magit!.choices).toContain(magit!.correctChoice);
    expect(magit!.references).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: expect.stringContaining("2e39988"),
        url: "https://gitlab.com/michael-muzafarov/doom_emacs_config/-/blob/2e39988e38c82a76e7a034c9cb93ee4fe287f29c/config.org",
      }),
      expect.objectContaining({ url: "https://git-scm.com/docs/git-diff" }),
    ]));
  });

  it("orders the review snapshots and replays, grades, and reschedules the stored order", () => {
    const ordering = item("git-review-snapshot-layer-order") as OrderingItem | undefined;
    expect(ordering).toBeDefined();
    expect(ordering!.topic).toBe("Git review workflow");
    expect(ordering!.kind).toBe("ordering");
    expect(ordering!.orderedItems).toEqual([
      "merge base of BASE and HEAD",
      "HEAD (committed branch tip)",
      "index (committed plus staged changes)",
      "working tree (committed, staged, and unstaged tracked changes)",
    ]);
    expect(ordering!.answer).toMatch(/staging.*index.*not HEAD.*untracked.*absent/is);

    const store = new QuizStore(":memory:");
    try {
      const first = store.getOrCreatePending(ordering!.id, () => generateOrderingQuestion(ordering!, 17));
      const replay = store.getOrCreatePending(ordering!.id, () => generateOrderingQuestion(ordering!, 99));
      expect(replay).toEqual(first);
      expect(gradeAnswer(first.grader, first.expectedAnswer, first.expectedAnswer)).toBe(true);
      expect(gradeAnswer(first.grader, JSON.stringify([...ordering!.orderedItems].reverse()), first.expectedAnswer)).toBe(false);

      store.recordAttempt({
        submissionId: "git-review-ordering-miss",
        stableId: ordering!.id,
        seed: first.seed,
        prompt: first.prompt,
        expectedAnswer: first.expectedAnswer,
        response: JSON.stringify([...ordering!.orderedItems].reverse()),
        correct: false,
        rating: "again",
        reviewedAt: "2026-08-18T00:00:00.000Z",
      });
      expect(chooseStableId(0, store.allReviewStates(), new Date("2026-08-18T00:00:00.000Z")))
        .toBe(ordering!.id);
    } finally {
      store.close();
    }

    const mixedIds = new Set(Array.from({ length: 1_000 }, (_, position) =>
      chooseStableId(position, [], new Date("2026-08-18T00:00:00.000Z"))));
    for (const id of [
      "git-review-terminal-merge-base-progression",
      "git-review-doom-magit-merge-base-progression",
      "git-review-snapshot-layer-order",
    ]) expect(mixedIds).toContain(id);
  });
});
