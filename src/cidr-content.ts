import type { StaticItem } from "./content.js";

const cidrReference = {
  label: "RFC 4632 CIDR Address Strategy, accessed 2026-08-04",
  url: "https://www.rfc-editor.org/rfc/rfc4632.html",
};
const subnetTableReference = {
  label: "RFC 1878 Variable Length Subnet Table, accessed 2026-08-04",
  url: "https://www.rfc-editor.org/rfc/rfc1878.html",
};
const pointToPointReference = {
  label: "RFC 3021 31-Bit Prefixes on IPv4 Point-to-Point Links, accessed 2026-08-04",
  url: "https://www.rfc-editor.org/rfc/rfc3021.html",
};
const ipv6Reference = {
  label: "RFC 4291 IPv6 Addressing Architecture, accessed 2026-08-04",
  url: "https://www.rfc-editor.org/rfc/rfc4291.html",
};

export const cidrItems: StaticItem[] = [
  {
    id: "cidr-ipv4-prefix-anchors",
    kind: "command",
    topic: "CIDR",
    prompt: "Which IPv4 prefix-to-mask anchors are correct?",
    choices: [
      "/8 = 255.0.0.0; /16 = 255.255.0.0; /24 = 255.255.255.0; /32 identifies one address",
      "/8 = 0.0.0.255; /16 = 0.0.255.255; /24 = 0.255.255.255; /32 identifies every address",
      "/8 = 255.255.255.0; /16 = 255.255.0.0; /24 = 255.0.0.0; /32 has 32 host bits",
      "Each slash value counts decimal octets, so only /8, /16, /24, and /32 are valid",
    ],
    correctChoice: "/8 = 255.0.0.0; /16 = 255.255.0.0; /24 = 255.255.255.0; /32 identifies one address",
    answer: "An IPv4 prefix length `p` marks the first `p` of 32 bits as fixed prefix bits. The remaining `32 - p` bits vary, so an aligned block contains 2^(32 - p) addresses. Useful mask anchors are /8 = 255.0.0.0, /16 = 255.255.0.0, /24 = 255.255.255.0, and /32 = 255.255.255.255, which identifies one address. Non-octet prefixes are equally valid.",
    references: [cidrReference, subnetTableReference],
  },
  {
    id: "cidr-ipv4-20-boundary",
    kind: "command",
    topic: "CIDR",
    prompt: "An interface is 10.42.19.7/20. What is the containing block?",
    choices: [
      "10.42.16.0 through 10.42.31.255; mask 255.255.240.0; 4096 total addresses",
      "10.42.19.0 through 10.42.19.255; mask 255.255.255.0; 256 total addresses",
      "10.42.0.0 through 10.42.15.255; mask 255.255.240.0; 4096 total addresses",
      "10.42.16.0 through 10.42.20.255; mask 255.255.252.0; 1280 total addresses",
    ],
    correctChoice: "10.42.16.0 through 10.42.31.255; mask 255.255.240.0; 4096 total addresses",
    answer: "/20 leaves 12 variable bits, so the block has 4096 addresses. The third-octet increment is 16 because the mask is 255.255.240.0. Third octet 19 lies in the aligned 16-31 bucket, giving network 10.42.16.0 and final address 10.42.31.255.",
    references: [cidrReference, subnetTableReference],
  },
  {
    id: "cidr-ipv4-21-containing-range",
    kind: "command",
    topic: "CIDR",
    prompt: "An interface is 172.16.14.200/21. What is the containing block?",
    choices: [
      "172.16.8.0 through 172.16.15.255; mask 255.255.248.0; 2048 total addresses",
      "172.16.14.0 through 172.16.21.255; mask 255.255.248.0; 2048 total addresses",
      "172.16.0.0 through 172.16.7.255; mask 255.255.248.0; 2048 total addresses",
      "172.16.12.0 through 172.16.15.255; mask 255.255.252.0; 1024 total addresses",
    ],
    correctChoice: "172.16.8.0 through 172.16.15.255; mask 255.255.248.0; 2048 total addresses",
    answer: "/21 leaves 11 variable bits, so the block has 2048 addresses. Its 255.255.248.0 mask makes third-octet boundaries advance by 8. Third octet 14 belongs to the aligned 8-15 bucket, not a range beginning at 14.",
    references: [cidrReference, subnetTableReference],
  },
  {
    id: "cidr-ipv4-26-address-count",
    kind: "command",
    topic: "CIDR",
    prompt: "An interface is 192.0.2.130/26. Which range and total address count are correct?",
    choices: [
      "192.0.2.128 through 192.0.2.191; 64 total addresses",
      "192.0.2.130 through 192.0.2.193; 64 total addresses",
      "192.0.2.0 through 192.0.2.255; 256 total addresses",
      "192.0.2.128 through 192.0.2.255; 128 total addresses",
    ],
    correctChoice: "192.0.2.128 through 192.0.2.191; 64 total addresses",
    answer: "/26 leaves 6 variable bits, so the block contains 2^6 = 64 addresses. A 255.255.255.192 mask advances in last-octet blocks of 64: 0, 64, 128, and 192. Address 130 is therefore inside 128-191.",
    references: [cidrReference, subnetTableReference],
  },
  {
    id: "cidr-ipv4-30-traditional-hosts",
    kind: "command",
    topic: "CIDR",
    prompt: "Under traditional IPv4 subnet semantics, what does 198.51.100.9/30 imply?",
    choices: [
      "Network .8, host addresses .9 and .10, broadcast .11",
      "Network .9, host addresses .10 and .11, broadcast .12",
      "Network .8, four host addresses .8 through .11, no broadcast",
      "Network .0, host addresses .1 through .30, broadcast .31",
    ],
    correctChoice: "Network .8, host addresses .9 and .10, broadcast .11",
    answer: "The aligned block is 198.51.100.8 through 198.51.100.11: .8 is the traditional network address, .9 and .10 are the two traditional usable host addresses, and .11 is broadcast. That is four total addresses and two traditional usable hosts. Scope matters: RFC 3021 defines /31 behavior for point-to-point links, and cloud providers can reserve additional addresses under provider-specific subnet rules.",
    references: [subnetTableReference, pointToPointReference],
  },
  {
    id: "cidr-ipv4-overlap-containment",
    kind: "command",
    topic: "CIDR",
    prompt: "A = 10.0.8.0/21\nB = 10.0.12.0/22\nC = 10.0.16.0/20\n\nWhich relationship is correct?",
    choices: [
      "10.0.12.0/22 is contained in 10.0.8.0/21; 10.0.16.0/20 starts at the next boundary and does not overlap",
      "All three overlap because their first two octets are 10.0",
      "10.0.8.0/21 is contained in 10.0.12.0/22; 10.0.16.0/20 overlaps both",
      "None overlap because different prefix lengths always describe disjoint blocks",
    ],
    correctChoice: "10.0.12.0/22 is contained in 10.0.8.0/21; 10.0.16.0/20 starts at the next boundary and does not overlap",
    answer: "Turn each prefix into an aligned inclusive range. A spans 10.0.8.0-10.0.15.255. B spans 10.0.12.0-10.0.15.255, so every B address is inside A: B is contained by A and therefore overlaps it. C begins at 10.0.16.0, immediately after A ends, so adjacency is not overlap. Shared leading text is not enough; compare fixed prefix bits or range boundaries.",
    references: [cidrReference, subnetTableReference],
  },
  {
    id: "cidr-ipv4-longest-prefix-route",
    kind: "command",
    topic: "CIDR",
    prompt: "Routes:\n0.0.0.0/0 → target D\n10.0.0.0/8 → target A\n10.20.0.0/16 → target B\n10.20.30.0/24 → target C\n\nWhere does 10.20.30.44 go?",
    choices: [
      "10.20.30.0/24 → target C, because it is the longest matching prefix",
      "0.0.0.0/0 → target D, because the default route is listed first",
      "10.0.0.0/8 → target A, because it contains the most addresses",
      "All matching routes receive a copy because CIDR has no precedence rule",
    ],
    correctChoice: "10.20.30.0/24 → target C, because it is the longest matching prefix",
    answer: "The destination matches /0, /8, /16, and /24. Forwarding chooses the longest matching prefix, meaning the route with the most destination bits fixed, so /24 target C wins. 'Longest' means the largest prefix length and most specific range, not the route that covers the most addresses or appears first.",
    references: [cidrReference],
  },
  {
    id: "cidr-ipv6-prefix-contrast",
    kind: "command",
    topic: "CIDR",
    prompt: "What does 2001:db8:42:7::/64 say at the useful IPv6-mechanics level?",
    choices: [
      "The first 64 of 128 bits are the prefix and 64 bits vary; the block has 2^64 addresses and IPv6 has no broadcast address",
      "The first 64 decimal digits are fixed and the remaining 64 addresses are usable hosts",
      "It uses the IPv4 mask 255.255.255.0 repeated twice and reserves one broadcast address",
      "The /64 selects TCP port 64 rather than an address prefix",
    ],
    correctChoice: "The first 64 of 128 bits are the prefix and 64 bits vary; the block has 2^64 addresses and IPv6 has no broadcast address",
    answer: "IPv6 addresses are 128 bits. A /64 has 64 fixed high-order prefix bits and 64 variable bits, for 2^64 addresses in that prefix. IPv6 has no broadcast address; multicast serves different delivery needs, so do not subtract IPv4-style network and broadcast endpoints. The same prefix-length idea carries over from IPv4, but the address width, notation, and endpoint conventions differ.",
    references: [ipv6Reference],
  },
];
