import { describe, expect, it } from "vitest";
import {
  activeGeneratedDefinitions,
  contentBank,
  generateQuestion,
  generatedDefinitions,
  gradeAnswer,
} from "../src/content.js";
import { chooseStableId } from "../src/scheduler.js";

function item(id: string) {
  const found = contentBank.find((candidate) => candidate.id === id);
  expect(found, `missing ${id}`).toBeDefined();
  return found!;
}

describe("CIDR mechanics", () => {
  it("derives IPv4 prefix anchors, non-octet boundaries, address counts, and scoped host ranges", () => {
    const ids = contentBank.filter(({ id }) => id.startsWith("cidr-")).map(({ id }) => id);
    expect(ids.slice(0, 5)).toEqual([
      "cidr-ipv4-prefix-anchors",
      "cidr-ipv4-20-boundary",
      "cidr-ipv4-21-containing-range",
      "cidr-ipv4-26-address-count",
      "cidr-ipv4-30-traditional-hosts",
    ]);

    expect(item("cidr-ipv4-prefix-anchors").answer).toMatch(
      /prefix length.*fixed.*2\^\(32 - p\).*\/8.*255\.0\.0\.0.*\/16.*255\.255\.0\.0.*\/24.*255\.255\.255\.0.*\/32.*one address/is,
    );
    expect(item("cidr-ipv4-20-boundary").correctChoice).toMatch(
      /10\.42\.16\.0.*10\.42\.31\.255.*255\.255\.240\.0.*4096/is,
    );
    expect(item("cidr-ipv4-21-containing-range").correctChoice).toMatch(
      /172\.16\.8\.0.*172\.16\.15\.255.*255\.255\.248\.0.*2048/is,
    );
    expect(item("cidr-ipv4-26-address-count").correctChoice).toMatch(
      /192\.0\.2\.128.*192\.0\.2\.191.*64/is,
    );
    expect(item("cidr-ipv4-30-traditional-hosts").answer).toMatch(
      /198\.51\.100\.8.*\.9.*\.10.*\.11.*four total.*two traditional.*\/31.*provider/is,
    );

    const definition = generatedDefinitions.find(({ id }) => id === "cidr-ipv4-address-count");
    expect(definition).toMatchObject({ active: true, generator: "cidr-ipv4-address-count", grader: "integer" });
    expect(activeGeneratedDefinitions).toContainEqual(definition);
    const generated = generateQuestion(definition!.id, 2112);
    expect(generateQuestion(definition!.id, 2112)).toEqual(generated);
    const prefix = Number(generated.prompt.match(/\/(\d+)/)?.[1]);
    expect(generated.expectedAnswer).toBe(String(2 ** (32 - prefix)));
    expect(gradeAnswer(generated.grader, generated.expectedAnswer, generated.expectedAnswer)).toBe(true);
    expect(gradeAnswer(generated.grader, String(Number(generated.expectedAnswer) - 1), generated.expectedAnswer)).toBe(false);

    const reachableGenerated = new Set(Array.from({ length: activeGeneratedDefinitions.length }, (_, index) =>
      chooseStableId(index * 2, [], new Date("2026-08-04T00:00:00.000Z"))));
    expect(reachableGenerated.has(definition!.id)).toBe(true);

    for (const id of ids.slice(0, 5)) {
      const candidate = item(id);
      expect(candidate.choices).toContain(candidate.correctChoice);
      expect(candidate.references?.length).toBeGreaterThan(0);
      expect(candidate.references?.every(({ label, url }) =>
        label.includes("accessed 2026-08-04") && url.startsWith("https://www.rfc-editor.org/"),
      )).toBe(true);
    }
  });

  it("reasons about overlap, longest-prefix routing, and the IPv6 prefix contrast", () => {
    const ids = contentBank.filter(({ id }) => id.startsWith("cidr-")).map(({ id }) => id);
    expect(ids).toEqual([
      "cidr-ipv4-prefix-anchors",
      "cidr-ipv4-20-boundary",
      "cidr-ipv4-21-containing-range",
      "cidr-ipv4-26-address-count",
      "cidr-ipv4-30-traditional-hosts",
      "cidr-ipv4-overlap-containment",
      "cidr-ipv4-longest-prefix-route",
      "cidr-ipv6-prefix-contrast",
      "cidr-ipv6-structure-expansion",
      "cidr-ipv6-rfc5952-canonical",
      "cidr-ipv6-prefix-56",
      "cidr-ipv6-subnet-arithmetic",
      "cidr-ipv6-address-counts",
      "cidr-ipv6-overlap-containment",
      "cidr-ipv6-longest-prefix-route",
      "cidr-rfc1918-exact-ranges",
    ]);
    expect(ids.length + generatedDefinitions.filter(({ id }) => id.startsWith("cidr-")).length).toBe(17);

    expect(item("cidr-ipv4-overlap-containment").correctChoice).toMatch(
      /10\.0\.12\.0\/22.*contained.*10\.0\.8\.0\/21.*10\.0\.16\.0\/20.*does not overlap/is,
    );
    expect(item("cidr-ipv4-longest-prefix-route").correctChoice).toMatch(
      /10\.20\.30\.0\/24.*target C.*longest matching prefix/is,
    );
    expect(item("cidr-ipv6-prefix-contrast").answer).toMatch(
      /128 bits.*\/64.*64 fixed.*2\^64.*no broadcast.*same prefix/is,
    );
    expect(item("cidr-ipv6-structure-expansion").correctChoice).toBe(
      "2001:0db8:0000:0001:0000:0000:0000:00ab",
    );
    expect(item("cidr-ipv6-rfc5952-canonical").answer).toMatch(
      /leading zeroes.*longest run.*leftmost.*single zero.*lowercase/is,
    );
    expect(item("cidr-ipv6-prefix-56").correctChoice).toMatch(/2001:db8:12ab:cd00::\/56/);
    expect(item("cidr-ipv6-subnet-arithmetic").answer).toMatch(/\/48.*\/56.*2\^8.*\/64.*2\^8.*2\^16/is);
    expect(item("cidr-ipv6-address-counts").answer).toMatch(/\/48.*2\^80.*\/56.*2\^72.*\/64.*2\^64.*\/128.*one/is);
    expect(item("cidr-ipv6-overlap-containment").correctChoice).toMatch(/\/64.*contained.*\/56.*contained.*\/48/is);
    expect(item("cidr-ipv6-longest-prefix-route").correctChoice).toMatch(/\/64.*target D.*longest/is);
    const reachableStatic = new Set(Array.from({ length: contentBank.length }, (_, index) =>
      chooseStableId((index * 2) + 1, [], new Date("2026-08-04T00:00:00.000Z"))));
    expect(ids.every((id) => reachableStatic.has(id))).toBe(true);

    for (const id of ids.slice(5)) {
      const candidate = item(id);
      expect(candidate.choices).toContain(candidate.correctChoice);
      expect(candidate.references?.length).toBeGreaterThan(0);
      expect(candidate.references?.every(({ label, url }) =>
        /accessed 2026-08-0[48]/.test(label) && url.startsWith("https://www.rfc-editor.org/"),
      )).toBe(true);
    }
  });

  it("uses over-broad 172/8 and 192/8 distractors on the RFC 1918 recall card", () => {
    const rfc1918 = item("cidr-rfc1918-exact-ranges");
    expect(rfc1918.choices).toEqual(expect.arrayContaining([
      expect.stringMatching(/172\.0\.0\.0\/8/),
      expect.stringMatching(/192\.0\.0\.0\/8/),
    ]));
  });

  it("explains both routing scope and the trust boundary on the RFC 1918 recall card", () => {
    const answer = item("cidr-rfc1918-exact-ranges").answer;
    expect(answer).toMatch(/10\.0\.0\.0\/8.*172\.16\.0\.0\/12.*192\.168\.0\.0\/16/is);
    expect(answer).toMatch(/private-use.*not globally routed.*ordinary public destinations/is);
    expect(answer).toMatch(/private source.*not.*proof of trust/is);
  });
});
