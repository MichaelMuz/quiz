import { describe, expect, it } from "vitest";
import { contentBank } from "../src/content.js";
import { chooseStableId } from "../src/scheduler.js";

const olapIds = [
  "olap-obt-definition",
  "olap-star-definition",
  "olap-snowflake-definition",
  "olap-normalization-spectrum",
  "olap-grain-before-shape",
  "olap-scenario-identification",
];

function item(id: string) {
  const found = contentBank.find((candidate) => candidate.id === id);
  expect(found, `missing ${id}`).toBeDefined();
  return found!;
}

describe("OLAP schema terminology", () => {
  it("ships a bounded six-card cohort with dated primary references", () => {
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

  it("defines OBT as a wide denormalized analytical output rather than a database product", () => {
    const current = item("olap-obt-definition");
    expect(current.prompt).toMatch(/OBT|one big table/i);
    expect(current.answer).toMatch(/one wide.*denormalized table.*facts.*dimension attributes.*joins/i);
    expect(current.answer).toMatch(/duplication|repeated/i);
  });

  it("defines a star around fact grain and denormalized dimensions", () => {
    const current = item("olap-star-definition");
    expect(current.answer).toMatch(/fact table.*measurements.*dimension keys/i);
    expect(current.answer).toMatch(/dimension tables.*filtering.*grouping/i);
    expect(current.answer).toMatch(/consistent grain/i);
  });

  it("defines snowflaking as normalizing a dimension hierarchy", () => {
    const current = item("olap-snowflake-definition");
    expect(current.answer).toMatch(/normalized tables.*single business entity/i);
    expect(current.answer).toMatch(/Product.*Subcategory.*Category/i);
    expect(current.answer).toMatch(/more joins|relationship chains/i);
  });

  it("orders the three shapes by denormalization without treating one as universally best", () => {
    const current = item("olap-normalization-spectrum");
    expect(current.answer).toMatch(/OBT.*most denormalized.*star.*fact.*dimensions.*snowflake.*normalizes/i);
    expect(current.answer).toMatch(/workload|engine|usability/i);
    expect(current.answer).not.toMatch(/always best/i);
  });

  it("keeps grain separate from physical schema shape", () => {
    const current = item("olap-grain-before-shape");
    expect(current.prompt).toMatch(/one row represents/i);
    expect(current.answer).toMatch(/grain.*before.*OBT|OBT.*grain/i);
    expect(current.answer).toMatch(/fanout|double-count/i);
  });

  it("identifies concrete OBT, star, and snowflake fixtures", () => {
    const current = item("olap-scenario-identification");
    expect(current.prompt).toMatch(/SalesLine.*FactSales.*DimProduct.*DimSubcategory/i);
    expect(current.answer).toMatch(/A.*OBT.*B.*star.*C.*snowflake/i);
  });
});
