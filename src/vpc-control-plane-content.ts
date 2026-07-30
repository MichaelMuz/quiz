import type { StaticItem } from "./content.js";

const vpcReference = {
  label: "AWS VPC concepts, accessed 2026-07-30",
  url: "https://docs.aws.amazon.com/vpc/latest/userguide/how-it-works.html",
};
const subnetReference = {
  label: "AWS subnet concepts, accessed 2026-07-30",
  url: "https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html",
};
const routeTableReference = {
  label: "AWS route table concepts, accessed 2026-07-30",
  url: "https://docs.aws.amazon.com/vpc/latest/userguide/RouteTables.html",
};
const securityGroupReference = {
  label: "AWS security groups, accessed 2026-07-30",
  url: "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html",
};
const networkAclReference = {
  label: "AWS network ACLs, accessed 2026-07-30",
  url: "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html",
};
const internetGatewayReference = {
  label: "AWS internet gateways, accessed 2026-07-30",
  url: "https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html",
};
const natGatewayReference = {
  label: "AWS NAT gateways, accessed 2026-07-30",
  url: "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html",
};
const peeringReference = {
  label: "AWS VPC peering concepts, accessed 2026-07-30",
  url: "https://docs.aws.amazon.com/vpc/latest/peering/what-is-vpc-peering.html",
};
const peeringRoutingReference = {
  label: "AWS VPC peering routes, accessed 2026-07-30",
  url: "https://docs.aws.amazon.com/vpc/latest/peering/vpc-peering-routing.html",
};
const peeringCreationReference = {
  label: "AWS VPC peering creation and acceptance, accessed 2026-07-30",
  url: "https://docs.aws.amazon.com/vpc/latest/peering/create-vpc-peering-connection.html",
};
const peeringLimitationsReference = {
  label: "AWS VPC peering limitations, accessed 2026-07-30",
  url: "https://docs.aws.amazon.com/vpc/latest/peering/invalid-peering-configurations.html",
};
const transitGatewayReference = {
  label: "AWS Transit Gateway concepts, accessed 2026-07-30",
  url: "https://docs.aws.amazon.com/vpc/latest/tgw/what-is-transit-gateway.html",
};
const privateLinkReference = {
  label: "AWS PrivateLink concepts, accessed 2026-07-30",
  url: "https://docs.aws.amazon.com/vpc/latest/privatelink/concepts.html",
};
const privateLinkArchitectureReference = {
  label: "AWS Prescriptive Guidance PrivateLink architecture, accessed 2026-07-30",
  url: "https://docs.aws.amazon.com/prescriptive-guidance/latest/integrate-third-party-services/architecture-1.html",
};
const providerPeeringReference = {
  label: "AWS provider v6.57.1 aws_vpc_peering_connection, accessed 2026-07-30",
  url: "https://github.com/hashicorp/terraform-provider-aws/blob/v6.57.1/website/docs/r/vpc_peering_connection.html.markdown",
};
const providerRouteReference = {
  label: "AWS provider v6.57.1 aws_route, accessed 2026-07-30",
  url: "https://github.com/hashicorp/terraform-provider-aws/blob/v6.57.1/website/docs/r/route.html.markdown",
};
const providerAssociationReference = {
  label: "AWS provider v6.57.1 aws_route_table_association, accessed 2026-07-30",
  url: "https://github.com/hashicorp/terraform-provider-aws/blob/v6.57.1/website/docs/r/route_table_association.html.markdown",
};

export const vpcControlPlaneItems: StaticItem[] = [
  {
    id: "vpc-graph-portable-object-map",
    kind: "command",
    topic: "AWS VPC graph",
    prompt: "Map portable routed-network roles before AWS product names. Which mapping is sound?",
    choices: [
      "boundary → VPC; AZ-scoped CIDR segment → subnet; next-hop policy → route table; stateful ENI/workload filter → security group; stateless subnet-boundary filter → network ACL",
      "boundary → subnet; AZ-scoped segment → VPC; next-hop policy → security group; stateful filter → network ACL; stateless filter → route table",
      "boundary → route table; segment → security group; next hop → VPC; every filter → network ACL",
      "VPC, subnet, route table, security group, and network ACL are interchangeable names for one packet filter",
    ],
    correctChoice: "boundary → VPC; AZ-scoped CIDR segment → subnet; next-hop policy → route table; stateful ENI/workload filter → security group; stateless subnet-boundary filter → network ACL",
    answer: "A VPC is a logically isolated routed-network boundary, not merely a VLAN. A subnet is one CIDR segment wholly inside one Availability Zone. Its selected route table maps destinations to targets. Security groups are stateful filters associated with resources such as network interfaces; network ACLs are stateless filters evaluated at the subnet boundary. These are useful analogies, not claims that AWS objects are identical to homelab devices.",
    references: [vpcReference, subnetReference, routeTableReference, securityGroupReference, networkAclReference],
  },
  {
    id: "vpc-graph-same-vpc-subnets",
    kind: "command",
    topic: "AWS VPC graph",
    prompt: "Orchard VPC is 10.10.0.0/16. Web-A is 10.10.1.0/24 in us-east-1a; App-B is 10.10.2.0/24 in us-east-1b. Their selected route tables retain the VPC local route, and filters allow TCP 8443. What VPC-connectivity object must be added?",
    choices: [
      "No peering. Both subnets are inside Orchard VPC, so its local route can carry the traffic when the selected routes and filters allow it",
      "A VPC peering connection, because every cross-subnet path crosses routing domains",
      "A transit gateway, because the subnets occupy different Availability Zones",
      "A PrivateLink endpoint, because local routes work only within one subnet",
    ],
    correctChoice: "No peering. Both subnets are inside Orchard VPC, so its local route can carry the traffic when the selected routes and filters allow it",
    answer: "Both subnets belong to the same routed isolation domain. The VPC route table's local route covers communication inside the VPC CIDR, including across its AZ-scoped subnets. Compatible security-group and network-ACL rules are still required, but peering connects different VPCs and is not earned here.",
    references: [subnetReference, routeTableReference],
  },
  {
    id: "vpc-graph-route-table-association",
    kind: "bash",
    topic: "AWS VPC graph",
    prompt: "Orchard Web-A subnet: 10.10.1.0/24\nSelected route table: rt-main\n\nrt-peer contains:\n10.20.0.0/16 → pcx-orchard-ledger\n\nNo association connects Web-A to rt-peer. What is the minimum missing edge?",
    choices: [
      "Associate Web-A with rt-peer; a route in rt-peer is irrelevant while Web-A selects rt-main",
      "Create another identical route in rt-peer; route count determines which table a subnet uses",
      "Attach rt-peer directly to the security group; filters select route tables",
      "Nothing; every subnet evaluates every route table in its VPC",
    ],
    correctChoice: "Associate Web-A with rt-peer; a route in rt-peer is irrelevant while Web-A selects rt-main",
    answer: "Route lookup uses the route table associated with the source subnet, or the VPC's main table when no explicit subnet association exists. Here the peering route exists in the wrong selected graph. An explicit `aws_route_table_association` with `subnet_id = aws_subnet.web_a.id` and `route_table_id = aws_route_table.peer.id` makes Web-A select rt-peer.",
    references: [routeTableReference, providerAssociationReference],
  },
  {
    id: "vpc-graph-internet-vs-nat-gateway",
    kind: "command",
    topic: "AWS VPC graph",
    prompt: "Which external-path comparison is accurate for IPv4?",
    choices: [
      "An internet gateway plus route and public-addressed resource can support internet-initiated inbound traffic; a public NAT gateway gives private-subnet resources outbound internet access without unsolicited inbound internet connections",
      "A NAT gateway accepts unsolicited internet connections to private addresses; an internet gateway is outbound-only",
      "An internet gateway replaces route tables and security controls; a NAT gateway replaces only network ACLs",
      "Both gateways are cross-VPC attachments that privately route arbitrary overlapping CIDRs",
    ],
    correctChoice: "An internet gateway plus route and public-addressed resource can support internet-initiated inbound traffic; a public NAT gateway gives private-subnet resources outbound internet access without unsolicited inbound internet connections",
    answer: "An internet gateway is a VPC attachment and route-table target for internet-routable traffic. For IPv4 internet reachability, the resource also needs a public IPv4 address and compatible routes and filters. A public NAT gateway sits in a public subnet and lets private-subnet instances initiate internet traffic through it, but those instances cannot receive unsolicited inbound internet connections. The two components have different directionality and ownership roles.",
    references: [internetGatewayReference, natGatewayReference, routeTableReference],
  },
  {
    id: "vpc-graph-minimum-peering-path",
    kind: "bash",
    topic: "AWS VPC graph",
    prompt: "Goal: TCP 443 from Orchard App-A to Ledger DB-B\n\nOrchard VPC: 10.10.0.0/16\nApp-A: 10.10.1.10\nLedger VPC: 10.20.0.0/16\nDB-B: 10.20.2.20\n\nThe VPCs are separate. Which minimum graph supports broad bidirectional private routing?",
    choices: [
      "active peering connection + Orchard route to 10.20.0.0/16 + Ledger route to 10.10.0.0/16 + permitting filters on the complete path",
      "active peering connection only; AWS installs both routes and bypasses every filter",
      "two routes only; their peering targets create and accept a connection implicitly",
      "one Orchard route plus one Ledger security group; response traffic discovers the reverse route automatically",
    ],
    correctChoice: "active peering connection + Orchard route to 10.20.0.0/16 + Ledger route to 10.10.0.0/16 + permitting filters on the complete path",
    answer: "Trace the path by layer: an accepted, active peering connection joins the two routing domains; the route table selected by each participating subnet needs a route to the peer CIDR through that connection; security groups and network ACLs must permit the request and any stateless return-path rules. Creating the connection alone neither installs every route nor permits every flow.",
    references: [peeringReference, peeringRoutingReference, securityGroupReference, networkAclReference],
  },
  {
    id: "vpc-graph-opentofu-reverse-route",
    kind: "bash",
    topic: "AWS VPC graph",
    prompt: "Same account and Region:\n\nresource \"aws_vpc_peering_connection\" \"link\" {\n  vpc_id      = aws_vpc.orchard.id\n  peer_vpc_id = aws_vpc.ledger.id\n  auto_accept = true\n}\n\nresource \"aws_route\" \"app_to_db\" {\n  route_table_id            = aws_route_table.app.id\n  destination_cidr_block    = \"10.20.0.0/16\"\n  vpc_peering_connection_id = aws_vpc_peering_connection.link.id\n}\n\nBroad bidirectional routing is required. What route edge is missing?",
    choices: [
      "Add an aws_route in Ledger's selected table: destination 10.10.0.0/16, target aws_vpc_peering_connection.link.id",
      "Add a second aws_vpc_peering_connection with vpc_id and peer_vpc_id reversed",
      "Set auto_accept = false so AWS propagates both routes during manual acceptance",
      "Attach Orchard's security group to Ledger's route table; that creates the reverse route",
    ],
    correctChoice: "Add an aws_route in Ledger's selected table: destination 10.10.0.0/16, target aws_vpc_peering_connection.link.id",
    answer: "The accepted connection is one connectivity edge, not route propagation. `aws_route.app_to_db` covers only Orchard's lookup for 10.20.0.0/16. Broad bidirectional communication also needs an `aws_route` in the route table selected by Ledger's participating subnet, with destination `10.10.0.0/16` and the same peering connection as target. The connection does not automatically install routes in both directions.",
    references: [providerPeeringReference, providerRouteReference, peeringRoutingReference],
  },
  {
    id: "vpc-graph-pending-acceptance",
    kind: "bash",
    topic: "AWS VPC graph",
    prompt: "Orchard → Ledger TCP 443 trace\n\nConnectivity: pcx-orchard-ledger = pending-acceptance\nOrchard selected route: 10.20.0.0/16 → pcx-orchard-ledger\nLedger selected route: 10.10.0.0/16 → pcx-orchard-ledger\nSecurity groups and NACLs: permit the path\n\nWhat is the first missing edge?",
    choices: [
      "Connectivity layer: accept the pending peering request so pcx-orchard-ledger becomes active",
      "Route layer: add a third route even though both selected tables already name the peer CIDR",
      "Filter layer: replace both stateful security groups with network ACLs",
      "No edge is missing; pending-acceptance carries traffic while approval is recorded",
    ],
    correctChoice: "Connectivity layer: accept the pending peering request so pcx-orchard-ledger becomes active",
    answer: "Stop at the first failed layer. The route and filter edges are present, but they target a peering request that is not active. The accepter must accept the request, or the same-account, same-Region OpenTofu resource can use documented automatic acceptance. Do not misdiagnose an inactive connection as a route or security-rule failure.",
    references: [peeringCreationReference, providerPeeringReference],
  },
  {
    id: "vpc-graph-first-denying-filter",
    kind: "bash",
    topic: "AWS VPC graph",
    prompt: "Orchard App-A 10.10.1.10 → Ledger DB-B 10.20.2.20:443\n\npcx-orchard-ledger: active\nselected routes: correct in both directions\napp-sg egress: TCP 443 to 10.20.0.0/16 allowed\ndb-sg ingress: no TCP 443 rule for Orchard\nsubnet NACLs: request and return allowed\n\nWhere does the trace first fail?",
    choices: [
      "Destination security group. Routing reaches Ledger, but db-sg has no inbound TCP 443 rule for the Orchard source",
      "Peering connection, because security groups are evaluated before connectivity",
      "Orchard route table, because a valid route is denied when the destination security group is closed",
      "Ledger NACL, because every security-group denial is implemented as a stateless NACL denial",
    ],
    correctChoice: "Destination security group. Routing reaches Ledger, but db-sg has no inbound TCP 443 rule for the Orchard source",
    answer: "The active connection and selected routes get the packet to Ledger's workload filter. `db-sg` then denies the new inbound TCP 443 flow because no rule authorizes the Orchard source. Security groups and NACLs are independent controls at different scopes; a security-group denial does not become a route failure or a NACL rule.",
    references: [peeringRoutingReference, securityGroupReference, networkAclReference],
  },
  {
    id: "vpc-graph-stateless-return-path",
    kind: "bash",
    topic: "AWS VPC graph",
    prompt: "Request tuple: 10.10.1.10:49152 → 10.20.2.20:443\nConnection and selected routes: valid both ways\nSecurity groups: outbound request and inbound 443 allowed\n\nOrchard NACL: outbound dst 443 allowed; inbound dst 49152 allowed\nLedger NACL: inbound dst 443 allowed; no outbound dst 49152 allow\n\nThe request reaches DB-B. What blocks its response first?",
    choices: [
      "Ledger DB subnet NACL outbound rule for TCP destination port 49152; security groups are stateful, but NACLs need an explicit return-path allowance",
      "Ledger DB security group outbound rule for port 49152; stateful filters always require mirrored response rules",
      "Orchard route to 10.20.0.0/16; the request route cannot carry response packets",
      "Nothing; any allowed request makes both security groups and all NACLs stateful for its response",
    ],
    correctChoice: "Ledger DB subnet NACL outbound rule for TCP destination port 49152; security groups are stateful, but NACLs need an explicit return-path allowance",
    answer: "The DB response has source port 443 and destination port 49152. Security groups remember the allowed flow, so their response traffic is automatically allowed. Network ACLs do not remember connection state. Ledger's subnet NACL must explicitly allow outbound TCP to destination port 49152, and Orchard's subnet NACL must allow that inbound return traffic. The stated Orchard rule is present; Ledger's outbound rule is the first missing one.",
    references: [securityGroupReference, networkAclReference],
  },
  {
    id: "vpc-graph-choose-two-vpc-peering",
    kind: "command",
    topic: "AWS VPC graph",
    prompt: "Orchard VPC 10.10.0.0/16 and Ledger VPC 10.20.0.0/16 are the only two routing domains. Workloads on both sides need broad bidirectional private IP access. The CIDRs do not overlap. Which connectivity scope is the default fit?",
    choices: [
      "VPC peering: exactly two non-overlapping VPCs need broad bidirectional private IP routing, so a one-to-one connection is the simplest fit",
      "Transit gateway: every pair of VPCs requires a hub even when only two domains exist",
      "PrivateLink: join both complete route domains through one consumer endpoint",
      "No connection: private routes cross isolated VPC boundaries by default",
    ],
    correctChoice: "VPC peering: exactly two non-overlapping VPCs need broad bidirectional private IP routing, so a one-to-one connection is the simplest fit",
    answer: "For exactly two suitable VPCs, preserve the useful default: peer them. Peering directly connects the pair without introducing a hub. The boundary matters: the CIDRs must not overlap, the relationship is one-to-one and non-transitive, selected route tables need peer routes, and security controls still apply.",
    references: [peeringReference, peeringRoutingReference, peeringLimitationsReference],
  },
  {
    id: "vpc-graph-choose-transit-gateway",
    kind: "command",
    topic: "AWS VPC graph",
    prompt: "A platform has 18 VPCs and two on-premises networks. The networks need centrally controlled hub routing instead of a growing mesh of one-to-one peering connections. Which AWS object fits the topology?",
    choices: [
      "Transit gateway: use the hub and explicit attachments/routes for many VPCs plus the on-premises network",
      "One VPC peering connection: peering automatically becomes transitive after the third attachment",
      "One PrivateLink endpoint: a service endpoint joins every attached routing domain",
      "One NAT gateway: outbound address translation is a transitive private routing hub",
    ],
    correctChoice: "Transit gateway: use the hub and explicit attachments/routes for many VPCs plus the on-premises network",
    answer: "AWS Transit Gateway is a network transit hub for interconnecting VPCs and on-premises networks. VPC, VPN, Direct Connect gateway, peering, and other supported attachments connect to the hub, while transit-gateway route tables control reachability. It earns its place here because many domains need hub routing; it is unnecessary ceremony for the simple two-VPC fixture.",
    references: [transitGatewayReference, peeringLimitationsReference],
  },
  {
    id: "vpc-graph-choose-privatelink",
    kind: "command",
    topic: "AWS VPC graph",
    prompt: "Consumers need only a provider's TCP metrics service behind a Network Load Balancer, not broad routing into the provider VPC. Consumer and provider both use 10.40.0.0/16. Which scope fits?",
    choices: [
      "PrivateLink endpoint pattern: expose only the TCP service to consumers without joining full routing domains; overlapping CIDRs can fit this pattern",
      "VPC peering: overlapping CIDRs are allowed when routes name only the service port",
      "Transit gateway: its route tables make overlapping destination prefixes unambiguous for every attachment",
      "Internet gateway: public routing is required for every private endpoint service",
    ],
    correctChoice: "PrivateLink endpoint pattern: expose only the TCP service to consumers without joining full routing domains; overlapping CIDRs can fit this pattern",
    answer: "This fixture needs consumer-to-provider access to one TCP service, not full routed-domain membership. The provider publishes an endpoint service backed by a Network Load Balancer; consumers create interface endpoints with private IP addresses in their own VPCs. AWS's documented pattern supports overlapping CIDRs and is unidirectional toward the service. It is not a substitute for broad bidirectional VPC routing.",
    references: [privateLinkReference, privateLinkArchitectureReference],
  },
  {
    id: "vpc-graph-non-transitive-peering",
    kind: "bash",
    topic: "AWS VPC graph",
    prompt: "Peering graph:\nOrchard 10.10.0.0/16 ↔ Ledger 10.20.0.0/16\nOrchard 10.10.0.0/16 ↔ Analytics 10.30.0.0/16\n\nThere is no Ledger ↔ Analytics peering connection. Can Analytics route through Orchard to Ledger?",
    choices: [
      "No. Peering is non-transitive; Analytics needs its own direct connection/path to Ledger or a hub design",
      "Yes. Any VPC with two peering connections automatically forwards between its peers",
      "Yes, but only if Orchard's security group references both peer CIDRs",
      "No, because a VPC can have only one peering connection total",
    ],
    correctChoice: "No. Peering is non-transitive; Analytics needs its own direct connection/path to Ledger or a hub design",
    answer: "VPC peering is non-transitive. Orchard cannot serve as a transit router between two VPCs that are each peered only with Orchard. Analytics and Ledger need their own direct connectivity and routes, or the topology should move to an earned hub design such as Transit Gateway.",
    references: [peeringLimitationsReference, transitGatewayReference],
  },
  {
    id: "vpc-graph-overlapping-cidr",
    kind: "bash",
    topic: "AWS VPC graph",
    prompt: "Orchard VPC: 10.10.0.0/16\nVendor VPC: 10.10.8.0/21\n\nThe vendor proposes VPC peering for broad private routing. What is the first topology problem?",
    choices: [
      "Peering cannot be created because the VPC CIDRs overlap; renumber or choose a service-scoped pattern such as PrivateLink when the requirement fits",
      "No problem; longest-prefix routing makes overlapping CIDRs valid for VPC peering",
      "Peering works after adding identical local routes to both route tables",
      "The CIDRs become valid if the peering connection is routed through a NAT gateway",
    ],
    correctChoice: "Peering cannot be created because the VPC CIDRs overlap; renumber or choose a service-scoped pattern such as PrivateLink when the requirement fits",
    answer: "AWS cannot create a VPC peering connection when any IPv4 or IPv6 CIDR blocks of the two VPCs match or overlap. Renumber when broad routed-domain connectivity is truly required. If consumers need only a supported private service, the PrivateLink endpoint pattern can avoid joining the overlapping route domains; that choice changes the connectivity scope rather than making peering accept the overlap.",
    references: [peeringLimitationsReference, privateLinkArchitectureReference],
  },
];
