import { describe, expect, it } from "vitest";
import { contentBank, generateOrderingQuestion, gradeAnswer, type OrderingItem } from "../src/content.js";
import { chooseStableId } from "../src/scheduler.js";

const olapIds = [
  "olap-normalization-spectrum",
  "olap-scenario-identification",
];

function item(id: string) {
  const found = contentBank.find((candidate) => candidate.id === id);
  expect(found, `missing ${id}`).toBeDefined();
  return found!;
}

describe("OLAP schema terminology", () => {
  it("ships exactly two deterministic recurring exercises with dated primary references", () => {
    expect(contentBank.filter(({ id }) => id.startsWith("olap-")).map(({ id }) => id)).toEqual(olapIds);
    for (const id of olapIds) {
      const current = item(id);
      expect(current.references?.length).toBeGreaterThan(0);
      expect(current.references?.every(({ label }) => label.includes("accessed 2026-08-27"))).toBe(true);
    }

    const scheduled = new Set(Array.from({ length: 2_000 }, (_, position) =>
      chooseStableId(position, [], new Date("2026-08-27T00:00:00.000Z"))));
    for (const id of olapIds) expect(scheduled).toContain(id);
  });

  it("orders OBT, star, and snowflake by increasing normalization and join depth", () => {
    const current = item("olap-normalization-spectrum") as OrderingItem;
    expect(current.kind).toBe("ordering");
    expect(current.prompt).toMatch(/OLAP.*increasing normalization and join depth/i);
    expect(current.orderedItems).toEqual(["one big table (OBT)", "star schema", "snowflake schema"]);
    expect(current.answer).toMatch(/OBT.*wide.*highly denormalized.*repeated descriptive attributes/i);
    expect(current.answer).toMatch(/star.*fact table.*direct.*dimensions.*snowflake.*normalizes.*additional related tables/i);

    const first = generateOrderingQuestion(current, 17);
    expect(generateOrderingQuestion(current, 17)).toEqual(first);
    expect(first.shuffledItems).not.toEqual(current.orderedItems);
    expect(gradeAnswer(first.grader, JSON.stringify(current.orderedItems), first.expectedAnswer)).toBe(true);
    expect(gradeAnswer(first.grader, JSON.stringify([...current.orderedItems].reverse()), first.expectedAnswer)).toBe(false);
  });

  it("identifies the three OLAP shapes without expanding into warehouse design", () => {
    const current = item("olap-scenario-identification");
    expect(current.prompt).toMatch(/SalesLine.*FactSales.*DimProduct.*DimSubcategory/i);
    expect(current.prompt).not.toMatch(/product\/category\/customer/i);
    expect(current.answer).toMatch(/A.*OBT.*B.*star.*C.*snowflake/i);
    expect(current.answer).toMatch(/common descriptive term.*not.*formal universal standard/i);
    expect(current.answer).toMatch(/fact table.*declared grain.*dimension keys.*measures.*directly.*denormalized dimensions/i);
    expect(current.answer).toMatch(/multiple stars|multiple fact tables/i);
    expect(current.answer).toMatch(/Snowflake product/i);
    expect(current.answer).toMatch(/no.*physical shape.*universal/i);
    expect(current.answer).not.toMatch(/surrogate key|slowly changing|ETL|semantic layer|OLTP/i);
  });
});
