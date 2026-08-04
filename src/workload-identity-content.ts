import type { StaticItem } from "./content.js";

const oidcReference = {
  label: "OpenID Connect Core 1.0 incorporating errata set 2, accessed 2026-08-04",
  url: "https://openid.net/specs/openid-connect-core-1_0.html",
};
const oauthReference = {
  label: "RFC 6749 OAuth 2.0, accessed 2026-08-04",
  url: "https://www.rfc-editor.org/rfc/rfc6749.html",
};
const oauthSecurityReference = {
  label: "RFC 9700 OAuth 2.0 Security Best Current Practice, accessed 2026-08-04",
  url: "https://www.rfc-editor.org/rfc/rfc9700.html",
};
const irsaReference = {
  label: "Amazon EKS IAM roles for service accounts, accessed 2026-08-04",
  url: "https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html",
};
const irsaRoleReference = {
  label: "Amazon EKS assign IAM roles to service accounts, accessed 2026-08-04",
  url: "https://docs.aws.amazon.com/eks/latest/userguide/associate-service-account-role.html",
};
const irsaSdkReference = {
  label: "Amazon EKS use IRSA with AWS SDKs, accessed 2026-08-04",
  url: "https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts-minimum-sdk.html",
};
const kubernetesServiceAccountReference = {
  label: "Kubernetes Service Accounts, accessed 2026-08-04",
  url: "https://kubernetes.io/docs/concepts/security/service-accounts/",
};
const kubernetesProjectedTokenReference = {
  label: "Kubernetes projected serviceAccountToken volumes, accessed 2026-08-04",
  url: "https://kubernetes.io/docs/concepts/storage/projected-volumes/#serviceaccounttoken",
};
const stsWebIdentityReference = {
  label: "AWS STS AssumeRoleWithWebIdentity API, accessed 2026-08-04",
  url: "https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRoleWithWebIdentity.html",
};
const sigvReference = {
  label: "AWS create a signed API request, accessed 2026-08-04",
  url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv-create-signed-request.html",
};
const temporaryCredentialsReference = {
  label: "AWS temporary security credentials, accessed 2026-08-04",
  url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html",
};
const podIdentityReference = {
  label: "Amazon EKS Pod Identity, accessed 2026-08-04",
  url: "https://docs.aws.amazon.com/eks/latest/userguide/pod-identities.html",
};
const podIdentityAssociationReference = {
  label: "Amazon EKS create a Pod Identity association, accessed 2026-08-04",
  url: "https://docs.aws.amazon.com/eks/latest/userguide/pod-id-association.html",
};
const podIdentityHowReference = {
  label: "Amazon EKS understand how Pod Identity works, accessed 2026-08-04",
  url: "https://docs.aws.amazon.com/eks/latest/userguide/pod-id-how-it-works.html",
};
const podIdentitySdkReference = {
  label: "Amazon EKS use Pod Identity with AWS SDKs, accessed 2026-08-04",
  url: "https://docs.aws.amazon.com/eks/latest/userguide/pod-id-minimum-sdk.html",
};

export const workloadIdentityItems: StaticItem[] = [
  {
    id: "workload-auth-protocol-boundaries",
    kind: "command",
    topic: "Workload identity",
    prompt: "A product signs a person in once, then a client calls an API for them and also learns who signed in. Which distinction is accurate?",
    choices: [
      "SSO is the sign-in outcome; OAuth 2.0 delegates authorization to an API; OIDC adds an identity layer and ID Token for the relying party",
      "SSO, OAuth 2.0, and OIDC are three names for the same JWT format",
      "OAuth 2.0 authenticates the person with an ID Token; OIDC only chooses API permissions",
      "SSO requires every access token and ID Token to have the same recipient and claims",
    ],
    correctChoice: "SSO is the sign-in outcome; OAuth 2.0 delegates authorization to an API; OIDC adds an identity layer and ID Token for the relying party",
    answer: "SSO is an outcome: one sign-in can establish access across applications. OAuth 2.0 is an authorization framework in which an access token lets a client call a resource server within delegated scope. Access tokens are not necessarily JWTs; OAuth permits opaque or self-contained forms. OIDC adds authentication and identity claims on top of OAuth. Its ID Token is a JWT whose audience includes the relying party's client ID. The ID Token is for the relying party, while an access token is for the protected resource/API, so they are not interchangeable.",
    references: [oidcReference, oauthReference],
  },
  {
    id: "workload-auth-code-pkce-boundaries",
    kind: "command",
    topic: "Workload identity",
    prompt: "A browser-based authorization-code flow returns to a registered client callback. Which protection boundary is current and accurate?",
    choices: [
      "Bind the code with PKCE, require exact registered redirect matching, and validate state or OIDC nonce as applicable; do not assume every client can keep a secret",
      "A client secret alone makes any stolen code useless, so redirect matching, state, nonce, and PKCE are optional",
      "Send the access token in the authorization redirect because a code has no security purpose",
      "Reuse one authorization code across callbacks as long as each callback presents a different state value",
    ],
    correctChoice: "Bind the code with PKCE, require exact registered redirect matching, and validate state or OIDC nonce as applicable; do not assume every client can keep a secret",
    answer: "The authorization server returns a short-lived, single-use code through the registered redirect path, then the client exchanges it at the token endpoint. RFC 6749 binds the authorization code to the client identifier and redirection URI. RFC 9700 says public clients MUST use PKCE; for confidential clients, PKCE is RECOMMENDED. Exact redirect matching closes another leakage path. State bound to the user agent protects OAuth callbacks when PKCE or an OIDC mechanism is not supplying that protection, while OIDC nonce binds authentication responses and ID Tokens. A public client cannot safely rely on a client secret, so never teach that a stolen code is universally useless without one.",
    references: [oauthReference, oauthSecurityReference, oidcReference],
  },
  {
    id: "workload-auth-irsa-end-to-end-order",
    kind: "ordering",
    topic: "Workload identity",
    prompt: "Put the normal IRSA path in order, from Kubernetes workload identity to an authenticated AWS service request.",
    orderedItems: [
      "EKS control plane exposes the cluster OIDC issuer and TokenRequest signs a bounded service-account JWT",
      "kubelet projects and rotates that JWT for the Pod with audience sts.amazonaws.com",
      "the role trust checks the cluster OIDC provider plus the token subject and audience",
      "the SDK calls STS AssumeRoleWithWebIdentity with the projected JWT",
      "STS returns an access-key ID, secret access key, and session token with an expiry",
      "the SDK signs the native AWS service request with SigV4 and refreshes credentials before expiry",
    ],
    answer: "IRSA bridges two credential domains. Kubernetes supplies a bounded, audience-scoped service-account JWT. IAM role trust lets STS exchange that identity proof for expiring AWS credentials. The SDK then uses all three credential parts to SigV4-sign the actual AWS service request and renews credentials before expiry. The projected JWT is not itself an AWS access key or a SigV4 signature.",
    references: [irsaReference, kubernetesServiceAccountReference, stsWebIdentityReference, irsaSdkReference, sigvReference],
  },
  {
    id: "workload-auth-tokenrequest-owner",
    kind: "command",
    topic: "Workload identity",
    prompt: "Who creates and refreshes the bounded service-account JWT mounted into an IRSA Pod?",
    choices: [
      "The control-plane TokenRequest path issues and signs it; kubelet projects and rotates it in the Pod",
      "The kubelet invents and signs the JWT locally with the node's IAM role secret",
      "STS writes an AWS access-key triple into the projected Kubernetes volume",
      "The application creates a permanent JWT and registers it as the cluster OIDC issuer",
    ],
    correctChoice: "The control-plane TokenRequest path issues and signs it; kubelet projects and rotates it in the Pod",
    answer: "The Kubernetes control plane exposes the configured issuer and signs the bounded JWT obtained through the TokenRequest API. The kubelet requests the token, projects it into the Pod, and rotates it before expiry; it does not mint or sign the JWT locally. In IRSA the requested audience is `sts.amazonaws.com`, so STS is the intended recipient.",
    references: [kubernetesServiceAccountReference, kubernetesProjectedTokenReference, irsaReference],
  },
  {
    id: "workload-auth-irsa-trust-conditions",
    kind: "command",
    topic: "Workload identity",
    prompt: "Role ReportsReader is for ServiceAccount reader in namespace orchard. Which trust shape authorizes only that IRSA identity?",
    choices: [
      "Federated cluster OIDC provider + aud = sts.amazonaws.com + sub = system:serviceaccount:orchard:reader",
      "Service principal pods.eks.amazonaws.com + aud = any + no Kubernetes subject condition",
      "Federated cluster OIDC provider + sub = arn:aws:iam::role/ReportsReader + no audience",
      "EC2 service principal + s3:GetObject in the role trust policy",
    ],
    correctChoice: "Federated cluster OIDC provider + aud = sts.amazonaws.com + sub = system:serviceaccount:orchard:reader",
    answer: "IRSA role trust names the cluster's IAM OIDC provider as the federated principal and allows `sts:AssumeRoleWithWebIdentity`. Conditions bind `aud` to `sts.amazonaws.com` and `sub` to the intended `system:serviceaccount:<namespace>:<name>`. The role's permissions policy separately controls what the resulting session may do.",
    references: [irsaRoleReference, stsWebIdentityReference],
  },
  {
    id: "workload-auth-credential-artifacts",
    kind: "command",
    topic: "Workload identity",
    prompt: "The SDK has just completed AssumeRoleWithWebIdentity. Which artifacts does it use for the next native AWS request?",
    choices: [
      "The temporary access-key ID and secret access key sign the request, and the temporary session token accompanies it",
      "The projected service-account JWT is copied into the SigV4 Authorization signature field unchanged",
      "Only the access-key ID is required because temporary role sessions have no secret or session token",
      "The role trust JSON is encrypted and sent as the service request body",
    ],
    correctChoice: "The temporary access-key ID and secret access key sign the request, and the temporary session token accompanies it",
    answer: "The projected JWT is identity evidence exchanged with STS, not the resulting AWS credential. STS returns a temporary access key ID, secret access key, session token, and expiry. The key ID identifies the credential, the secret derives the SigV4 signing key, and the session token is mandatory when using those temporary credentials. The secret access key is not sent in the request.",
    references: [stsWebIdentityReference, temporaryCredentialsReference, sigvReference],
  },
  {
    id: "workload-auth-sigv4-order",
    kind: "ordering",
    topic: "Workload identity",
    prompt: "Put the useful SigV4 signing steps in order for a request made with temporary credentials.",
    orderedItems: [
      "normalize request details into the canonical request",
      "SHA-256 hash the canonical request",
      "build the string to sign with timestamp, credential scope, and canonical-request hash",
      "derive the date/Region/service/aws4_request signing key from the secret access key",
      "HMAC-SHA256 the string to sign with that scoped signing key",
      "send the access-key ID, scope, signed headers, and signature, plus the session token for temporary credentials",
    ],
    answer: "SigV4 canonicalizes the method, path, query, selected headers, signed-header list, and payload hash, then hashes that canonical request. The string to sign combines the algorithm, request time, credential scope, and canonical-request hash. A date/Region/service/aws4_request key derived from the secret access key HMAC-SHA256-signs that string. The secret access key is not sent. Signing authenticates request integrity and credential possession; it is not encryption, and it does not replace TLS or justify claims about undocumented service internals.",
    references: [sigvReference],
  },
  {
    id: "workload-auth-sdk-boundary",
    kind: "command",
    topic: "Workload identity",
    prompt: "An application uses a standard AWS SDK client to call S3 from an IRSA Pod. Which responsibility boundary is normal?",
    choices: [
      "The SDK credential provider loads/exchanges/refreshes credentials and SigV4-signs native AWS requests; a custom service accepting SigV4 needs its own verifier contract",
      "The application must manually derive every HMAC key because AWS SDK clients never sign service calls",
      "The kubelet signs every S3 HTTP request after minting an AWS access key",
      "Any HTTP service automatically understands AWS SigV4 when it sees an Authorization header",
    ],
    correctChoice: "The SDK credential provider loads/exchanges/refreshes credentials and SigV4-signs native AWS requests; a custom service accepting SigV4 needs its own verifier contract",
    answer: "At the normal SDK boundary, the default credential chain discovers the web-identity provider, exchanges the projected token, caches and refreshes temporary credentials, and signs each native AWS service request. Explicit or earlier providers can win before IRSA. A custom HTTP service is not automatically an AWS service: accepting SigV4 there is a separate verifier and authorization contract that must define canonicalization, credential lookup, freshness, and policy behavior.",
    references: [irsaSdkReference, sigvReference],
  },
  {
    id: "workload-auth-trust-diagnosis",
    kind: "command",
    topic: "Workload identity",
    prompt: "IRSA exchange fails. Trust expects aud=sts.amazonaws.com and sub=system:serviceaccount:orchard:reader. The mounted token has aud=kubernetes.default.svc and sub=system:serviceaccount:orchard:writer. Where is the first mismatch?",
    choices: [
      "The token audience or subject violates the role trust conditions, so STS must reject the exchange",
      "SigV4 canonicalization, because STS has already returned valid AWS credentials",
      "The S3 permissions policy, because service-account JWT claims are evaluated only by S3",
      "The session token header, because the projected JWT is already a temporary AWS credential triple",
    ],
    correctChoice: "The token audience or subject violates the role trust conditions, so STS must reject the exchange",
    answer: "Diagnose the bridge in order. Before any service request can be signed, STS must accept the projected identity token under the role's OIDC trust. Here both `aud` and `sub` disagree with the trust conditions. Fix the requested audience or the ServiceAccount/namespace binding; do not start with S3 policy or SigV4 evidence because no AWS credentials were issued yet.",
    references: [irsaRoleReference, stsWebIdentityReference],
  },
  {
    id: "workload-auth-signing-diagnosis",
    kind: "command",
    topic: "Workload identity",
    prompt: "Expected provider: IRSA\nObserved provider: static environment credentials\nObserved access key: expired temporary key\nObserved request: no x-amz-security-token\n\nWhat should be fixed first?",
    choices: [
      "Remove or repair the earlier environment provider so the SDK can select and refresh IRSA credentials; temporary credentials must include their session token",
      "Change the projected JWT audience to S3 and send that JWT as the SigV4 signature",
      "Keep the stale keys but remove the request timestamp so they no longer expire",
      "Attach the session token to the IAM role trust policy instead of the HTTP request",
    ],
    correctChoice: "Remove or repair the earlier environment provider so the SDK can select and refresh IRSA credentials; temporary credentials must include their session token",
    answer: "The default credential chain stops at an earlier valid-looking provider, so static environment values can mask IRSA. Those stale temporary credentials will not be renewed by the web-identity provider, and their session token is required on signed requests. Remove or update the override, let the SDK select IRSA and refresh before expiry, then verify the access-key ID, expiry, and accompanying session token as one credential set.",
    references: [irsaSdkReference, temporaryCredentialsReference, sigvReference],
  },
  {
    id: "workload-auth-pod-identity-objects",
    kind: "command",
    topic: "Workload identity",
    prompt: "Which object and trust boundary correctly distinguishes EKS Pod Identity from IRSA?",
    choices: [
      "An EKS association maps cluster/namespace/ServiceAccount to a role whose trust names pods.eks.amazonaws.com; IRSA instead trusts a cluster OIDC provider",
      "A ServiceAccount annotation directly trusts pods.eks.amazonaws.com and makes the EKS association optional",
      "Pod Identity uses AssumeRoleWithWebIdentity against a per-cluster IAM OIDC provider exactly like IRSA",
      "Pod Identity stores a permanent IAM secret in the ServiceAccount Secret object",
    ],
    correctChoice: "An EKS association maps cluster/namespace/ServiceAccount to a role whose trust names pods.eks.amazonaws.com; IRSA instead trusts a cluster OIDC provider",
    answer: "IRSA uses a cluster IAM OIDC provider, role trust conditions on `aud` and `sub`, and usually a role annotation on the ServiceAccount. EKS Pod Identity keeps the workload-to-role mapping in an EKS association and uses direct role trust for the `pods.eks.amazonaws.com` service principal. That trust can be reused across clusters, while each cluster needs its own association. Pod Identity also requires the node agent and a supported SDK; the agent is not available for Fargate Pods or Windows Pods, so those operational constraints matter before choosing it.",
    references: [irsaReference, podIdentityReference, podIdentityAssociationReference],
  },
  {
    id: "workload-auth-pod-identity-flow-order",
    kind: "ordering",
    topic: "Workload identity",
    prompt: "Put the EKS Pod Identity path in order, from association to an authenticated AWS service request.",
    orderedItems: [
      "an EKS Pod Identity association maps cluster, namespace, and ServiceAccount to an IAM role",
      "EKS adds a projected token plus container-credential URI and token-file environment variables to the Pod manifest",
      "kubelet projects the token for audience pods.eks.amazonaws.com",
      "the SDK container provider calls the node agent URI and authenticates with the projected token",
      "the Pod Identity Agent calls the EKS Auth API and returns temporary role credentials",
      "the SDK SigV4-signs the native AWS request and refreshes through the same provider before expiry",
    ],
    answer: "Pod Identity is not AssumeRoleWithWebIdentity. The projected token authenticates the local container-credential request, the node agent calls `AssumeRoleForPodIdentity` through the EKS Auth API, and the SDK receives temporary AWS credentials. The same precedence warning applies: an explicit or earlier credential provider can still win over the container provider and mask Pod Identity. After credentials are selected, ordinary SigV4 request signing is unchanged.",
    references: [podIdentityHowReference, podIdentitySdkReference, sigvReference],
  },
];
