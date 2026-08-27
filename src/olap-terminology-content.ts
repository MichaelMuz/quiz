import type { StaticItem } from "./content.js";

const accessedAt = "accessed 2026-08-27";
const dbtTerminologyReference = {
  label: `dbt Developer Hub, Tactical terminology, ${accessedAt}`,
  url: "https://docs.getdbt.com/best-practices/how-we-build-our-metrics/semantic-layer-6-terminology",
};
const microsoftStarReference = {
  label: `Microsoft Learn, Dimensional modeling in Fabric Data Warehouse, ${accessedAt}`,
  url: "https://learn.microsoft.com/en-us/fabric/data-warehouse/dimensional-modeling-overview",
};
const microsoftSnowflakeReference = {
  label: `Microsoft Learn, Star schema guidance and snowflake dimensions, ${accessedAt}`,
  url: "https://learn.microsoft.com/en-us/power-bi/guidance/star-schema",
};
const bigQueryDenormalizationReference = {
  label: `Google Cloud BigQuery, Use nested and repeated fields, ${accessedAt}`,
  url: "https://docs.cloud.google.com/bigquery/docs/best-practices-performance-nested",
};
export const olapTerminologyItems: StaticItem[] = [
  {
    id: "olap-normalization-spectrum",
    kind: "ordering",
    topic: "OLAP terminology",
    prompt: "In an OLAP context, put these schema shapes in order of increasing normalization and join depth.",
    orderedItems: [
      "one big table (OBT)",
      "star schema",
      "snowflake schema",
    ],
    answer: "OBT is one wide, highly denormalized analytical table with measures and repeated descriptive attributes. A star separates a fact table from directly joined, comparatively denormalized dimensions. A snowflake normalizes one or more dimensions into additional related tables, increasing join depth.",
    references: [dbtTerminologyReference, microsoftSnowflakeReference, bigQueryDenormalizationReference],
  },
  {
    id: "olap-scenario-identification",
    kind: "flashcard",
    topic: "OLAP terminology",
    prompt: "Identify each schema: A) SalesLine includes product, category, and customer attributes. B) FactSales joins directly to DimProduct and DimCustomer. C) FactSales joins DimProduct, which joins DimSubcategory, which joins DimCategory.",
    choices: [
      "A = OBT, B = star, C = snowflake",
      "A = star, B = snowflake, C = OBT",
      "A = snowflake, B = OBT, C = star",
      "All three are OBT because they support analytics",
    ],
    correctChoice: "A = OBT, B = star, C = snowflake",
    answer: "A is OBT, a common descriptive term for one wide analytical table, not a formal universal standard. B is a star: its fact table has a declared grain, dimension keys, and measures, and joins directly to comparatively denormalized dimensions; a warehouse can contain multiple stars or fact tables. C is a snowflake because Product is normalized through Subcategory and Category, adding join depth. Snowflake schema here is distinct from the Snowflake product. No single physical shape is universal for OLAP.",
    references: [dbtTerminologyReference, microsoftStarReference, microsoftSnowflakeReference, bigQueryDenormalizationReference],
  },
];
