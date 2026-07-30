import { describe, expect, it } from "vitest";
import { contentBank } from "../src/content.js";
import { chooseStableId } from "../src/scheduler.js";
import { QuizStore } from "../src/store.js";

function item(id: string) {
  const found = contentBank.find((candidate) => candidate.id === id);
  expect(found, `missing ${id}`).toBeDefined();
  return found!;
}

describe("AWS IAM control-plane graph fluency", () => {
  it("starts from portable authorization roles and keeps trust separate from capability", () => {
    const ids = [
      "iam-graph-portable-path",
      "iam-graph-role-and-trust",
      "iam-graph-capability-policy",
      "iam-graph-minimal-edges",
    ];
    expect(contentBank.filter(({ id }) => id.startsWith("iam-graph-")).map(({ id }) => id).slice(0, ids.length))
      .toEqual(ids);

    expect(item(ids[0]!).correctChoice).toBe(
      "principal → authentication → delegation → temporary credentials → authorization of action on resource, with conditions applied",
    );
    expect(item(ids[1]!).correctChoice).toBe(
      "aws_iam_role.reports is the identity/delegation target; assume_role_policy is role-owned trust that names who may obtain a session",
    );
    expect(item(ids[2]!).correctChoice).toBe(
      "The permissions policy supplies capability to the resulting role session; it does not decide who may assume the role",
    );
    expect(item(ids[3]!).correctChoice).toBe(
      "caller → trust edge → role → permissions edge → action/resource; successful AssumeRole emits temporary session credentials",
    );

    for (const id of ids) {
      const candidate = item(id);
      expect(candidate.choices).toContain(candidate.correctChoice);
      expect(candidate.references?.length).toBeGreaterThan(0);
      expect(candidate.references?.every(({ url }) => url.startsWith("https://docs.aws.amazon.com/"))).toBe(true);
    }
  });

  it("teaches the current explicit inline and managed-policy ownership graphs", () => {
    const ids = [
      "iam-graph-inline-child",
      "iam-graph-managed-policy",
      "iam-graph-managed-missing-attachment",
      "iam-graph-modern-inline-hcl",
      "iam-graph-modern-managed-hcl",
    ];
    expect(contentBank.filter(({ id }) => id.startsWith("iam-graph-")).map(({ id }) => id).slice(0, 9))
      .toEqual([
        "iam-graph-portable-path",
        "iam-graph-role-and-trust",
        "iam-graph-capability-policy",
        "iam-graph-minimal-edges",
        ...ids,
      ]);

    expect(item(ids[0]!).correctChoice).toBe(
      "aws_iam_role_policy is one inline capability policy owned by one role; no separate attachment resource is needed",
    );
    expect(item(ids[1]!).correctChoice).toBe(
      "aws_iam_policy is a reusable managed capability object; creating it alone grants ReportsRole nothing",
    );
    expect(item(ids[2]!).correctChoice).toBe(
      "Add aws_iam_role_policy_attachment connecting ReportsRole's name to the managed policy's ARN",
    );
    expect(item(ids[3]!).prompt).toMatch(/aws_iam_role.*assume_role_policy.*aws_iam_role_policy.*role\s*=.*\.id.*policy\s*=/s);
    expect(item(ids[4]!).prompt).toMatch(/aws_iam_role.*aws_iam_policy.*aws_iam_role_policy_attachment.*role\s*=.*\.name.*policy_arn\s*=.*\.arn/s);

    for (const id of ids) {
      const candidate = item(id);
      expect(candidate.choices).toContain(candidate.correctChoice);
      expect(candidate.references?.length).toBeGreaterThan(0);
      expect(candidate.references?.every(({ label, url }) =>
        label.includes("AWS provider v6.57.1")
        && label.includes("accessed 2026-07-30")
        && url.includes("/hashicorp/terraform-provider-aws/blob/v6.57.1/website/docs/r/"),
      )).toBe(true);
      expect(candidate.prompt).not.toMatch(/managed_policy_arns|inline_policy\s*\{/);
    }
  });

  it("keeps STS credentials as runtime output and scopes later authorization correctly", () => {
    const ids = [
      "iam-graph-sts-runtime-result",
      "iam-graph-cross-account-assume",
      "iam-graph-resource-policy-evaluation",
    ];
    expect(contentBank.filter(({ id }) => id.startsWith("iam-graph-")).map(({ id }) => id).slice(0, 12))
      .toEqual([
        "iam-graph-portable-path",
        "iam-graph-role-and-trust",
        "iam-graph-capability-policy",
        "iam-graph-minimal-edges",
        "iam-graph-inline-child",
        "iam-graph-managed-policy",
        "iam-graph-managed-missing-attachment",
        "iam-graph-modern-inline-hcl",
        "iam-graph-modern-managed-hcl",
        ...ids,
      ]);

    expect(item(ids[0]!).correctChoice).toBe(
      "STS returns temporary access key, secret key, and session token for a role session; these are runtime credentials, not another OpenTofu policy resource",
    );
    expect(item(ids[1]!).correctChoice).toBe(
      "Both the caller-side identity policy and ReportsRole trust must allow sts:AssumeRole in this cross-account scenario",
    );
    expect(item(ids[2]!).correctChoice).toBe(
      "Trust admits the session; the later S3 request is evaluated with applicable identity/resource policies and constraints, and an explicit deny wins",
    );
    expect(item(ids[1]!).answer).toMatch(/cross-account.*both sides.*same-account.*resource-based.*qualification/is);
    expect(item(ids[2]!).answer).not.toMatch(/trust policy grants.*s3:GetObject/i);

    for (const id of ids) {
      const candidate = item(id);
      expect(candidate.choices).toContain(candidate.correctChoice);
      expect(candidate.references?.length).toBeGreaterThan(0);
      expect(candidate.references?.every(({ url }) => url.startsWith("https://docs.aws.amazon.com/"))).toBe(true);
    }
  });

  it("labels deprecated fused ownership second and preserves deterministic replay and scheduling", () => {
    const ids = contentBank.filter(({ id }) => id.startsWith("iam-graph-")).map(({ id }) => id);
    expect(ids).toEqual([
      "iam-graph-portable-path",
      "iam-graph-role-and-trust",
      "iam-graph-capability-policy",
      "iam-graph-minimal-edges",
      "iam-graph-inline-child",
      "iam-graph-managed-policy",
      "iam-graph-managed-missing-attachment",
      "iam-graph-modern-inline-hcl",
      "iam-graph-modern-managed-hcl",
      "iam-graph-sts-runtime-result",
      "iam-graph-cross-account-assume",
      "iam-graph-resource-policy-evaluation",
      "iam-graph-historical-fused-forms",
      "iam-graph-exclusive-style-conflict",
    ]);
    expect(new Set(ids).size).toBe(ids.length);

    const historical = item("iam-graph-historical-fused-forms");
    const conflict = item("iam-graph-exclusive-style-conflict");
    expect(historical.correctChoice).toBe(
      "Use aws_iam_role_policy for inline policies and aws_iam_role_policy_attachment for managed ones; add exclusive resources only for whole-set ownership",
    );
    expect(conflict.correctChoice).toBe(
      "Choose one ownership style per policy type; fused role fields and per-policy resources must not manage the same set",
    );
    expect(historical.prompt).toMatch(/inline_policy.*managed_policy_arns/s);
    expect(historical.answer).toMatch(/v6\.57\.1.*deprecated.*exclusive/is);
    expect(conflict.answer).toMatch(/aws_iam_role_policy.*inline_policy.*aws_iam_role_policy_attachment.*managed_policy_arns/is);

    for (const candidate of [historical, conflict]) {
      expect(candidate.choices).toContain(candidate.correctChoice);
      expect(candidate.references?.every(({ label, url }) =>
        label.includes("AWS provider v6.57.1")
        && label.includes("accessed 2026-07-30")
        && url.includes("/hashicorp/terraform-provider-aws/blob/v6.57.1/website/docs/r/"),
      )).toBe(true);
    }

    const combined = ids.map((id) => `${item(id).prompt}\n${item(id).answer}`).join("\n");
    expect(combined).not.toMatch(/trust policy grants (?:service actions|s3:GetObject)/i);
    expect(combined).toMatch(/managed policy grants the role nothing/i);

    const now = new Date("2026-07-30T09:00:00Z");
    const mixedIds = new Set(Array.from({ length: contentBank.length * 2 }, (_, index) =>
      chooseStableId((index * 2) + 1, [], now)));
    expect(ids.every((id) => mixedIds.has(id))).toBe(true);
    expect(chooseStableId(0, [{
      stableId: conflict.id,
      interval: 1,
      reviews: 1,
      successfulReviews: 0,
      dueAt: "2026-07-29T09:00:00.000Z",
      updatedAt: "2026-07-28T09:00:00.000Z",
    }], now)).toBe(conflict.id);

    const store = new QuizStore(":memory:");
    try {
      store.recordAttempt({
        submissionId: "iam-historical-replay",
        stableId: historical.id,
        seed: null,
        prompt: historical.prompt,
        expectedAnswer: historical.answer,
        response: historical.correctChoice!,
        correct: true,
        rating: "good",
        reviewedAt: now.toISOString(),
      });
      expect(store.attemptBySubmission("iam-historical-replay")).toMatchObject({
        stableId: historical.id,
        prompt: historical.prompt,
        expectedAnswer: historical.answer,
        response: historical.correctChoice,
        correct: true,
      });
    } finally {
      store.close();
    }
  });
});
