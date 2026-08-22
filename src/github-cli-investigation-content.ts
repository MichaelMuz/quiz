import type { StaticItem } from "./content.js";

const searchPrsReference = {
  label: "GitHub CLI 2.96.0 gh search prs manual, accessed 2026-08-22",
  url: "https://cli.github.com/manual/gh_search_prs",
};
const prListReference = {
  label: "GitHub CLI 2.96.0 gh pr list manual, accessed 2026-08-22",
  url: "https://cli.github.com/manual/gh_pr_list",
};
const prViewReference = {
  label: "GitHub CLI 2.96.0 gh pr view manual, accessed 2026-08-22",
  url: "https://cli.github.com/manual/gh_pr_view",
};
const prChecksReference = {
  label: "GitHub CLI 2.96.0 gh pr checks manual, accessed 2026-08-22",
  url: "https://cli.github.com/manual/gh_pr_checks",
};
const apiReference = {
  label: "GitHub CLI 2.96.0 gh api manual, accessed 2026-08-22",
  url: "https://cli.github.com/manual/gh_api",
};
const githubSearchReference = {
  label: "GitHub issue and pull-request search documentation, accessed 2026-08-22",
  url: "https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests",
};
const restSearchReference = {
  label: "GitHub REST search documentation, accessed 2026-08-22",
  url: "https://docs.github.com/en/rest/search/search#search-issues-and-pull-requests",
};
const paginationReference = {
  label: "GitHub REST pagination documentation, accessed 2026-08-22",
  url: "https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api",
};

export const githubCliInvestigationItems: StaticItem[] = [
  {
    id: "github-cli-investigate-global-review-queue",
    kind: "command",
    topic: "GitHub CLI investigation",
    prompt: "You need up to 100 open pull requests across repositories you can access that request your review, with machine-readable repository, number, title, and URL. Which `gh search prs` query has the right scope and an explicit bound?",
    choices: [
      "gh search prs --review-requested=@me --state=open --limit 100 --json repository,number,title,url",
      "gh pr list --review-requested=@me --state open --json repository,number,title,url",
      "gh search prs --author=@me --state=open --json repository,number,title,url",
      "gh api repos/{owner}/{repo}/pulls --jq '.[] | [.number, .title]'",
    ],
    correctChoice: "gh search prs --review-requested=@me --state=open --limit 100 --json repository,number,title,url",
    answer: "`gh search prs` searches pull requests across GitHub repositories your authentication can access, unless you narrow it with repository or owner filters. `--review-requested=@me` selects the reviewer relationship, `--state=open` selects open results, and `--limit 100` replaces the CLI's default bound of 30 with an explicit bound of 100. `--json` avoids scraping display text. This bounded result is a discovery queue, not proof that you found every matching pull request: access limits and GitHub Search's 1,000-result cap still apply. `gh pr list` lists pull requests in one repository, selected from the current directory or by `--repo`, and it has no `--review-requested` flag.",
    references: [searchPrsReference, githubSearchReference],
  },
  {
    id: "github-cli-investigate-repo-list",
    kind: "command",
    topic: "GitHub CLI investigation",
    prompt: "SHA is a known commit abbreviation. Within cli/cli, you need the merged pull request that introduced it. Which `gh pr list` query asks that repository-scoped question without depending on your current directory?",
    choices: [
      "gh pr list --repo cli/cli --search \"$SHA\" --state merged --json number,title,url",
      "gh pr list --search \"$SHA\" --json number,title,url",
      "gh search prs --repo cli/cli --head \"$SHA\" --state=merged --json number,title,url",
      "gh pr view \"$SHA\" --repo cli/cli --json number,title,url",
    ],
    correctChoice: "gh pr list --repo cli/cli --search \"$SHA\" --state merged --json number,title,url",
    answer: "`gh pr list --repo cli/cli` fixes the repository scope explicitly. Its default state is open, so `--state merged` is necessary when the target pull request has merged. `--search \"$SHA\"` uses GitHub's pull-request search support for a commit SHA, which must be at least seven characters. `--head` filters a branch name, not a commit ID.",
    references: [prListReference, githubSearchReference],
  },
  {
    id: "github-cli-investigate-pr-identity",
    kind: "command",
    topic: "GitHub CLI investigation",
    prompt: "You are about to review pull request 42 in acme/api. Which `gh pr view` query captures the exact candidate head plus the base snapshot and current review metadata in structured output?",
    choices: [
      "gh pr view 42 --repo acme/api --json headRefOid,baseRefOid,isDraft,reviewDecision,url",
      "gh pr view 42 --repo acme/api --json headRefName,baseRefName,isDraft,reviewDecision,url",
      "gh pr list --repo acme/api --head 42 --json headRefOid,baseRefOid",
      "gh pr checks 42 --repo acme/api --json headRefOid,baseRefOid,reviewDecision",
    ],
    correctChoice: "gh pr view 42 --repo acme/api --json headRefOid,baseRefOid,isDraft,reviewDecision,url",
    answer: "`gh pr view` resolves one pull request by number, URL, or branch. `headRefOid` is the immutable commit identity to pin an exact-head review; the branch name moves when a new commit is pushed. `baseRefOid` records the base snapshot reported for the pull request, while `isDraft` and `reviewDecision` report current review metadata. Checks are a separate evidence surface, and all remote metadata can change after this query, so record the OID with the review result.",
    references: [prViewReference],
  },
  {
    id: "github-cli-investigate-required-checks",
    kind: "command",
    topic: "GitHub CLI investigation",
    prompt: "Normalized result:\n\ngh pr checks 42 --repo acme/api --required --json name,bucket,state,link\n→ [{\"name\":\"test\",\"bucket\":\"pending\",\"state\":\"IN_PROGRESS\",...}]\n→ process exit code 8\n\nWhat does this establish?",
    choices: [
      "Only required checks were requested; test is pending rather than failed; exit code 8 means checks are pending",
      "Every check, required or optional, failed; exit code 8 is a generic authentication error",
      "The pull request passed because the command returned valid JSON",
      "The review decision is approved because the required check has started",
    ],
    correctChoice: "Only required checks were requested; test is pending rather than failed; exit code 8 means checks are pending",
    answer: "`--required` limits the result to required checks. In JSON output, `bucket` normalizes provider states into pass, fail, pending, skipping, or cancel. A pending bucket is not a failure, and `gh pr checks` uses exit code 8 when checks are still pending. Use `--watch` when you deliberately want the command to wait and refresh until checks finish; check status still does not establish review approval or immutable head identity.",
    references: [prChecksReference],
  },
  {
    id: "github-cli-investigate-api-get",
    kind: "command",
    topic: "GitHub CLI investigation",
    prompt: "You need a read-only REST search for open pull requests in cli/cli, with per_page sent as the integer 100. Which `gh api` command preserves GET semantics?",
    choices: [
      "gh api --method GET search/issues -f q='repo:cli/cli is:pr is:open' -F per_page=100",
      "gh api search/issues -f q='repo:cli/cli is:pr is:open' -F per_page=100",
      "gh api --method POST search/issues -f q='repo:cli/cli is:pr is:open' -F per_page=100",
      "gh api --method GET repos/{owner}/{repo}/pulls -F q='repo:cli/cli is:pr is:open'",
    ],
    correctChoice: "gh api --method GET search/issues -f q='repo:cli/cli is:pr is:open' -F per_page=100",
    answer: "Adding `-f` or `-F` field flags switches `gh api` from its normal GET default to POST. Override that switch with `--method GET` to send the fields as query parameters. `-f` supplies the search query as a string, while `-F per_page=100` converts 100 to an integer. The `is:pr` qualifier matters because the `search/issues` endpoint otherwise searches both issues and pull requests.",
    references: [apiReference, restSearchReference],
  },
  {
    id: "github-cli-investigate-api-pagination",
    kind: "command",
    topic: "GitHub CLI investigation",
    prompt: "You run:\n\ngh api --method GET search/issues -f q='org:acme is:pr is:merged' -F per_page=100 --paginate --slurp\n\nWhat shape and limits must your investigation preserve?",
    choices: [
      "An outer array of page objects; inspect each incomplete_results value before flattening items; Search API exposes at most 1,000 results per search",
      "One flat array of every matching pull request, with no search cap and proof that inaccessible repositories have no matches",
      "One page object only; --paginate changes per_page to an unlimited value and --slurp discards metadata",
      "A stream of raw HTTP headers; pagination is complete whenever total_count is nonzero",
    ],
    correctChoice: "An outer array of page objects; inspect each incomplete_results value before flattening items; Search API exposes at most 1,000 results per search",
    answer: "`--paginate` requests successive pages, and `--slurp` wraps those page objects in an outer array. Each page object's `items` array must be flattened deliberately. If any `incomplete_results` value is true, a timeout may have omitted matches. GitHub's REST Search API exposes at most 1,000 results for one search, and results are limited to resources the authenticated caller can access, so absence is not proof about inaccessible repositories.",
    references: [apiReference, restSearchReference, paginationReference],
  },
];
