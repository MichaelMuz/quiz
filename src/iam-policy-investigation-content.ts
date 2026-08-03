import type { StaticItem } from "./content.js";

const policyTypesReference = {
  label: "AWS IAM policies and permissions, accessed 2026-08-03",
  url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html",
};
const identityResourceReference = {
  label: "AWS IAM identity-based and resource-based policies, accessed 2026-08-03",
  url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_identity-vs-resource.html",
};
const policyElementsReference = {
  label: "AWS IAM JSON policy element reference, accessed 2026-08-03",
  url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html",
};
const principalReference = {
  label: "AWS IAM Principal element, accessed 2026-08-03",
  url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_principal.html",
};
const groupsReference = {
  label: "AWS IAM user groups, accessed 2026-08-03",
  url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_groups.html",
};
const accessDeniedReference = {
  label: "AWS IAM access denied troubleshooting, accessed 2026-08-03",
  url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/troubleshoot_access-denied.html",
};
const evaluationReference = {
  label: "AWS IAM policy evaluation logic, accessed 2026-08-03",
  url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html",
};
const denyAllowReference = {
  label: "AWS IAM allow and deny evaluation, accessed 2026-08-03",
  url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic_policy-eval-denyallow.html",
};
const getRoleReference = {
  label: "AWS CLI iam get-role, accessed 2026-08-03",
  url: "https://docs.aws.amazon.com/cli/latest/reference/iam/get-role.html",
};
const getPolicyReference = {
  label: "AWS CLI iam get-policy-version, accessed 2026-08-03",
  url: "https://docs.aws.amazon.com/cli/latest/reference/iam/get-policy-version.html",
};
const simulatorReference = {
  label: "AWS IAM policy simulator, accessed 2026-08-03",
  url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_testing-policies.html",
};
const simulatePrincipalReference = {
  label: "AWS IAM SimulatePrincipalPolicy API, accessed 2026-08-03",
  url: "https://docs.aws.amazon.com/IAM/latest/APIReference/API_SimulatePrincipalPolicy.html",
};
const listObjectsReference = {
  label: "Amazon S3 ListObjectsV2 API, accessed 2026-08-03",
  url: "https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjectsV2.html",
};
const getObjectReference = {
  label: "Amazon S3 GetObject API, accessed 2026-08-03",
  url: "https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObject.html",
};
const arnReference = {
  label: "AWS IAM ARN reference, accessed 2026-08-03",
  url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/reference-arns.html",
};

export const iamPolicyInvestigationItems: StaticItem[] = [
  {
    id: "iam-policy-axes-classification",
    kind: "command",
    topic: "AWS IAM investigation",
    prompt: "Classify three documents on independent axes:\n\nA. ReportsRole trust policy\nB. ReadReports customer-managed policy attached to ReportsRole\nC. ReadOnlyAccess AWS-managed policy attached to AuditRole",
    choices: [
      "A: trust purpose, resource-based and role-owned. B/C: permissions purpose and identity-based; B is customer-managed, C is AWS-managed",
      "A: inline permissions policy. B: resource-based trust. C: temporary session policy",
      "All three are role trust policies because each can be associated with a role",
      "All three are inline because AWS stores their JSON documents",
    ],
    correctChoice: "A: trust purpose, resource-based and role-owned. B/C: permissions purpose and identity-based; B is customer-managed, C is AWS-managed",
    answer: "Purpose, attachment target, and management lifecycle are separate axes. A role trust policy controls delegation, is the role's resource-based policy, and is owned by that role. Do not call it an inline permissions policy. B and C grant permissions through identity-based managed policies; customer-managed means your account manages the reusable policy, while AWS-managed means AWS manages it.",
    references: [policyTypesReference, identityResourceReference],
  },
  {
    id: "iam-policy-json-grammar",
    kind: "command",
    topic: "AWS IAM investigation",
    prompt: "A teammate says every IAM policy needs Version inside each Statement alongside Effect, Principal, Action, and Resource. Which correction matches IAM JSON grammar?",
    choices: [
      "Version is top-level; Statement elements depend on policy type. Ordinary permissions statements select Resource or NotResource, while a role trust statement can omit either. Principal belongs in resource-based policies",
      "Version belongs inside every Statement and Principal is required in every identity policy",
      "Condition is required in every Statement and replaces Resource when present",
      "Action and NotAction can be combined in one Statement to describe exceptions",
    ],
    correctChoice: "Version is top-level; Statement elements depend on policy type. Ordinary permissions statements select Resource or NotResource, while a role trust statement can omit either. Principal belongs in resource-based policies",
    answer: "There is no five-field universal Statement rule. `Version` is a top-level policy element, normally `2012-10-17`. `Statement` entries use `Effect` and select `Action` or `NotAction`. Ordinary permissions policy statements also select `Resource` or `NotResource`, and `Condition` is optional. Role trust policy statements use `Principal` or `NotPrincipal` to name who may assume the role, and can omit `Resource` because the attached role is the implicit target. `Principal` names who in a resource-based policy and is not allowed in an identity-based policy because the attached user, group, or role supplies that identity scope.",
    references: [policyElementsReference, principalReference],
  },
  {
    id: "iam-policy-group-not-principal",
    kind: "command",
    topic: "AWS IAM investigation",
    prompt: "The FinanceReaders IAM group should give its users read permissions. Can you attach a policy to the group, and can the group's ARN appear as Principal in a bucket policy?",
    choices: [
      "Attach an identity-based policy to the group, but the group cannot be a Principal",
      "Use the group as Principal, but policies cannot be attached to groups",
      "The group can both receive policies and make signed requests as Principal",
      "Neither is possible; IAM groups are only tags",
    ],
    correctChoice: "Attach an identity-based policy to the group, but the group cannot be a Principal",
    answer: "An IAM group distributes identity-based permissions to its member users. A group is about permissions, not authentication, so it does not sign requests and cannot be named as `Principal`. The authenticated users, roles, role sessions, services, or other supported principal types make requests; group membership can contribute identity-policy permissions for a user.",
    references: [groupsReference, principalReference],
  },
  {
    id: "iam-policy-denial-explicit-evidence",
    kind: "command",
    topic: "AWS IAM investigation",
    prompt: "AccessDenied:\nUser: arn:aws:sts::111122223333:assumed-role/ReportsReader/run-42 is not authorized to perform: s3:GetObject on resource: arn:aws:s3:::example-reports/2026/q3.csv with an explicit deny in an identity-based policy\n\nWhat does this message establish?",
    choices: [
      "It names the principal, action, resource, identity-based layer, and an applicable explicit Deny; inspect that layer first",
      "It proves the bucket policy allows the request and no other policy layer matters",
      "It proves ReportsReader's trust policy contains the S3 denial",
      "It only proves the credentials are expired",
    ],
    correctChoice: "It names the principal, action, resource, identity-based layer, and an applicable explicit Deny; inspect that layer first",
    answer: "The enhanced text proves that this request used the named role-session principal, action, and resource, and that evaluation found an applicable explicit `Deny` in the named identity-based layer. That is the smallest high-value place to inspect. It does not prove every other layer allows the request, nor that this was the only denial reason; AWS reports one denial reason even when more than one policy type denies access.",
    references: [accessDeniedReference],
  },
  {
    id: "iam-policy-denial-implicit-evidence",
    kind: "command",
    topic: "AWS IAM investigation",
    prompt: "AccessDenied:\nUser: arn:aws:sts::111122223333:assumed-role/ReportsReader/run-42 is not authorized to perform: s3:ListBucket on resource: arn:aws:s3:::example-reports because no identity-based policy allows the s3:ListBucket action\n\nWhat is the smallest next investigation?",
    choices: [
      "Treat it as an implicit denial in the named layer and inspect the role's identity policies for an applicable s3:ListBucket Allow",
      "Search only for an explicit Deny in the bucket policy",
      "Change the role trust policy to include s3:ListBucket",
      "Assume the service checked every possible policy type and none can allow access",
    ],
    correctChoice: "Treat it as an implicit denial in the named layer and inspect the role's identity policies for an applicable s3:ListBucket Allow",
    answer: "`Because no identity-based policy allows` describes an implicit denial in the named layer, so inspect the role's attached and inline identity policies for the exact action, resource, and conditions. Keep the evidence bounded: service coverage and wording vary, enhanced details apply to relevant requests within the same account or organization, and one message need not enumerate every policy type or every simultaneous denial reason.",
    references: [accessDeniedReference],
  },
  {
    id: "iam-policy-same-account-union",
    kind: "command",
    topic: "AWS IAM investigation",
    prompt: "Scoped case: an IAM user requests an S3 object in the same account. No boundary, session policy, SCP, RCP, or endpoint policy applies. How do identity and bucket policies combine?",
    choices: [
      "For this same account case, AWS takes the union of identity-based and resource-based Allows; an applicable explicit Deny overrides them",
      "Both documents must always contain matching Allows",
      "The bucket policy always replaces the identity policy",
      "Any identity Allow overrides every resource-policy Deny",
    ],
    correctChoice: "For this same account case, AWS takes the union of identity-based and resource-based Allows; an applicable explicit Deny overrides them",
    answer: "In this deliberately scoped same-account case, an applicable Allow in either the user's identity policy or the bucket policy can grant access, while an explicit Deny in either wins. The exact principal type matters: a role ARN and a role session ARN can interact differently with implicit denials. Cross-account requests, IAM/KMS exceptions, boundaries, session policies, and organization controls are further exceptions, so this is not an `either side always suffices` slogan.",
    references: [evaluationReference, denyAllowReference],
  },
  {
    id: "iam-policy-boundary-org-constraints",
    kind: "command",
    topic: "AWS IAM investigation",
    prompt: "ReportsRole's identity policy Allows s3:GetObject. An applicable permissions boundary, SCP, or RCP does not allow that request. No resource policy directly grants the role session ARN. What is the evaluation shape?",
    choices: [
      "The candidate Allow must survive the intersection with the applicable boundary, SCP, and RCP constraints; any explicit Deny wins",
      "The identity Allow bypasses boundaries and Organizations policies",
      "A boundary grants whatever its JSON mentions even without an identity Allow",
      "Only the role trust policy decides the S3 request",
    ],
    correctChoice: "The candidate Allow must survive the intersection with the applicable boundary, SCP, and RCP constraints; any explicit Deny wins",
    answer: "Permissions boundaries and Organizations controls define maximum permissions; they do not grant access by themselves. In this scenario, the role's identity-policy Allow must remain permitted by each applicable constraining layer. A missing Allow in a required restrictive layer produces an implicit denial, and an applicable explicit `Deny` overrides an Allow. Exact resource-policy principal forms can introduce documented same-account nuances, so preserve the stated principal and policy context.",
    references: [evaluationReference, denyAllowReference],
  },
  {
    id: "iam-policy-cross-account-resource-access",
    kind: "command",
    topic: "AWS IAM investigation",
    prompt: "A session for arn:aws:iam::111122223333:role/ReportsReader calls GetObject on a bucket owned by 444455556666. The caller's identity policy Allows the object ARN, but the bucket policy has no cross-account grant. Why is access still denied?",
    choices: [
      "Cross-account access needs both sides: the caller account needs an identity Allow and the resource-owning account needs a resource-policy Allow",
      "The caller's identity Allow is always enough, even across accounts",
      "Only the bucket policy matters; caller-side permissions are never evaluated",
      "The role trust policy must contain s3:GetObject",
    ],
    correctChoice: "Cross-account access needs both sides: the caller account needs an identity Allow and the resource-owning account needs a resource-policy Allow",
    answer: "For this cross-account S3 request, the caller's account must authorize the action and the bucket owner's account must grant access through its resource policy or another supported resource-side mechanism. A role ARN and a role session ARN are not interchangeable in policy evaluation. Record the exact Principal element, action, resource, and conditions rather than reducing cross-account authorization to a one-document formula.",
    references: [denyAllowReference, identityResourceReference, principalReference],
  },
  {
    id: "iam-policy-next-role-evidence",
    kind: "command",
    topic: "AWS IAM investigation",
    prompt: "Denial says no identity-based policy allows s3:GetObject.\n\n$ aws iam get-role --role-name ReportsReader\nNormalized output:\nRole:\n  AssumeRolePolicyDocument: {…}\n  PermissionsBoundary:\n    PermissionsBoundaryArn: …/ReportsBoundary\n\n$ aws iam list-attached-role-policies --role-name ReportsReader\nNormalized output:\nAttachedPolicies:\n- PolicyName: ReadReports\n  PolicyArn: …/ReadReports\n\n$ aws iam list-role-policies --role-name ReportsReader\nPolicyNames: []\n\nWhat is the smallest next evidence?",
    choices: [
      "Use get-policy then get-policy-version for ReadReports and the boundary; inspect their exact action, resource, and conditions before mutating anything",
      "Edit the AssumeRolePolicyDocument to add s3:GetObject",
      "Create a new inline policy without reading the existing managed policy",
      "The empty PolicyNames output proves the role has no permissions",
    ],
    correctChoice: "Use get-policy then get-policy-version for ReadReports and the boundary; inspect their exact action, resource, and conditions before mutating anything",
    answer: "`get-role` returns the role and trust policy plus boundary metadata; the trust policy controls assumption, not the later S3 permission. The attached list identifies a managed policy but not its document. `get-policy` gives its default version ID, then `get-policy-version` retrieves that version. Inspect both ReadReports and ReportsBoundary for the exact action, resource ARN, and any Condition before proposing a change.",
    references: [getRoleReference, getPolicyReference, policyTypesReference],
  },
  {
    id: "iam-policy-simulator-boundary",
    kind: "command",
    topic: "AWS IAM investigation",
    prompt: "A teammate says, “The IAM policy simulator checks only your caller-side identity policy, so it cannot help with a bucket policy or boundary.” Which correction is accurate?",
    choices: [
      "It can evaluate identity and supplied resource policies, one boundary, and SCP effects in supported paths; treat the result as a bounded simulation",
      "Correct: the simulator can never accept a resource policy or boundary",
      "The simulator reproduces every live AWS authorization layer exactly",
      "The simulator changes the real policies temporarily and then rolls them back",
    ],
    correctChoice: "It can evaluate identity and supplied resource policies, one boundary, and SCP effects in supported paths; treat the result as a bounded simulation",
    answer: "The simulator evaluates identity-based policies, supplied resource-based policies in supported scenarios, one permissions boundary, and SCP effects. It is not a live request and it is not limited to only the caller side. It does not support RCP evaluation; VPC endpoint policies, role chains, and multiple resource-based policies on one resource are documented gaps or divergence risks. The API also has caller/principal restrictions, including no assumed-role ARN as `PolicySourceArn` and no resource-policy simulation for IAM roles.",
    references: [simulatorReference, simulatePrincipalReference],
  },
  {
    id: "iam-policy-simulator-missing-context",
    kind: "command",
    topic: "AWS IAM investigation",
    prompt: "$ aws iam simulate-principal-policy \\\n  --policy-source-arn arn:aws:iam::111122223333:role/ReportsReader \\\n  --action-names s3:ListBucket \\\n  --resource-arns arn:aws:s3:::example-reports\n\nNormalized result:\nEvalDecision: implicitDeny\nMatchedStatements: []\nMissingContextValues:\n- s3:prefix\n\nWhat should you do next?",
    choices: [
      "Supply the missing condition context for s3:prefix from the real request and rerun, then compare the exact policy condition",
      "Treat implicitDeny as proof of an explicit Deny statement",
      "Add s3:GetObject to the role trust policy",
      "Ignore MissingContextValues because conditions never affect simulation",
    ],
    correctChoice: "Supply the missing condition context for s3:prefix from the real request and rerun, then compare the exact policy condition",
    answer: "`implicitDeny` is an implicit deny: the supplied simulation found no applicable Allow; it does not prove an explicit Deny. `MissingContextValues` says evaluation lacked a condition key used by a policy. Reconstruct the real request's `s3:prefix`, pass it as a context entry, and rerun. Even then, compare the simulator's supported inputs with the live request path before treating the result as complete.",
    references: [simulatorReference, simulatePrincipalReference],
  },
  {
    id: "iam-policy-s3-list-resource",
    kind: "command",
    topic: "AWS IAM investigation",
    prompt: "ListObjectsV2 is denied.\n\nPolicy:\n{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [{\n    \"Effect\": \"Allow\",\n    \"Action\": \"s3:ListBucket\",\n    \"Resource\": \"arn:aws:s3:::example-reports/*\"\n  }]\n}\n\nWhat exact mismatch remains?",
    choices: [
      "Use s3:ListBucket on arn:aws:s3:::example-reports",
      "Replace the action with s3:GetObject but keep the object wildcard",
      "Add a Region and account ID inside the S3 bucket ARN",
      "Move s3:ListBucket into the role trust policy",
    ],
    correctChoice: "Use s3:ListBucket on arn:aws:s3:::example-reports",
    answer: "`ListObjectsV2` requires `s3:ListBucket` against the bucket resource, `arn:aws:s3:::example-reports`. The `/*` form denotes objects below the bucket and does not match the bucket-level action. In ordinary S3 bucket and object ARNs, the empty Region and account fields are not wildcards; those components are not applicable to this ARN format.",
    references: [listObjectsReference, arnReference],
  },
  {
    id: "iam-policy-s3-get-resource",
    kind: "command",
    topic: "AWS IAM investigation",
    prompt: "GetObject for 2026/q3.csv is denied.\n\nPolicy:\n{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [{\n    \"Effect\": \"Allow\",\n    \"Action\": \"s3:GetObject\",\n    \"Resource\": \"arn:aws:s3:::example-reports\"\n  }]\n}\n\nWhat exact fix matches objects in this bucket?",
    choices: [
      "Use s3:GetObject on arn:aws:s3:::example-reports/*",
      "Use s3:ListBucket on arn:aws:s3:::example-reports/*",
      "Keep the bucket ARN and add Principal to the identity policy",
      "Put s3:GetObject in the role trust policy",
    ],
    correctChoice: "Use s3:GetObject on arn:aws:s3:::example-reports/*",
    answer: "The bucket ARN names the bucket itself, while the object ARN adds `/key` or `/*`. `GetObject` for the current object version needs `s3:GetObject` on a matching object ARN. The action and resource must both match; adding the right action to the wrong resource shape still leaves an implicit denial.",
    references: [getObjectReference, arnReference],
  },
];
