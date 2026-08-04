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
    ]);
    expect(ids.length + generatedDefinitions.filter(({ id }) => id.startsWith("cidr-")).length).toBe(9);

    expect(item("cidr-ipv4-overlap-containment").correctChoice).toMatch(
      /10\.0\.12\.0\/22.*contained.*10\.0\.8\.0\/21.*10\.0\.16\.0\/20.*does not overlap/is,
    );
    expect(item("cidr-ipv4-longest-prefix-route").correctChoice).toMatch(
      /10\.20\.30\.0\/24.*target C.*longest matching prefix/is,
    );
    expect(item("cidr-ipv6-prefix-contrast").answer).toMatch(
      /128 bits.*\/64.*64 fixed.*2\^64.*no broadcast.*same prefix/is,
    );

    const reachableStatic = new Set(Array.from({ length: contentBank.length }, (_, index) =>
      chooseStableId((index * 2) + 1, [], new Date("2026-08-04T00:00:00.000Z"))));
    expect(ids.every((id) => reachableStatic.has(id))).toBe(true);

    for (const id of ids.slice(5)) {
      const candidate = item(id);
      expect(candidate.choices).toContain(candidate.correctChoice);
      expect(candidate.references?.length).toBeGreaterThan(0);
      expect(candidate.references?.every(({ label, url }) =>
        label.includes("accessed 2026-08-04") && url.startsWith("https://www.rfc-editor.org/"),
      )).toBe(true);
    }
  });
});
