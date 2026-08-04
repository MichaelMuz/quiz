import { describe, expect, it } from "vitest";
import { contentBank, generateOrderingQuestion, gradeAnswer } from "../src/content.js";
import type { OrderingItem } from "../src/content.js";
import { chooseStableId } from "../src/scheduler.js";

function item(id: string) {
  const found = contentBank.find((candidate) => candidate.id === id);
  expect(found, `missing ${id}`).toBeDefined();
  return found!;
}

describe("EKS workload identity and SigV4 fluency", () => {
  it("separates SSO, OAuth, OIDC token recipients, and current authorization-code protections", () => {
    const ids = [
      "workload-auth-protocol-boundaries",
      "workload-auth-code-pkce-boundaries",
    ];
    expect(contentBank.filter(({ id }) => id.startsWith("workload-auth-")).map(({ id }) => id).slice(0, 2))
      .toEqual(ids);

    const protocols = item(ids[0]!);
    expect(protocols.correctChoice).toMatch(/SSO.*outcome.*OAuth.*authorization.*OIDC.*identity/i);
    expect(protocols.answer).toMatch(/access tokens?.*not necessarily.*JWT/is);
    expect(protocols.answer).toMatch(/ID Token.*JWT.*relying party/is);
    expect(protocols.answer).toMatch(/access token.*resource server/is);

    const code = item(ids[1]!);
    expect(code.correctChoice).toMatch(/PKCE.*redirect.*state.*nonce/i);
    expect(code.answer).toMatch(/public clients.*must.*PKCE.*confidential.*recommended/is);
    expect(code.answer).toMatch(/authorization code.*client identifier.*redirect(?:ion)? URI/is);
    expect(code.answer).toMatch(/client secret.*never teach.*stolen code.*universally useless/is);

    for (const candidate of [protocols, code]) {
      expect(candidate.choices).toContain(candidate.correctChoice);
      expect(candidate.references?.length).toBeGreaterThan(0);
      expect(candidate.references?.every(({ label, url }) =>
        label.includes("accessed 2026-08-04")
        && (url.startsWith("https://openid.net/") || url.startsWith("https://www.rfc-editor.org/")),
      )).toBe(true);
    }
  });

  it("traces IRSA from TokenRequest identity through STS credentials and SigV4", () => {
    const ids = contentBank.filter(({ id }) => id.startsWith("workload-auth-")).map(({ id }) => id);
    expect(ids.slice(0, 10)).toEqual([
      "workload-auth-protocol-boundaries",
      "workload-auth-code-pkce-boundaries",
      "workload-auth-irsa-end-to-end-order",
      "workload-auth-tokenrequest-owner",
      "workload-auth-irsa-trust-conditions",
      "workload-auth-credential-artifacts",
      "workload-auth-sigv4-order",
      "workload-auth-sdk-boundary",
      "workload-auth-trust-diagnosis",
      "workload-auth-signing-diagnosis",
    ]);

    expect(item("workload-auth-irsa-end-to-end-order").orderedItems).toEqual([
      "EKS control plane exposes the cluster OIDC issuer and TokenRequest signs a bounded service-account JWT",
      "kubelet projects and rotates that JWT for the Pod with audience sts.amazonaws.com",
      "the role trust checks the cluster OIDC provider plus the token subject and audience",
      "the SDK calls STS AssumeRoleWithWebIdentity with the projected JWT",
      "STS returns an access-key ID, secret access key, and session token with an expiry",
      "the SDK signs the native AWS service request with SigV4 and refreshes credentials before expiry",
    ]);

    expect(item("workload-auth-tokenrequest-owner").answer).toMatch(
      /control plane.*issuer.*signs.*TokenRequest.*kubelet.*projects.*rotates.*does not mint/is,
    );
    expect(item("workload-auth-irsa-trust-conditions").correctChoice).toMatch(
      /Federated.*OIDC.*aud.*sts\.amazonaws\.com.*sub.*system:serviceaccount/is,
    );
    expect(item("workload-auth-credential-artifacts").answer).toMatch(
      /projected JWT.*exchanged.*access key ID.*secret access key.*session token.*mandatory/is,
    );

    expect(item("workload-auth-sigv4-order").orderedItems).toEqual([
      "normalize request details into the canonical request",
      "SHA-256 hash the canonical request",
      "build the string to sign with timestamp, credential scope, and canonical-request hash",
      "derive the date/Region/service/aws4_request signing key from the secret access key",
      "HMAC-SHA256 the string to sign with that scoped signing key",
      "send the access-key ID, scope, signed headers, and signature, plus the session token for temporary credentials",
    ]);
    expect(item("workload-auth-sigv4-order").answer).toMatch(/secret access key.*not sent.*signing.*not encryption/is);
    expect(item("workload-auth-sdk-boundary").answer).toMatch(
      /default credential chain.*exchange.*cache.*refresh.*sign.*native AWS.*custom HTTP service.*separate verifier/is,
    );
    expect(item("workload-auth-trust-diagnosis").correctChoice).toMatch(/audience or subject.*trust/i);
    expect(item("workload-auth-signing-diagnosis").answer).toMatch(/credential chain.*earlier.*stale/is);
    expect(item("workload-auth-signing-diagnosis").answer).toMatch(/session token.*required/is);

    for (const id of ids.slice(2)) {
      const candidate = item(id);
      expect(candidate.kind === "ordering" || candidate.choices?.includes(candidate.correctChoice!)).toBe(true);
      expect(candidate.references?.length).toBeGreaterThan(0);
      expect(candidate.references?.every(({ label, url }) =>
        label.includes("accessed 2026-08-04")
        && (url.startsWith("https://docs.aws.amazon.com/") || url.startsWith("https://kubernetes.io/")),
      )).toBe(true);
    }
  });

  it("compares EKS Pod Identity by objects, trust, provider precedence, and flow", () => {
    const ids = contentBank.filter(({ id }) => id.startsWith("workload-auth-")).map(({ id }) => id);
    expect(ids).toEqual([
      "workload-auth-protocol-boundaries",
      "workload-auth-code-pkce-boundaries",
      "workload-auth-irsa-end-to-end-order",
      "workload-auth-tokenrequest-owner",
      "workload-auth-irsa-trust-conditions",
      "workload-auth-credential-artifacts",
      "workload-auth-sigv4-order",
      "workload-auth-sdk-boundary",
      "workload-auth-trust-diagnosis",
      "workload-auth-signing-diagnosis",
      "workload-auth-pod-identity-objects",
      "workload-auth-pod-identity-flow-order",
    ]);

    const objects = item("workload-auth-pod-identity-objects");
    expect(objects.correctChoice).toMatch(/EKS association.*ServiceAccount.*role.*pods\.eks\.amazonaws\.com/is);
    expect(objects.answer).toMatch(/IRSA.*OIDC provider.*Pod Identity.*association.*agent.*Fargate.*Windows/is);

    const flow = item("workload-auth-pod-identity-flow-order");
    expect(flow.orderedItems).toEqual([
      "an EKS Pod Identity association maps cluster, namespace, and ServiceAccount to an IAM role",
      "EKS adds a projected token plus container-credential URI and token-file environment variables to the Pod manifest",
      "kubelet projects the token for audience pods.eks.amazonaws.com",
      "the SDK container provider calls the node agent URI and authenticates with the projected token",
      "the Pod Identity Agent calls the EKS Auth API and returns temporary role credentials",
      "the SDK SigV4-signs the native AWS request and refreshes through the same provider before expiry",
    ]);
    expect(flow.answer).toMatch(/not AssumeRoleWithWebIdentity.*earlier credential provider.*win/is);

    for (const orderingId of ["workload-auth-irsa-end-to-end-order", "workload-auth-sigv4-order", "workload-auth-pod-identity-flow-order"]) {
      const definition = item(orderingId) as OrderingItem;
      const first = generateOrderingQuestion(definition, 8675309);
      const replay = generateOrderingQuestion(definition, 8675309);
      expect(replay).toEqual(first);
      expect(gradeAnswer(first.grader, first.expectedAnswer, first.expectedAnswer)).toBe(true);
    }

    const reachable = new Set(Array.from({ length: contentBank.length * 2 }, (_, position) =>
      chooseStableId((position * 2) + 1, [], new Date("2026-08-04T00:00:00.000Z"))));
    expect(ids.every((id) => reachable.has(id))).toBe(true);
  });
});
