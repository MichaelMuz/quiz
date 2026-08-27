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
    id: "olap-obt-definition",
    kind: "flashcard",
    topic: "OLAP terminology",
    prompt: "What does OBT, or one big table, mean in analytical data modeling?",
    choices: [
      "One wide denormalized table containing facts and flattened dimension attributes",
      "A database product that stores exactly one physical table",
      "A fact table surrounded by reusable dimension tables",
      "A normalized hierarchy of dimension tables",
    ],
    correctChoice: "One wide denormalized table containing facts and flattened dimension attributes",
    answer: "OBT is one wide, denormalized table that places facts and dimension attributes together so consumers need fewer or no joins. Dimension values are repeated across fact rows, trading duplication and a tightly coupled output shape for simple consumption.",
    references: [dbtTerminologyReference, bigQueryDenormalizationReference],
  },
  {
    id: "olap-star-definition",
    kind: "flashcard",
    topic: "OLAP terminology",
    prompt: "What makes an analytical schema a star schema?",
    choices: [
      "A central fact table links directly to dimension tables",
      "Every dimension attribute is flattened into each fact row",
      "Each dimension must be normalized through several child tables",
      "All measures live in dimension tables",
    ],
    correctChoice: "A central fact table links directly to dimension tables",
    answer: "A star has a central fact table containing measurements and dimension keys. Dimension tables describe entities used for filtering and grouping. Each fact table keeps a consistent grain, the declared meaning of one fact row, while dimensions are typically denormalized enough to connect directly to the fact.",
    references: [microsoftStarReference, microsoftSnowflakeReference],
  },
  {
    id: "olap-snowflake-definition",
    kind: "flashcard",
    topic: "OLAP terminology",
    prompt: "What turns a star dimension into a snowflake dimension?",
    choices: [
      "The dimension hierarchy is normalized into related tables",
      "All dimension attributes are copied into the fact table",
      "The fact table is split by calendar month",
      "Measures are pre-aggregated into one row",
    ],
    correctChoice: "The dimension hierarchy is normalized into related tables",
    answer: "A snowflake dimension uses normalized tables for a single business entity. For example, Product can reference Subcategory, which references Category. That removes some repeated dimension attributes but adds joins and longer relationship chains compared with a denormalized star dimension.",
    references: [microsoftSnowflakeReference],
  },
  {
    id: "olap-normalization-spectrum",
    kind: "flashcard",
    topic: "OLAP terminology",
    prompt: "Place OBT, star, and snowflake on a denormalization spectrum. Is one shape universally best?",
    choices: [
      "OBT is most denormalized; star separates fact and dimensions; snowflake normalizes dimensions further",
      "Snowflake is most denormalized; OBT is most normalized",
      "Star and OBT are synonyms; snowflake differs only by naming",
      "The three names describe query languages, not schema shapes",
    ],
    correctChoice: "OBT is most denormalized; star separates fact and dimensions; snowflake normalizes dimensions further",
    answer: "OBT is the most denormalized: facts and dimension attributes share one wide output. A star separates a fact table from directly attached dimensions. A snowflake normalizes dimension hierarchies into more tables. None is universally best; workload, engine behavior, reuse, governance, and consumer usability determine the useful trade-off.",
    references: [dbtTerminologyReference, microsoftSnowflakeReference, bigQueryDenormalizationReference],
  },
  {
    id: "olap-grain-before-shape",
    kind: "flashcard",
    topic: "OLAP terminology",
    prompt: "Before flattening data into an OBT, why must you state what one row represents?",
    choices: [
      "The row grain determines which joins preserve cardinality and which multiply facts",
      "The storage engine infers row grain from column names",
      "An OBT cannot contain measures at any grain",
      "Flattening automatically makes all relationships one-to-one",
    ],
    correctChoice: "The row grain determines which joins preserve cardinality and which multiply facts",
    answer: "Declare the grain before choosing an OBT or star shape. Joining two one-to-many sets at the wrong boundary can fan out fact rows and double-count measures. Denormalization removes joins from consumer queries, but it does not remove cardinality or grain from the model.",
    references: [microsoftStarReference, bigQueryDenormalizationReference],
  },
  {
    id: "olap-scenario-identification",
    kind: "flashcard",
    topic: "OLAP terminology",
    prompt: "Identify each schema: A) SalesLine includes product/category/customer attributes. B) FactSales joins directly to DimProduct and DimCustomer. C) FactSales joins DimProduct, which joins DimSubcategory, which joins DimCategory.",
    choices: [
      "A = OBT, B = star, C = snowflake",
      "A = star, B = snowflake, C = OBT",
      "A = snowflake, B = OBT, C = star",
      "All three are OBT because they support analytics",
    ],
    correctChoice: "A = OBT, B = star, C = snowflake",
    answer: "A is OBT because facts and descriptive attributes share one wide SalesLine table. B is a star because the fact table links directly to dimensions. C is a snowflake because the Product dimension is normalized through Subcategory and Category.",
    references: [dbtTerminologyReference, microsoftStarReference, microsoftSnowflakeReference],
  },
];
