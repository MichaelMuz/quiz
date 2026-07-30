import type { StaticItem } from "./content.js";

const iamRolesReference = {
  label: "AWS IAM roles documentation, accessed 2026-07-30",
  url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html",
};
const assumeRoleReference = {
  label: "AWS STS AssumeRole API reference, accessed 2026-07-30",
  url: "https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html",
};
const policyReference = {
  label: "AWS IAM policies and permissions, accessed 2026-07-30",
  url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html",
};
const assumePermissionsReference = {
  label: "AWS IAM AssumeRole permissions, accessed 2026-07-30",
  url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_control-access_assumerole.html",
};
const policyEvaluationReference = {
  label: "AWS IAM policy evaluation logic, accessed 2026-07-30",
  url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html",
};
const identityResourceReference = {
  label: "AWS IAM identity-based and resource-based policies, accessed 2026-07-30",
  url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_identity-vs-resource.html",
};
const providerRoleReference = {
  label: "AWS provider v6.57.1 aws_iam_role, accessed 2026-07-30",
  url: "https://github.com/hashicorp/terraform-provider-aws/blob/v6.57.1/website/docs/r/iam_role.html.markdown",
};
const providerInlineReference = {
  label: "AWS provider v6.57.1 aws_iam_role_policy, accessed 2026-07-30",
  url: "https://github.com/hashicorp/terraform-provider-aws/blob/v6.57.1/website/docs/r/iam_role_policy.html.markdown",
};
const providerPolicyReference = {
  label: "AWS provider v6.57.1 aws_iam_policy, accessed 2026-07-30",
  url: "https://github.com/hashicorp/terraform-provider-aws/blob/v6.57.1/website/docs/r/iam_policy.html.markdown",
};
const providerAttachmentReference = {
  label: "AWS provider v6.57.1 aws_iam_role_policy_attachment, accessed 2026-07-30",
  url: "https://github.com/hashicorp/terraform-provider-aws/blob/v6.57.1/website/docs/r/iam_role_policy_attachment.html.markdown",
};

export const iamControlPlaneItems: StaticItem[] = [
  {
    id: "iam-graph-portable-path",
    kind: "command",
    topic: "AWS IAM graph",
    prompt: "Map the portable path before AWS resource names. Which sequence is sound?",
    choices: [
      "principal → authentication → delegation → temporary credentials → authorization of action on resource, with conditions applied",
      "resource → action → authentication → principal → permanent policy credentials",
      "authorization creates a principal; conditions then authenticate the resource",
      "temporary credentials are a persistent permissions-policy object attached before authentication",
    ],
    correctChoice: "principal → authentication → delegation → temporary credentials → authorization of action on resource, with conditions applied",
    answer: "A principal first authenticates. Delegation can let it obtain a different identity's temporary credentials. AWS then authorizes each requested action against a resource under the applicable policies and conditions. Credentials carry authenticated session context; they are not themselves a policy document.",
    references: [iamRolesReference, assumeRoleReference, policyReference],
  },
  {
    id: "iam-graph-role-and-trust",
    kind: "command",
    topic: "AWS IAM graph",
    prompt: "resource \"aws_iam_role\" \"reports\" {\n  name = \"reports\"\n  assume_role_policy = local.ec2_trust\n}\n\nClassify the role and highlighted argument.",
    choices: [
      "aws_iam_role.reports is the identity/delegation target; assume_role_policy is role-owned trust that names who may obtain a session",
      "The role is a reusable capability policy; assume_role_policy lists the S3 actions its sessions may perform",
      "The role is temporary credentials; assume_role_policy is an attachment to those credentials",
      "Both objects are target-resource policies owned by S3",
    ],
    correctChoice: "aws_iam_role.reports is the identity/delegation target; assume_role_policy is role-owned trust that names who may obtain a session",
    answer: "The IAM role is an identity and delegation target. Its required trust policy is stored through `assume_role_policy` and names principals allowed to obtain role sessions, usually with `sts:AssumeRole` and optional conditions. It is similar to, but not interchangeable with, a normal permissions policy.",
    references: [iamRolesReference, assumeRoleReference],
  },
  {
    id: "iam-graph-capability-policy",
    kind: "command",
    topic: "AWS IAM graph",
    prompt: "A policy allows s3:GetObject on arn:aws:s3:::reports/*. What graph role does that policy play when bound to ReportsRole?",
    choices: [
      "The permissions policy supplies capability to the resulting role session; it does not decide who may assume the role",
      "It is the role trust policy because every Allow statement delegates the role",
      "It authenticates the original caller and emits long-term access keys",
      "It is only an attachment edge and contains no action or resource permissions",
    ],
    correctChoice: "The permissions policy supplies capability to the resulting role session; it does not decide who may assume the role",
    answer: "An identity-based permissions policy answers what the role session may do: action, resource, and conditions. The role's trust policy separately answers who may obtain that session. Reversing those categories is a control-plane graph error even though both documents use IAM policy JSON.",
    references: [policyReference, iamRolesReference],
  },
  {
    id: "iam-graph-minimal-edges",
    kind: "command",
    topic: "AWS IAM graph",
    prompt: "ReportsRole should be assumed, then read reports from S3. Which graph labels every node and edge correctly?",
    choices: [
      "caller → trust edge → role → permissions edge → action/resource; successful AssumeRole emits temporary session credentials",
      "caller → permissions edge → role → trust edge → S3; a policy resource emits permanent credentials",
      "S3 → trust edge → caller → attachment → role; the role emits a managed policy",
      "caller → role name → S3; trust, permissions, and credentials are all one embedded role field",
    ],
    correctChoice: "caller → trust edge → role → permissions edge → action/resource; successful AssumeRole emits temporary session credentials",
    answer: "The trust edge admits the caller to a role session. STS emits temporary session credentials after successful assumption. The role's permissions edge supplies candidate capabilities for later action/resource requests. Other policy layers can still constrain or grant a request, so this graph is the minimum category map, not a universal complete-authorization formula.",
    references: [iamRolesReference, assumeRoleReference, policyReference],
  },
  {
    id: "iam-graph-inline-child",
    kind: "command",
    topic: "AWS IAM graph",
    prompt: "ReportsRole needs one role-specific S3 permissions policy. What ownership graph does aws_iam_role_policy represent?",
    choices: [
      "aws_iam_role_policy is one inline capability policy owned by one role; no separate attachment resource is needed",
      "aws_iam_role_policy is reusable across roles and needs one attachment per role",
      "aws_iam_role_policy is the role's trust policy and decides who may assume it",
      "aws_iam_role_policy is the temporary credential set emitted by STS",
    ],
    correctChoice: "aws_iam_role_policy is one inline capability policy owned by one role; no separate attachment resource is needed",
    answer: "`aws_iam_role_policy` manages an inline permissions-policy child of one role. Its `role` argument establishes ownership, so there is no separate attachment node. The policy cannot be reused independently across several identities.",
    references: [providerInlineReference],
  },
  {
    id: "iam-graph-managed-policy",
    kind: "command",
    topic: "AWS IAM graph",
    prompt: "A reusable ReadReports policy is created as aws_iam_policy.read_reports. What has that creation done for ReportsRole?",
    choices: [
      "aws_iam_policy is a reusable managed capability object; creating it alone grants ReportsRole nothing",
      "The policy is automatically attached to every role referenced inside its JSON",
      "The policy becomes ReportsRole's trust policy because it is AWS-managed",
      "The policy creates an STS role session with its own access key",
    ],
    correctChoice: "aws_iam_policy is a reusable managed capability object; creating it alone grants ReportsRole nothing",
    answer: "`aws_iam_policy` creates a customer-managed IAM policy object. It owns the action/resource capability document, but no role gains that capability until an association edge attaches the policy to that role.",
    references: [providerPolicyReference],
  },
  {
    id: "iam-graph-managed-missing-attachment",
    kind: "command",
    topic: "AWS IAM graph",
    prompt: "Present:\naws_iam_role.reports\naws_iam_policy.read_reports\n\nThe role can be assumed, but its session cannot read reports. Which modern explicit edge is missing?",
    choices: [
      "Add aws_iam_role_policy_attachment connecting ReportsRole's name to the managed policy's ARN",
      "Add a second assume_role_policy containing s3:GetObject",
      "Add another aws_iam_policy with the same JSON but no association",
      "Add a Terraform resource representing the STS access key",
    ],
    correctChoice: "Add aws_iam_role_policy_attachment connecting ReportsRole's name to the managed policy's ARN",
    answer: "The role and managed policy are separate nodes. `aws_iam_role_policy_attachment` supplies the association edge with `role = aws_iam_role.reports.name` and `policy_arn = aws_iam_policy.read_reports.arn`. Without that edge, the managed policy grants the role nothing.",
    references: [providerRoleReference, providerPolicyReference, providerAttachmentReference],
  },
  {
    id: "iam-graph-modern-inline-hcl",
    kind: "command",
    topic: "AWS IAM graph",
    prompt: "resource \"aws_iam_role\" \"reports\" {\n  name               = \"reports\"\n  assume_role_policy = local.ec2_trust_json\n}\n\nresource \"aws_iam_role_policy\" \"read\" {\n  name   = \"read-reports\"\n  role   = aws_iam_role.reports.id\n  policy = local.s3_read_json\n}\n\nClassify this current explicit graph.",
    choices: [
      "Role owns trust; aws_iam_role_policy is its inline capability child; the role argument is the ownership edge",
      "Role owns capability; aws_iam_role_policy is reusable trust; policy is an attachment edge",
      "Both resources are managed policies and require aws_iam_role_policy_attachment",
      "The second resource stores the STS runtime credentials for the first",
    ],
    correctChoice: "Role owns trust; aws_iam_role_policy is its inline capability child; the role argument is the ownership edge",
    answer: "This is the normalized explicit inline form. `aws_iam_role.assume_role_policy` stores trust on the role. The separate `aws_iam_role_policy` resource stores one inline capability document owned by that role through `role`; it does not need a managed-policy attachment.",
    references: [providerRoleReference, providerInlineReference],
  },
  {
    id: "iam-graph-modern-managed-hcl",
    kind: "command",
    topic: "AWS IAM graph",
    prompt: "resource \"aws_iam_role\" \"reports\" {\n  name               = \"reports\"\n  assume_role_policy = local.ec2_trust_json\n}\n\nresource \"aws_iam_policy\" \"read\" {\n  name   = \"read-reports\"\n  policy = local.s3_read_json\n}\n\nresource \"aws_iam_role_policy_attachment\" \"read\" {\n  role       = aws_iam_role.reports.name\n  policy_arn = aws_iam_policy.read.arn\n}\n\nWhich graph is encoded?",
    choices: [
      "Role owns trust; managed policy owns reusable capability; attachment connects role name to policy ARN",
      "Managed policy owns trust; role owns reusable capability; attachment emits credentials",
      "Attachment contains the action/resource policy while aws_iam_policy is only a label",
      "All three resources exclusively manage every policy associated with the role",
    ],
    correctChoice: "Role owns trust; managed policy owns reusable capability; attachment connects role name to policy ARN",
    answer: "This is the normalized explicit managed-policy form. Trust remains embedded in the role. `aws_iam_policy` is the reusable capability node, and `aws_iam_role_policy_attachment` is the distinct association edge from the role name to the policy ARN.",
    references: [providerRoleReference, providerPolicyReference, providerAttachmentReference],
  },
  {
    id: "iam-graph-sts-runtime-result",
    kind: "command",
    topic: "AWS IAM graph",
    prompt: "AssumeRole succeeds for ReportsRole. Which new thing exists at runtime?",
    choices: [
      "STS returns temporary access key, secret key, and session token for a role session; these are runtime credentials, not another OpenTofu policy resource",
      "OpenTofu creates a persistent aws_iam_session_policy resource containing the role's trust",
      "The role's trust JSON becomes a long-term access key attached to S3",
      "The managed-policy attachment is copied into a new IAM role resource per request",
    ],
    correctChoice: "STS returns temporary access key, secret key, and session token for a role session; these are runtime credentials, not another OpenTofu policy resource",
    answer: "`AssumeRole` returns temporary security credentials: access key ID, secret access key, and session token. They authenticate a role session for subsequent API calls. The role's identity policies supply its maximum candidate permissions, while optional session policies can only narrow them. Credentials are runtime output, not a persistent policy or attachment node in this OpenTofu graph.",
    references: [assumeRoleReference, assumePermissionsReference],
  },
  {
    id: "iam-graph-cross-account-assume",
    kind: "command",
    topic: "AWS IAM graph",
    prompt: "Account A's BuildRole tries to assume Account B's ReportsRole. ReportsRole trusts BuildRole, but BuildRole has no sts:AssumeRole permission. What is missing?",
    choices: [
      "Both the caller-side identity policy and ReportsRole trust must allow sts:AssumeRole in this cross-account scenario",
      "Nothing; the target trust policy universally completes authorization by itself",
      "ReportsRole needs s3:GetObject in its trust policy",
      "BuildRole needs the target role's S3 capability policy attached before it can call STS",
    ],
    correctChoice: "Both the caller-side identity policy and ReportsRole trust must allow sts:AssumeRole in this cross-account scenario",
    answer: "For this cross-account role assumption, both sides are required: Account A must authorize BuildRole to call `sts:AssumeRole` on ReportsRole, and ReportsRole's trust policy in Account B must trust the caller. Same-account grants through a resource-based trust policy have qualifications that can change whether a separate identity-policy Allow is required, so do not turn this concrete cross-account rule into a false universal.",
    references: [assumeRoleReference, assumePermissionsReference],
  },
  {
    id: "iam-graph-resource-policy-evaluation",
    kind: "command",
    topic: "AWS IAM graph",
    prompt: "ReportsRole was assumed successfully. Its session now calls s3:GetObject. Which statement preserves the trust-versus-authorization boundary?",
    choices: [
      "Trust admits the session; the later S3 request is evaluated with applicable identity/resource policies and constraints, and an explicit deny wins",
      "The role trust policy grants s3:GetObject because it already allowed sts:AssumeRole",
      "Only the role's attached policy can ever affect S3; bucket policies and explicit denies are irrelevant",
      "The STS access key contains a permanent copy of every policy, so later policy changes cannot matter",
    ],
    correctChoice: "Trust admits the session; the later S3 request is evaluated with applicable identity/resource policies and constraints, and an explicit deny wins",
    answer: "Trust controls whether the role session can be created; it does not grant `s3:GetObject`. AWS evaluates the later request using applicable identity-based and resource-based policies plus constraints such as session policies, permissions boundaries, and organization policies. The exact combination depends on principal and account context, and an applicable explicit Deny overrides an Allow.",
    references: [policyEvaluationReference, identityResourceReference, assumePermissionsReference],
  },
  {
    id: "iam-graph-historical-fused-forms",
    kind: "command",
    topic: "AWS IAM graph",
    prompt: "Historical/fused form:\nresource \"aws_iam_role\" \"reports\" {\n  name               = \"reports\"\n  assume_role_policy = local.ec2_trust_json\n\n  inline_policy {\n    name   = \"read-reports\"\n    policy = local.s3_read_json\n  }\n\n  managed_policy_arns = [aws_iam_policy.read.arn]\n}\n\nWhat is the current explicit equivalent?",
    choices: [
      "Use aws_iam_role_policy for inline policies and aws_iam_role_policy_attachment for managed ones; add exclusive resources only for whole-set ownership",
      "Both fields map to assume_role_policy because all embedded role policies are trust",
      "Both fields map to STS session credentials and should be recreated for each request",
      "inline_policy maps to aws_iam_policy; managed_policy_arns needs no attachment because policy creation grants every role",
    ],
    correctChoice: "Use aws_iam_role_policy for inline policies and aws_iam_role_policy_attachment for managed ones; add exclusive resources only for whole-set ownership",
    answer: "AWS provider v6.57.1 marks `aws_iam_role.inline_policy` and `managed_policy_arns` deprecated. Read them as older fused encodings with exclusive-management behavior. Prefer separate `aws_iam_role_policy` children or `aws_iam_role_policy_attachment` edges. Add the corresponding exclusive-management resource only when the configuration intentionally owns the complete inline-policy or managed-attachment set.",
    references: [providerRoleReference, providerInlineReference, providerAttachmentReference],
  },
  {
    id: "iam-graph-exclusive-style-conflict",
    kind: "command",
    topic: "AWS IAM graph",
    prompt: "One role is managed both ways:\n• aws_iam_role.reports uses inline_policy\n• aws_iam_role_policy.read targets reports\n• aws_iam_role.reports uses managed_policy_arns\n• aws_iam_role_policy_attachment.read targets reports\n\nWhat is the ownership error?",
    choices: [
      "Choose one ownership style per policy type; fused role fields and per-policy resources must not manage the same set",
      "No error; every representation owns a disjoint edge and is designed to be mixed",
      "Only assume_role_policy conflicts because trust can never be embedded in a role",
      "The fix is to model each STS credential as another attachment resource",
    ],
    correctChoice: "Choose one ownership style per policy type; fused role fields and per-policy resources must not manage the same set",
    answer: "`aws_iam_role_policy` conflicts with the role's fused `inline_policy` blocks because both manage inline policies. `aws_iam_role_policy_attachment` conflicts with the role's fused `managed_policy_arns` because both manage managed-policy associations. The provider documents permanent differences, cycling, or errors when these ownership styles are mixed. Choose explicit per-policy resources, or choose intentional exclusive management, but do not let both own the same policy type.",
    references: [providerRoleReference, providerInlineReference, providerAttachmentReference],
  },
];
