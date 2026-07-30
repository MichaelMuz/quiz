import { describe, expect, it } from "vitest";
import { contentBank } from "../src/content.js";
import { chooseStableId } from "../src/scheduler.js";
import { QuizStore } from "../src/store.js";

function item(id: string) {
  const found = contentBank.find((candidate) => candidate.id === id);
  expect(found, `missing ${id}`).toBeDefined();
  return found!;
}

const ids = () => contentBank
  .filter(({ id }) => id.startsWith("vpc-graph-"))
  .map(({ id }) => id);

describe("AWS VPC connectivity graph fluency", () => {
  it("maps portable routing roles before AWS names and keeps same-VPC routing local", () => {
    expect(ids().slice(0, 4)).toEqual([
      "vpc-graph-portable-object-map",
      "vpc-graph-same-vpc-subnets",
      "vpc-graph-route-table-association",
      "vpc-graph-internet-vs-nat-gateway",
    ]);

    expect(item("vpc-graph-portable-object-map").correctChoice).toBe(
      "boundary → VPC; AZ-scoped CIDR segment → subnet; next-hop policy → route table; stateful ENI/workload filter → security group; stateless subnet-boundary filter → network ACL",
    );
    expect(item("vpc-graph-same-vpc-subnets").correctChoice).toBe(
      "No peering. Both subnets are inside Orchard VPC, so its local route can carry the traffic when the selected routes and filters allow it",
    );
    expect(item("vpc-graph-route-table-association").correctChoice).toBe(
      "Associate Web-A with rt-peer; a route in rt-peer is irrelevant while Web-A selects rt-main",
    );
    expect(item("vpc-graph-internet-vs-nat-gateway").correctChoice).toMatch(
      /internet gateway.*public-addressed.*inbound.*public NAT gateway.*outbound.*unsolicited inbound/i,
    );

    for (const id of ids().slice(0, 4)) {
      const candidate = item(id);
      expect(candidate.choices).toContain(candidate.correctChoice);
      expect(candidate.references?.length).toBeGreaterThan(0);
      expect(candidate.references?.every(({ label, url }) =>
        label.includes("accessed 2026-07-30")
        && (url.startsWith("https://docs.aws.amazon.com/")
          || url.includes("/hashicorp/terraform-provider-aws/blob/v6.57.1/")),
      )).toBe(true);
    }
  });

  it("traces connectivity, selected routes, and filters as separate required edges", () => {
    expect(ids().slice(4, 9)).toEqual([
      "vpc-graph-minimum-peering-path",
      "vpc-graph-opentofu-reverse-route",
      "vpc-graph-pending-acceptance",
      "vpc-graph-first-denying-filter",
      "vpc-graph-stateless-return-path",
    ]);

    expect(item("vpc-graph-minimum-peering-path").correctChoice).toBe(
      "active peering connection + Orchard route to 10.20.0.0/16 + Ledger route to 10.10.0.0/16 + permitting filters on the complete path",
    );

    const tofu = item("vpc-graph-opentofu-reverse-route");
    expect(tofu.prompt).toMatch(
      /aws_vpc_peering_connection.*vpc_id.*peer_vpc_id.*auto_accept\s*=\s*true.*aws_route.*destination_cidr_block\s*=\s*"10\.20\.0\.0\/16".*vpc_peering_connection_id/s,
    );
    expect(tofu.prompt).toContain(
      "vpc_peering_connection_id = aws_vpc_peering_connection.link.id",
    );
    expect(tofu.correctChoice).toBe(
      "Add an aws_route in Ledger's selected table: destination 10.10.0.0/16, target aws_vpc_peering_connection.link.id",
    );
    expect(tofu.answer).toMatch(/connection.*does not.*install.*route.*both directions/is);

    expect(item("vpc-graph-pending-acceptance").correctChoice).toBe(
      "Connectivity layer: accept the pending peering request so pcx-orchard-ledger becomes active",
    );
    expect(item("vpc-graph-first-denying-filter").correctChoice).toBe(
      "Destination security group. Routing reaches Ledger, but db-sg has no inbound TCP 443 rule for the Orchard source",
    );
    expect(item("vpc-graph-stateless-return-path").correctChoice).toBe(
      "Ledger DB subnet NACL outbound rule for TCP destination port 49152; security groups are stateful, but NACLs need an explicit return-path allowance",
    );

    for (const id of ids().slice(4, 9)) {
      const candidate = item(id);
      expect(candidate.choices).toContain(candidate.correctChoice);
      expect(candidate.references?.length).toBeGreaterThan(0);
      expect(candidate.references?.every(({ label, url }) =>
        label.includes("accessed 2026-07-30")
        && (url.startsWith("https://docs.aws.amazon.com/")
          || url.includes("/hashicorp/terraform-provider-aws/blob/v6.57.1/")),
      )).toBe(true);
    }

    expect(tofu.references?.filter(({ url }) =>
      url.includes("/hashicorp/terraform-provider-aws/blob/v6.57.1/website/docs/r/"))).toHaveLength(2);
  });

  it("chooses connectivity scope, rejects peering traps, and preserves replay and scheduling", () => {
    expect(ids()).toEqual([
      "vpc-graph-portable-object-map",
      "vpc-graph-same-vpc-subnets",
      "vpc-graph-route-table-association",
      "vpc-graph-internet-vs-nat-gateway",
      "vpc-graph-minimum-peering-path",
      "vpc-graph-opentofu-reverse-route",
      "vpc-graph-pending-acceptance",
      "vpc-graph-first-denying-filter",
      "vpc-graph-stateless-return-path",
      "vpc-graph-choose-two-vpc-peering",
      "vpc-graph-choose-transit-gateway",
      "vpc-graph-choose-privatelink",
      "vpc-graph-non-transitive-peering",
      "vpc-graph-overlapping-cidr",
    ]);
    expect(new Set(ids()).size).toBe(14);

    expect(item("vpc-graph-choose-two-vpc-peering").correctChoice).toBe(
      "VPC peering: exactly two non-overlapping VPCs need broad bidirectional private IP routing, so a one-to-one connection is the simplest fit",
    );
    expect(item("vpc-graph-choose-transit-gateway").correctChoice).toBe(
      "Transit gateway: use the hub and explicit attachments/routes for many VPCs plus the on-premises network",
    );
    expect(item("vpc-graph-choose-privatelink").correctChoice).toBe(
      "PrivateLink endpoint pattern: expose only the TCP service to consumers without joining full routing domains; overlapping CIDRs can fit this pattern",
    );
    expect(item("vpc-graph-non-transitive-peering").correctChoice).toBe(
      "No. Peering is non-transitive; Analytics needs its own direct connection/path to Ledger or a hub design",
    );
    expect(item("vpc-graph-overlapping-cidr").correctChoice).toBe(
      "Peering cannot be created because the VPC CIDRs overlap; renumber or choose a service-scoped pattern such as PrivateLink when the requirement fits",
    );

    const corpus = ids().map((id) => `${item(id).prompt}\n${item(id).answer}`).join("\n");
    expect(corpus).toMatch(/same routed isolation domain.*peering.*not earned/is);
    expect(corpus).toMatch(/connection.*does not automatically install routes in both directions/is);
    expect(corpus).toMatch(/security groups.*stateful.*network ACLs.*do not remember connection state/is);
    expect(corpus).toMatch(/peering is non-transitive.*cannot.*overlapping/is);

    for (const id of ids().slice(9)) {
      const candidate = item(id);
      expect(candidate.choices).toContain(candidate.correctChoice);
      expect(candidate.references?.length).toBeGreaterThan(0);
      expect(candidate.references?.every(({ label, url }) =>
        label.includes("accessed 2026-07-30") && url.startsWith("https://docs.aws.amazon.com/"),
      )).toBe(true);
    }

    const now = new Date("2026-07-30T09:00:00Z");
    const mixedIds = new Set(Array.from({ length: contentBank.length * 2 }, (_, index) =>
      chooseStableId((index * 2) + 1, [], now)));
    expect(ids().every((id) => mixedIds.has(id))).toBe(true);

    const overlap = item("vpc-graph-overlapping-cidr");
    const store = new QuizStore(":memory:");
    try {
      store.recordAttempt({
        submissionId: "vpc-overlap-replay",
        stableId: overlap.id,
        seed: null,
        prompt: overlap.prompt,
        expectedAnswer: overlap.answer,
        response: overlap.correctChoice!,
        correct: true,
        rating: "good",
        reviewedAt: now.toISOString(),
      });
      expect(store.attemptBySubmission("vpc-overlap-replay")).toMatchObject({
        stableId: overlap.id,
        prompt: overlap.prompt,
        expectedAnswer: overlap.answer,
        response: overlap.correctChoice,
        correct: true,
      });
    } finally {
      store.close();
    }
  });
});
