import type { Reference, StaticItem } from "./content.js";

const sqlStandardReference: Reference = {
  label: "ISO/IEC 9075-2:2023 SQL/Foundation catalogue, accessed 2026-08-05",
  url: "https://www.iso.org/standard/76584.html",
};
const tableExpressionsReference: Reference = {
  label: "PostgreSQL 18 table expressions, accessed 2026-08-05",
  url: "https://www.postgresql.org/docs/current/queries-table-expressions.html",
};
const selectReference: Reference = {
  label: "PostgreSQL 18 SELECT, accessed 2026-08-05",
  url: "https://www.postgresql.org/docs/current/sql-select.html",
};
const subqueryReference: Reference = {
  label: "PostgreSQL 18 subquery expressions, accessed 2026-08-05",
  url: "https://www.postgresql.org/docs/current/functions-subquery.html",
};
const conditionalReference: Reference = {
  label: "PostgreSQL 18 conditional expressions, accessed 2026-08-05",
  url: "https://www.postgresql.org/docs/current/functions-conditional.html",
};
const cteReference: Reference = {
  label: "PostgreSQL 18 WITH queries, accessed 2026-08-05",
  url: "https://www.postgresql.org/docs/current/queries-with.html",
};
const windowReference: Reference = {
  label: "PostgreSQL 18 window functions, accessed 2026-08-05",
  url: "https://www.postgresql.org/docs/current/functions-window.html",
};
const windowExpressionReference: Reference = {
  label: "PostgreSQL 18 window-function expressions, accessed 2026-08-05",
  url: "https://www.postgresql.org/docs/current/sql-expressions.html#SYNTAX-WINDOW-FUNCTIONS",
};
const selectListReference: Reference = {
  label: "PostgreSQL 18 select lists and DISTINCT, accessed 2026-08-05",
  url: "https://www.postgresql.org/docs/current/queries-select-lists.html",
};

const basicPractice = {
  label: "Practice this at a computer: PostgreSQL Exercises basics",
  url: "https://pgexercises.com/questions/basic/",
};
const joinPractice = {
  label: "Practice this at a computer: PostgreSQL Exercises joins and subqueries",
  url: "https://pgexercises.com/questions/joins/",
};
const correlatedPractice = {
  label: "Practice this at a computer: PostgreSQL Exercises correlated subquery",
  url: "https://pgexercises.com/questions/joins/sub.html",
};
const aggregatePractice = {
  label: "Practice this at a computer: PostgreSQL Exercises aggregates and windows",
  url: "https://pgexercises.com/questions/aggregates/",
};
const havingPractice = {
  label: "Practice this at a computer: PostgreSQL Exercises HAVING",
  url: "https://pgexercises.com/questions/aggregates/fachours1a.html",
};
const revenuePractice = {
  label: "Practice this at a computer: PostgreSQL Exercises conditional revenue",
  url: "https://pgexercises.com/questions/aggregates/facrev.html",
};
const rankingPractice = {
  label: "Practice this at a computer: PostgreSQL Exercises ranking",
  url: "https://pgexercises.com/questions/aggregates/facrev3.html",
};
const rollingPractice = {
  label: "Practice this at a computer: PostgreSQL Exercises rolling window",
  url: "https://pgexercises.com/questions/aggregates/rollingavg.html",
};

const portable = [sqlStandardReference, tableExpressionsReference];

export type SqlDesktopProgression = {
  primary: Reference;
  aggregatesAndWindows: Reference;
  transfer: Reference;
  advanced: Reference;
  exitCriterion: string;
};

export const sqlDesktopProgression: SqlDesktopProgression = {
  primary: {
    label: "PostgreSQL Exercises, start on the coherent dataset",
    url: "https://pgexercises.com/questions/basic/",
  },
  aggregatesAndWindows: {
    label: "PostgreSQL Exercises, aggregates and window functions",
    url: "https://pgexercises.com/questions/aggregates/",
  },
  transfer: {
    label: "LeetCode SQL 50, varied-schema transfer",
    url: "https://leetcode.com/studyplan/top-sql-50/",
  },
  advanced: {
    label: "Advanced SQL 50, optional after SQL 50",
    url: "https://leetcode.com/studyplan/premium-sql-50/",
  },
  exitCriterion: "Complete PostgreSQL Exercises through aggregates and windows while writing most medium queries without hints, then use SQL 50 for varied-schema transfer. Add Advanced SQL 50 or DataLemur only if harder breadth is still useful.",
};

export const sqlSupportItems: StaticItem[] = [
  {
    id: "sql-support-logical-processing-window-filter",
    kind: "sql",
    topic: "SQL support",
    dialect: "Portable SQL",
    prompt: "scores(player, points) rows: ('Ada', 20), ('Ada', 10), ('Ben', 15).\n\nYou need the highest-scoring row per player using ROW_NUMBER(). Where must the rn = 1 filter go?",
    choices: [
      "Compute ROW_NUMBER() in a subquery, then filter rn = 1 in the outer query",
      "Put rn = 1 in the same query's WHERE clause",
      "Put rn = 1 in GROUP BY",
      "Replace PARTITION BY with HAVING rn = 1",
    ],
    correctChoice: "Compute ROW_NUMBER() in a subquery, then filter rn = 1 in the outer query",
    answer: "Window functions are evaluated after FROM, WHERE, grouping, and HAVING. The same query's WHERE clause therefore cannot filter its window result or its select-list alias. Compute ROW_NUMBER() OVER (PARTITION BY player ORDER BY points DESC) in a subquery or CTE, then apply WHERE rn = 1 outside. The expected rows are ('Ada', 20) and ('Ben', 15).",
    references: [sqlStandardReference, tableExpressionsReference, windowReference],
    desktopPractice: rankingPractice,
  },
  {
    id: "sql-support-null-not-in",
    kind: "sql",
    topic: "SQL support",
    dialect: "Portable SQL",
    prompt: "employees(id) rows: 1, 2, 3. training(employee_id) has one row: NULL.\n\nWhat does this return?\nSELECT id FROM employees WHERE id NOT IN (SELECT employee_id FROM training);",
    choices: ["No rows", "1, 2, 3", "Only NULL", "A syntax error"],
    correctChoice: "No rows",
    answer: "It returns no rows. Each comparison against the NULL makes the NOT IN result UNKNOWN rather than TRUE, so WHERE rejects it. For the anti-match requirement, use NOT EXISTS with a correlated equality: WHERE NOT EXISTS (SELECT 1 FROM training t WHERE t.employee_id = employees.id). That returns 1, 2, and 3 for this fixture.",
    references: [sqlStandardReference, subqueryReference],
    desktopPractice: correlatedPractice,
  },
  {
    id: "sql-support-count-null",
    kind: "sql",
    topic: "SQL support",
    dialect: "Portable SQL",
    prompt: "employees(id, note) rows: (1, NULL), (2, 'lead'), (3, NULL).\n\nWhat does SELECT COUNT(*) AS rows, COUNT(note) AS notes FROM employees return?",
    choices: ["rows = 3, notes = 1", "rows = 1, notes = 3", "rows = 3, notes = 3", "rows = 1, notes = 1"],
    correctChoice: "rows = 3, notes = 1",
    answer: "COUNT(*) counts input rows, so rows = 3. COUNT(note) counts only rows whose note expression is non-NULL, so notes = 1. This distinction matters after outer joins: COUNT(*) can count the preserved left row while COUNT(right_table.id) counts only actual right-side matches.",
    references: [sqlStandardReference, selectReference],
    desktopPractice: aggregatePractice,
  },
  {
    id: "sql-support-join-multiplication",
    kind: "sql",
    topic: "SQL support",
    dialect: "Portable SQL",
    prompt: "Customer 1 has two orders: 10 and 11. Each order has three tag rows.\n\nHow many rows does this produce for customer 1?\nSELECT * FROM orders o JOIN order_tags t ON t.order_id = o.id WHERE o.customer_id = 1;",
    choices: ["6 rows", "3 rows", "2 rows", "1 row"],
    correctChoice: "6 rows",
    answer: "It produces 2 × 3 = 6 joined rows, one row for each matching order-tag pair. A join does not preserve an entity count automatically. If the result requirement is one row per customer, aggregate at the intended grain, use EXISTS for a pure membership test, or join pre-aggregated inputs instead of hiding multiplication with an unexplained DISTINCT.",
    references: portable,
    desktopPractice: joinPractice,
  },
  {
    id: "sql-support-left-join-filter",
    kind: "sql",
    topic: "SQL support",
    dialect: "Portable SQL",
    prompt: "customers(id): 1, 2. orders(customer_id, status): (1, 'paid'), (2, 'pending').\n\nWhich shape returns both customers while counting only paid orders?",
    choices: [
      "LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid'",
      "LEFT JOIN orders o ON o.customer_id = c.id WHERE o.status = 'paid'",
      "INNER JOIN orders o ON o.status = 'paid'",
      "CROSS JOIN orders o WHERE o.status = 'paid'",
    ],
    correctChoice: "LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid'",
    answer: "Put the right-side status predicate in ON. The LEFT JOIN then preserves customer 2 with NULL order columns, while COUNT(o.id) yields zero. Moving o.status = 'paid' to WHERE removes that NULL-extended row because the predicate is not TRUE, collapsing this requirement toward an inner join.",
    references: portable,
    desktopPractice: joinPractice,
  },
  {
    id: "sql-support-group-having",
    kind: "sql",
    topic: "SQL support",
    dialect: "Portable SQL",
    prompt: "orders(customer_id) rows: 1, 1, 2. Complete the grouped query so it returns only customers with at least two orders.\n\nSELECT customer_id FROM orders GROUP BY customer_id ____;",
    choices: ["HAVING COUNT(*) >= 2", "WHERE COUNT(*) >= 2", "HAVING customer_id >= 2", "ORDER BY COUNT(*) >= 2"],
    correctChoice: "HAVING COUNT(*) >= 2",
    answer: "Use HAVING COUNT(*) >= 2. WHERE filters input rows before grouping and cannot test the group's aggregate result. HAVING filters the formed groups, so the expected result is customer_id 1. Put ordinary row predicates in WHERE when they should change which rows enter each aggregate.",
    references: portable,
    desktopPractice: havingPractice,
  },
  {
    id: "sql-support-conditional-aggregation",
    kind: "sql",
    topic: "SQL support",
    dialect: "Portable SQL",
    prompt: "orders(status, amount) rows: ('paid', 10), ('paid', 20), ('pending', 30). Which expression returns paid_total = 30 without removing pending rows from other aggregates in the same query?",
    choices: [
      "SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END)",
      "SUM(amount) WHERE status = 'paid'",
      "CASE WHEN status = 'paid' THEN SUM(amount) END",
      "COUNT(CASE status = 'paid' THEN amount END)",
    ],
    correctChoice: "SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END)",
    answer: "The CASE maps paid rows to their amount and every other row to zero; SUM then returns 30. Because the condition lives inside this aggregate, other aggregates can still see all three input rows. PostgreSQL also supports aggregate FILTER syntax, but CASE inside SUM is the portable construction practiced here.",
    references: [sqlStandardReference, conditionalReference, selectReference],
    desktopPractice: revenuePractice,
  },
  {
    id: "sql-support-exists-semi-join",
    kind: "sql",
    topic: "SQL support",
    dialect: "Portable SQL",
    prompt: "Customer 1 has two paid orders; customer 2 has none. You need each customer with at least one paid order exactly once. Which operation matches that result requirement directly?",
    choices: [
      "WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.status = 'paid')",
      "JOIN orders o ON o.customer_id = c.id AND o.status = 'paid'",
      "CROSS JOIN orders o",
      "WHERE c.id IN (NULL)",
    ],
    correctChoice: "WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.status = 'paid')",
    answer: "EXISTS is a membership test: it asks whether at least one matching row exists and therefore keeps one output row for customer 1. A plain join emits one row per matching pair, so two paid orders duplicate the customer unless later work changes the grain. Choose the operation that matches the result requirement instead of adding DISTINCT as cleanup.",
    references: [sqlStandardReference, subqueryReference],
    desktopPractice: joinPractice,
  },
  {
    id: "sql-support-correlated-subquery",
    kind: "sql",
    topic: "SQL support",
    dialect: "Portable SQL",
    prompt: "employees(id, department, salary): (1, 'a', 10), (2, 'a', 30), (3, 'b', 20).\n\nWhich query condition returns employees paid above their own department average?",
    choices: [
      "e.salary > (SELECT AVG(peer.salary) FROM employees peer WHERE peer.department = e.department)",
      "e.salary > (SELECT AVG(peer.salary) FROM employees peer)",
      "AVG(e.salary) > e.salary",
      "e.department > (SELECT AVG(peer.department) FROM employees peer)",
    ],
    correctChoice: "e.salary > (SELECT AVG(peer.salary) FROM employees peer WHERE peer.department = e.department)",
    answer: "The subquery is correlated because peer.department = e.department refers to the current outer row. Department a averages 20, so only employee 2 qualifies; department b averages 20, so employee 3 does not. Removing the correlation makes one uncorrelated global average and answers a different question.",
    references: [sqlStandardReference, subqueryReference],
    desktopPractice: correlatedPractice,
  },
  {
    id: "sql-support-cte-boundary",
    kind: "sql",
    topic: "SQL support",
    dialect: "Portable SQL",
    prompt: "A long query repeats the same derived paid_total expression. What does moving that derivation into WITH paid AS (...) establish by itself?",
    choices: [
      "A named intermediate query that can make the statement easier to compose and read, not an automatic speedup",
      "A permanent indexed table that survives the statement",
      "A guarantee that the database executes the CTE once for every outer row",
      "A semantic replacement for GROUP BY and window functions",
    ],
    correctChoice: "A named intermediate query that can make the statement easier to compose and read, not an automatic speedup",
    answer: "A non-recursive CTE gives a derived relation a name and can make a multi-stage query readable. It is not automatically faster, permanent, or row-by-row. PostgreSQL can fold a side-effect-free CTE into the parent query in eligible cases, while MATERIALIZED and NOT MATERIALIZED affect that PostgreSQL optimization boundary. Use a CTE first as readable decomposition, then inspect a real plan if performance matters.",
    references: [sqlStandardReference, cteReference],
    desktopPractice: joinPractice,
  },
  {
    id: "sql-support-window-partition-order",
    kind: "sql",
    topic: "SQL support",
    dialect: "Portable SQL",
    prompt: "tickets(team, created_at): ('red', 09:00), ('red', 10:00), ('blue', 08:00). What does ROW_NUMBER() OVER (PARTITION BY team ORDER BY created_at) do?",
    choices: [
      "Restarts numbering for each team and sequences rows within that team by created_at",
      "Sorts the final result globally but never numbers rows",
      "Groups each team into one output row",
      "Numbers all rows once and ignores team",
    ],
    correctChoice: "Restarts numbering for each team and sequences rows within that team by created_at",
    answer: "PARTITION BY defines independent windows, so row numbers restart at 1 for red and blue. ORDER BY defines the sequence inside each partition. It does not guarantee the final result's display order; use the query's outer ORDER BY for that. Add a stable tie-breaker when equal timestamps must receive deterministic row numbers.",
    references: [sqlStandardReference, windowReference, selectReference],
    desktopPractice: aggregatePractice,
  },
  {
    id: "sql-support-window-default-frame",
    kind: "sql",
    topic: "SQL support",
    dialect: "PostgreSQL 18",
    prompt: "rows(id, amount): (1, 10), (2, 10), (3, 20). Ordered by id for display.\n\nWhat running totals does SUM(amount) OVER (ORDER BY amount) produce under PostgreSQL's default frame?",
    choices: ["20, 20, 40", "10, 20, 40", "10, 10, 20", "40, 40, 40"],
    correctChoice: "20, 20, 40",
    answer: "With ORDER BY and no explicit frame, PostgreSQL's default is RANGE from the partition start through the current row's last peer. The two amount = 10 rows are peers, so both see 20; the final row sees 40. For row-by-row accumulation, make ordering deterministic and say ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW, which yields 10, 20, 40 for ORDER BY amount, id.",
    references: [sqlStandardReference, windowExpressionReference, windowReference],
    desktopPractice: rollingPractice,
  },
  {
    id: "sql-support-window-last-value-frame",
    kind: "sql",
    topic: "SQL support",
    dialect: "PostgreSQL 18",
    prompt: "Within one account, events are ordered at 09:00, 10:00, 11:00. You want every row to show the partition's final event value. Which frame avoids the common last_value trap?",
    choices: [
      "ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING",
      "Use the default frame with ORDER BY event_time",
      "ROWS BETWEEN CURRENT ROW AND CURRENT ROW",
      "Remove OVER and keep last_value",
    ],
    correctChoice: "ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING",
    answer: "last_value reads the last row of the current window frame, not automatically the last row of the partition. With ORDER BY, the default frame ends at the current row's last peer, so last_value often looks like the current value. Ending the ROWS frame at UNBOUNDED FOLLOWING makes the whole partition visible to every row.",
    references: [sqlStandardReference, windowReference, windowExpressionReference],
    desktopPractice: rollingPractice,
  },
  {
    id: "sql-support-postgres-distinct-on",
    kind: "sql",
    topic: "SQL support",
    dialect: "PostgreSQL 18",
    prompt: "PostgreSQL events(id, user_id, created_at) may tie on time. Which query returns one deterministic latest event per user?",
    choices: [
      "SELECT DISTINCT ON (user_id) * FROM events ORDER BY user_id, created_at DESC, id DESC",
      "SELECT DISTINCT user_id, * FROM events ORDER BY created_at DESC",
      "SELECT * FROM events GROUP BY user_id ORDER BY created_at DESC",
      "SELECT DISTINCT ON (created_at) * FROM events ORDER BY user_id",
    ],
    correctChoice: "SELECT DISTINCT ON (user_id) * FROM events ORDER BY user_id, created_at DESC, id DESC",
    answer: "PostgreSQL-specific DISTINCT ON keeps the first row in each user_id group according to ORDER BY. The leftmost ORDER BY expression must match DISTINCT ON, created_at DESC selects the latest time, and id DESC breaks ties deterministically. Portable SQL uses a window rank in a subquery instead; do not present DISTINCT ON as universal SQL.",
    references: [selectListReference, selectReference],
    desktopPractice: basicPractice,
  },
];
