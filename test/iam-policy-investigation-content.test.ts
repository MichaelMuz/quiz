import { describe, expect, it } from "vitest";
import { contentBank } from "../src/content.js";
import { chooseStableId } from "../src/scheduler.js";
import { QuizStore } from "../src/store.js";

function item(id: string) {
  const found = contentBank.find((candidate) => candidate.id === id);
  expect(found, `missing ${id}`).toBeDefined();
  return found!;
}

describe("AWS IAM policy grammar and denial investigation", () => {
  it("classifies trust and permissions policies on independent axes", () => {
    const axes = item("iam-policy-axes-classification");

    expect(axes.prompt).toMatch(/trust policy.*customer-managed.*AWS-managed/is);
    expect(axes.correctChoice).toMatch(/trust.*resource-based.*role-owned/is);
    expect(axes.correctChoice).toMatch(/permissions.*identity-based.*customer-managed.*AWS-managed/is);
    expect(axes.answer).toMatch(/not.*inline permissions policy/is);
    expect(axes.choices).toContain(axes.correctChoice);
  });

  it("places policy elements at the right JSON level without inventing five required fields", () => {
    const grammar = item("iam-policy-json-grammar");

    expect(grammar.prompt).toMatch(/Version.*Statement.*Principal/is);
    expect(grammar.correctChoice).toMatch(/Version.*top-level.*Statement.*policy type/is);
    expect(grammar.answer).toMatch(/Action.*NotAction.*Resource.*NotResource.*Principal.*NotPrincipal/is);
    expect(grammar.answer).toMatch(/permissions polic(?:y|ies).*Resource.*NotResource/is);
    expect(grammar.answer).toMatch(/role trust polic(?:y|ies).*omit.*Resource.*attached role.*implicit target/is);
    expect(grammar.answer).toMatch(/Principal.*resource-based.*not allowed.*identity-based/is);
    expect(grammar.answer).not.toMatch(/five (?:universally )?required fields/i);
  });

  it("distinguishes a policy-bearing IAM group from a request-making principal", () => {
    const group = item("iam-policy-group-not-principal");

    expect(group.prompt).toMatch(/group.*Principal/is);
    expect(group.correctChoice).toMatch(/attach.*identity-based policy.*group.*cannot.*Principal/is);
    expect(group.answer).toMatch(/permissions.*not authentication.*users.*make requests/is);
  });

  it("treats enhanced denial wording as bounded evidence, not a universal message contract", () => {
    const explicit = item("iam-policy-denial-explicit-evidence");
    const implicit = item("iam-policy-denial-implicit-evidence");

    expect(explicit.prompt).toMatch(/assumed-role.*s3:GetObject.*example-reports.*explicit deny.*identity-based/is);
    expect(explicit.correctChoice).toMatch(/principal.*action.*resource.*identity-based.*explicit Deny/is);
    expect(explicit.answer).toMatch(/proves.*does not prove.*only.*denial reason/is);

    expect(implicit.prompt).toMatch(/because no identity-based policy allows.*s3:ListBucket/is);
    expect(implicit.correctChoice).toMatch(/implicit.*named layer.*inspect.*identity policies/is);
    expect(implicit.answer).toMatch(/service.*vary.*same account.*organization/is);
  });

  it("separates same-account grants from boundary and Organizations constraints", () => {
    const union = item("iam-policy-same-account-union");
    const constraints = item("iam-policy-boundary-org-constraints");

    expect(union.correctChoice).toMatch(/same account.*union.*identity-based.*resource-based.*explicit Deny/is);
    expect(union.answer).toMatch(/principal type.*role session.*exceptions.*not.*slogan/is);

    expect(constraints.prompt).toMatch(/identity policy.*Allow.*boundary.*SCP.*RCP/is);
    expect(constraints.correctChoice).toMatch(/intersection.*boundary.*SCP.*RCP.*explicit Deny/is);
    expect(constraints.answer).toMatch(/maximum.*do not grant.*missing Allow.*implicit/is);
  });

  it("requires both account sides for a scoped cross-account resource request", () => {
    const crossAccount = item("iam-policy-cross-account-resource-access");

    expect(crossAccount.prompt).toMatch(/111122223333.*444455556666.*identity policy.*bucket policy/is);
    expect(crossAccount.correctChoice).toMatch(/caller account.*identity Allow.*resource-owning account.*resource-policy Allow/is);
    expect(crossAccount.answer).toMatch(/role ARN.*role session ARN.*not interchangeable.*exact Principal/is);
    expect(crossAccount.answer).not.toMatch(/either side always suffices/i);
  });

  it("uses a compact role transcript to choose the smallest next evidence", () => {
    const evidence = item("iam-policy-next-role-evidence");

    expect(evidence.prompt).toMatch(/get-role.*PermissionsBoundary.*list-attached-role-policies.*list-role-policies/is);
    expect(evidence.prompt).toContain("Normalized output:");
    expect(evidence.prompt).toContain("PermissionsBoundaryArn: …/ReportsBoundary");
    expect(evidence.prompt).not.toMatch(/arn:aws:iam::111122223333:policy\/(?:ReportsBoundary|ReadReports)/);
    expect(evidence.correctChoice).toMatch(/get-policy.*get-policy-version.*boundary.*before.*mutating/is);
    expect(evidence.answer).toMatch(/trust policy.*not.*S3 permission.*default version.*condition/is);
  });

  it("uses the policy simulator as bounded evidence and reads missing condition context", () => {
    const boundary = item("iam-policy-simulator-boundary");
    const context = item("iam-policy-simulator-missing-context");

    expect(boundary.correctChoice).toMatch(/identity.*resource.*boundary.*SCP.*supported/is);
    expect(boundary.answer).toMatch(/not support.*RCP.*VPC endpoint.*role chain.*multiple resource-based/is);
    expect(boundary.answer).toMatch(/not.*live request.*not.*only.*caller side/is);

    expect(context.prompt).toMatch(/simulate-principal-policy.*s3:ListBucket.*implicitDeny.*MissingContextValues.*s3:prefix/is);
    expect(context.correctChoice).toMatch(/missing condition context.*s3:prefix.*rerun/is);
    expect(context.answer).toMatch(/implicit deny.*no applicable Allow.*does not prove.*explicit Deny/is);
  });

  it("matches S3 APIs to the exact IAM action and bucket or object resource shape", () => {
    const list = item("iam-policy-s3-list-resource");
    const get = item("iam-policy-s3-get-resource");

    expect(list.prompt).toMatch(/ListObjectsV2.*s3:ListBucket.*example-reports\/\*/is);
    expect(list.correctChoice).toMatch(/s3:ListBucket.*arn:aws:s3:::example-reports(?!\/)/is);
    expect(list.answer).toMatch(/empty Region and account fields.*not wildcards/is);

    expect(get.prompt).toMatch(/GetObject.*s3:GetObject.*arn:aws:s3:::example-reports(?!\/)/is);
    expect(get.correctChoice).toMatch(/s3:GetObject.*arn:aws:s3:::example-reports\/\*/is);
    expect(get.answer).toMatch(/bucket ARN.*object ARN.*action.*resource.*both/is);
  });

  it("embeds valid representative policy JSON in both S3 diagnosis fixtures", () => {
    for (const id of ["iam-policy-s3-list-resource", "iam-policy-s3-get-resource"]) {
      const prompt = item(id).prompt;
      const serialized = prompt.match(/Policy:\n([\s\S]+)\n\nWhat exact/)?.[1];
      expect(serialized, `missing JSON fixture for ${id}`).toBeDefined();
      const policy = JSON.parse(serialized!) as { Version: string; Statement: Array<Record<string, string>> };
      expect(policy.Version).toBe("2012-10-17");
      expect(policy.Statement).toHaveLength(1);
      expect(policy.Statement[0]).toMatchObject({ Effect: "Allow" });
    }
  });

  it("keeps the 13-card cohort sourced, sanitized, deterministic, and independently scheduled", () => {
    const ids = contentBank.filter(({ id }) => id.startsWith("iam-policy-")).map(({ id }) => id);
    expect(ids).toEqual([
      "iam-policy-axes-classification",
      "iam-policy-json-grammar",
      "iam-policy-group-not-principal",
      "iam-policy-denial-explicit-evidence",
      "iam-policy-denial-implicit-evidence",
      "iam-policy-same-account-union",
      "iam-policy-boundary-org-constraints",
      "iam-policy-cross-account-resource-access",
      "iam-policy-next-role-evidence",
      "iam-policy-simulator-boundary",
      "iam-policy-simulator-missing-context",
      "iam-policy-s3-list-resource",
      "iam-policy-s3-get-resource",
    ]);
    expect(new Set(ids).size).toBe(ids.length);

    const combined = ids.map((id) => {
      const candidate = item(id);
      expect(candidate.choices).toContain(candidate.correctChoice);
      expect(candidate.references?.length).toBeGreaterThan(0);
      expect(candidate.references?.every(({ label, url }) =>
        label.includes("accessed 2026-08-03") && url.startsWith("https://docs.aws.amazon.com/"),
      )).toBe(true);
      return `${candidate.prompt}\n${candidate.answer}\n${candidate.choices?.join("\n")}`;
    }).join("\n");
    expect(combined).not.toMatch(/Addepar|MichaelMuz|claude\.ai|fa65038f/i);
    expect([...combined.matchAll(/\b\d{12}\b/g)].map(([account]) => account)
      .every((account) => account === "111122223333" || account === "444455556666")).toBe(true);

    const now = new Date("2026-08-03T10:00:00Z");
    const mixedIds = new Set(Array.from({ length: contentBank.length * 2 }, (_, index) =>
      chooseStableId((index * 2) + 1, [], now)));
    expect(ids.every((id) => mixedIds.has(id))).toBe(true);
    expect(chooseStableId(0, [{
      stableId: "iam-policy-denial-explicit-evidence",
      interval: 1,
      reviews: 1,
      successfulReviews: 0,
      dueAt: "2026-08-02T10:00:00.000Z",
      updatedAt: "2026-08-01T10:00:00.000Z",
    }], now)).toBe("iam-policy-denial-explicit-evidence");

    const replay = item("iam-policy-simulator-missing-context");
    const store = new QuizStore(":memory:");
    try {
      store.recordAttempt({
        submissionId: "iam-policy-replay",
        stableId: replay.id,
        seed: null,
        prompt: replay.prompt,
        expectedAnswer: replay.answer,
        response: replay.correctChoice!,
        correct: true,
        rating: "good",
        reviewedAt: now.toISOString(),
      });
      expect(store.attemptBySubmission("iam-policy-replay")).toMatchObject({
        stableId: replay.id,
        prompt: replay.prompt,
        expectedAnswer: replay.answer,
        response: replay.correctChoice,
        correct: true,
      });
    } finally {
      store.close();
    }
  });
});
