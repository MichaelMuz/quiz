import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { contentBank } from "../src/content.js";
import { chooseStableId } from "../src/scheduler.js";

const ghVersion = "2.96.0";
const accessedAt = "2026-08-22";

function item(id: string) {
  return contentBank.find((candidate) => candidate.id === id);
}

function ghHelp(...args: string[]): string {
  return execFileSync("gh", [...args, "--help"], {
    encoding: "utf8",
    env: { ...process.env, GH_PAGER: "cat", NO_COLOR: "1", TERM: "dumb" },
  });
}

describe("GitHub CLI pull-request investigation", () => {
  it("separates account-wide PR discovery from repository-scoped listing", () => {
    const globalSearch = item("github-cli-investigate-global-review-queue");
    const repoList = item("github-cli-investigate-repo-list");
    expect(globalSearch).toBeDefined();
    expect(repoList).toBeDefined();
    expect(globalSearch!.topic).toBe("GitHub CLI investigation");
    expect(globalSearch!.prompt).toMatch(/up to 100 open pull requests/i);
    expect(globalSearch!.correctChoice).toContain("--review-requested=@me");
    expect(globalSearch!.correctChoice).toContain("--state=open");
    expect(globalSearch!.correctChoice).toContain("--limit 100");
    expect(globalSearch!.answer).toMatch(/across.*repositories.*access.*bounded.*not proof.*every.*gh pr list.*one repository/is);
    expect(repoList!.prompt).toContain("gh pr list");
    expect(repoList!.correctChoice).toContain("--repo cli/cli");
    expect(repoList!.correctChoice).toContain("--search \"$SHA\"");
    expect(repoList!.correctChoice).toContain("--state merged");
    expect(repoList!.answer).toMatch(/default.*open.*merged.*SHA/is);

    const searchHelp = ghHelp("search", "prs");
    expect(searchHelp).toMatch(/gh search prs \[<query>\] \[flags\]/);
    expect(searchHelp).toContain("--review-requested user");
    expect(searchHelp).toContain("--state string");
    expect(searchHelp).toContain("--limit int");
    expect(searchHelp).toContain("Maximum number of results to fetch (default 30)");
    expect(searchHelp).toContain("--json fields");
    const listHelp = ghHelp("pr", "list");
    expect(listHelp).toMatch(/gh pr list \[flags\]/);
    expect(listHelp).toContain("--search query");
    expect(listHelp).toContain("--state string");
    expect(listHelp).toContain("--repo [HOST/]OWNER/REPO");
  });

  it("uses immutable PR identity and interprets required checks without conflating pending and failed", () => {
    const identity = item("github-cli-investigate-pr-identity");
    const checks = item("github-cli-investigate-required-checks");
    expect(identity).toBeDefined();
    expect(checks).toBeDefined();
    expect(identity!.prompt).toContain("gh pr view");
    expect(identity!.correctChoice).toContain("headRefOid,baseRefOid,isDraft,reviewDecision,url");
    expect(identity!.answer).toMatch(/headRefOid.*immutable.*branch name.*moves/is);
    expect(checks!.prompt).toContain("gh pr checks");
    expect(checks!.correctChoice).toMatch(/required.*pending.*exit code 8/is);
    expect(checks!.answer).toMatch(/bucket.*pending.*not.*failure.*--watch/is);

    const viewHelp = ghHelp("pr", "view");
    expect(viewHelp).toMatch(/gh pr view \[<number> \| <url> \| <branch>\] \[flags\]/);
    expect(viewHelp).toContain("headRefOid");
    expect(viewHelp).toContain("baseRefOid");
    expect(viewHelp).toContain("reviewDecision");
    const checksHelp = ghHelp("pr", "checks");
    expect(checksHelp).toContain("includes a `bucket` field");
    expect(checksHelp).toContain("Additional exit codes:");
    expect(checksHelp).toContain("8: Checks pending");
    expect(checksHelp).toContain("--required");
    expect(checksHelp).toContain("--watch");
  });

  it("constructs read-only API queries explicitly and preserves paginated search evidence", () => {
    const apiGet = item("github-cli-investigate-api-get");
    const pagination = item("github-cli-investigate-api-pagination");
    expect(apiGet).toBeDefined();
    expect(pagination).toBeDefined();
    expect(apiGet!.prompt).toContain("gh api");
    expect(apiGet!.correctChoice).toContain("--method GET");
    expect(apiGet!.correctChoice).toContain("search/issues");
    expect(apiGet!.answer).toMatch(/field flags.*POST.*override.*GET.*-F.*integer/is);
    expect(pagination!.prompt).toMatch(/--paginate.*--slurp/s);
    expect(pagination!.correctChoice).toMatch(/outer array.*page objects.*incomplete_results.*1,000/is);
    expect(pagination!.answer).toMatch(/items.*flatten.*timeout.*access/is);

    const apiHelp = ghHelp("api");
    expect(apiHelp).toMatch(/gh api <endpoint> \[flags\]/);
    expect(apiHelp).toMatch(/default HTTP request method is `GET` normally and `POST` if any parameters\s+were added/i);
    expect(apiHelp).toMatch(/--method string/);
    expect(apiHelp).toMatch(/--paginate/);
    expect(apiHelp).toMatch(/--slurp/);
  });

  it("ships one bounded, cited cohort in stable replay and scheduling", () => {
    const ids = contentBank
      .filter(({ id }) => id.startsWith("github-cli-investigate-"))
      .map(({ id }) => id);
    expect(ids).toEqual([
      "github-cli-investigate-global-review-queue",
      "github-cli-investigate-repo-list",
      "github-cli-investigate-pr-identity",
      "github-cli-investigate-required-checks",
      "github-cli-investigate-api-get",
      "github-cli-investigate-api-pagination",
    ]);

    for (const stableId of ids) {
      const candidate = item(stableId)!;
      expect(candidate.kind).toBe("command");
      expect(candidate.choices).toContain(candidate.correctChoice);
      expect(candidate.references?.length).toBeGreaterThan(0);
      expect(candidate.references?.some(({ label }) => label.includes(`GitHub CLI ${ghVersion}`)
        && label.includes(accessedAt))).toBe(true);
    }

    const scheduled = new Set(Array.from({ length: contentBank.length * 2 }, (_, position) =>
      chooseStableId(position, [], new Date("2026-08-22T09:00:00.000Z"))));
    expect(ids.every((stableId) => scheduled.has(stableId))).toBe(true);
  });
});
