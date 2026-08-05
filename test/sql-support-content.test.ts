import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { contentBank } from "../src/content.js";
import { chooseStableId } from "../src/scheduler.js";

const expectedIds = [
  "sql-support-logical-processing-window-filter",
  "sql-support-null-not-in",
  "sql-support-count-null",
  "sql-support-join-multiplication",
  "sql-support-left-join-filter",
  "sql-support-group-having",
  "sql-support-conditional-aggregation",
  "sql-support-exists-semi-join",
  "sql-support-correlated-subquery",
  "sql-support-cte-boundary",
  "sql-support-window-partition-order",
  "sql-support-window-default-frame",
  "sql-support-window-last-value-frame",
  "sql-support-postgres-distinct-on",
] as const;

function item(id: typeof expectedIds[number]) {
  const found = contentBank.find((candidate) => candidate.id === id);
  expect(found, `missing ${id}`).toBeDefined();
  return found!;
}

describe("SQL construction-support practice", () => {
  it("ships a bounded, dialect-labeled, sourced cohort with contextual desktop practice", () => {
    const items = contentBank.filter(({ id }) => id.startsWith("sql-support-"));
    expect(items.map(({ id }) => id)).toEqual(expectedIds);

    for (const candidate of items) {
      const sql = candidate as typeof candidate & {
        dialect?: string;
        desktopPractice?: { label: string; url: string };
      };
      expect(candidate.kind).toBe("sql");
      expect(candidate.topic).toBe("SQL support");
      expect(candidate.choices).toContain(candidate.correctChoice);
      expect(sql.dialect).toMatch(/^(Portable SQL|PostgreSQL 18)$/);
      expect(sql.desktopPractice?.label).toMatch(/^Practice this at a computer:/);
      expect(sql.desktopPractice?.url).toMatch(/^https:\/\/pgexercises\.com\/questions\//);
      expect(candidate.references?.length).toBeGreaterThan(0);
      expect(candidate.references?.every(({ label, url }) =>
        label.includes("accessed 2026-08-05")
        && (url.startsWith("https://www.postgresql.org/docs/current/") || url.startsWith("https://www.iso.org/")),
      )).toBe(true);
    }

    expect(items.filter((candidate) => (candidate as typeof candidate & { dialect?: string }).dialect === "PostgreSQL 18")
      .map(({ id }) => id)).toEqual([
        "sql-support-window-default-frame",
        "sql-support-window-last-value-frame",
        "sql-support-postgres-distinct-on",
      ]);
    expect(items.some(({ prompt, answer }) => /LeetCode|HackerRank|DataLemur/.test(`${prompt}${answer}`))).toBe(false);
  });

  it("covers construction boundaries with explicit schemas, rows, and expected-result reasoning", () => {
    expect(item("sql-support-logical-processing-window-filter").answer).toMatch(/window.*after.*WHERE.*subquery|subquery.*window.*WHERE/is);
    expect(item("sql-support-null-not-in").answer).toMatch(/NULL.*NOT IN.*UNKNOWN.*NOT EXISTS/is);
    expect(item("sql-support-count-null").answer).toMatch(/COUNT\(\*\).*rows.*COUNT\(note\).*non-NULL/is);
    expect(item("sql-support-join-multiplication").answer).toMatch(/2.*3.*6.*pair/is);
    expect(item("sql-support-left-join-filter").answer).toMatch(/ON.*preserves.*WHERE.*removes/is);
    expect(item("sql-support-group-having").correctChoice).toBe("HAVING COUNT(*) >= 2");
    expect(item("sql-support-conditional-aggregation").correctChoice).toMatch(/SUM\(CASE WHEN status = 'paid' THEN amount ELSE 0 END\)/);
    expect(item("sql-support-exists-semi-join").answer).toMatch(/EXISTS.*one output row.*join.*duplicate/is);
    expect(item("sql-support-correlated-subquery").answer).toMatch(/outer row.*department.*uncorrelated/is);
    expect(item("sql-support-cte-boundary").answer).toMatch(/readable.*not.*automatically.*faster|not.*optimization fence/is);
    expect(item("sql-support-window-partition-order").answer).toMatch(/PARTITION BY.*restart.*ORDER BY.*sequence/is);
    expect(item("sql-support-window-default-frame").answer).toMatch(/default.*RANGE.*peer.*ROWS/is);
    expect(item("sql-support-window-last-value-frame").answer).toMatch(/last_value.*frame.*partition/is);
    expect(item("sql-support-postgres-distinct-on").answer).toMatch(/PostgreSQL-specific.*DISTINCT ON.*ORDER BY/is);
  });

  it("executes portable hostile fixtures for NULL, duplicate, outer-join, grouping, correlation, and window-frame traps", () => {
    const db = new Database(":memory:");
    try {
      db.exec(`
        CREATE TABLE employees(id INTEGER PRIMARY KEY, department TEXT, salary INTEGER, note TEXT);
        INSERT INTO employees VALUES
          (1, 'a', 10, NULL), (2, 'a', 30, 'lead'), (3, 'b', 20, NULL);
        CREATE TABLE training(employee_id INTEGER);
        INSERT INTO training VALUES (NULL);

        CREATE TABLE customers(id INTEGER PRIMARY KEY);
        INSERT INTO customers VALUES (1), (2);
        CREATE TABLE orders(id INTEGER PRIMARY KEY, customer_id INTEGER, status TEXT, amount INTEGER);
        INSERT INTO orders VALUES (10, 1, 'paid', 10), (11, 1, 'paid', 20), (12, 2, 'pending', 30);
        CREATE TABLE order_tags(order_id INTEGER, tag TEXT);
        INSERT INTO order_tags VALUES
          (10, 'a'), (10, 'b'), (10, 'c'), (11, 'a'), (11, 'b'), (11, 'c');
      `);

      expect(db.prepare("SELECT id FROM employees WHERE id NOT IN (SELECT employee_id FROM training) ORDER BY id").all()).toEqual([]);
      expect(db.prepare("SELECT e.id FROM employees e WHERE NOT EXISTS (SELECT 1 FROM training t WHERE t.employee_id = e.id) ORDER BY e.id").all())
        .toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
      expect(db.prepare("SELECT COUNT(*) AS rows, COUNT(note) AS notes FROM employees").get()).toEqual({ rows: 3, notes: 1 });
      expect(db.prepare("SELECT COUNT(*) AS pairs FROM orders o JOIN order_tags t ON t.order_id = o.id WHERE o.customer_id = 1").get())
        .toEqual({ pairs: 6 });
      expect(db.prepare("SELECT c.id FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.status = 'paid' GROUP BY c.id ORDER BY c.id").all())
        .toEqual([{ id: 1 }]);
      expect(db.prepare("SELECT c.id, COUNT(o.id) AS paid FROM customers c LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid' GROUP BY c.id ORDER BY c.id").all())
        .toEqual([{ id: 1, paid: 2 }, { id: 2, paid: 0 }]);
      expect(db.prepare("SELECT customer_id FROM orders GROUP BY customer_id HAVING COUNT(*) >= 2 ORDER BY customer_id").all())
        .toEqual([{ customer_id: 1 }]);
      expect(db.prepare("SELECT SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paid_total FROM orders").get())
        .toEqual({ paid_total: 30 });
      expect(db.prepare("SELECT e.id FROM employees e WHERE e.salary > (SELECT AVG(peer.salary) FROM employees peer WHERE peer.department = e.department) ORDER BY e.id").all())
        .toEqual([{ id: 2 }]);

      const defaultFrame = db.prepare(`
        SELECT id, SUM(amount) OVER (ORDER BY amount) AS running
        FROM (SELECT 1 AS id, 10 AS amount UNION ALL SELECT 2, 10 UNION ALL SELECT 3, 20)
        ORDER BY id
      `).all();
      const rowsFrame = db.prepare(`
        SELECT id, SUM(amount) OVER (ORDER BY amount, id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running
        FROM (SELECT 1 AS id, 10 AS amount UNION ALL SELECT 2, 10 UNION ALL SELECT 3, 20)
        ORDER BY id
      `).all();
      expect(defaultFrame).toEqual([{ id: 1, running: 20 }, { id: 2, running: 20 }, { id: 3, running: 40 }]);
      expect(rowsFrame).toEqual([{ id: 1, running: 10 }, { id: 2, running: 20 }, { id: 3, running: 40 }]);
    } finally {
      db.close();
    }
  });

  it("keeps every SQL card independently scheduled and reachable in the ordinary mixed queue", () => {
    const reachable = new Set(Array.from({ length: contentBank.length * 2 }, (_, index) =>
      chooseStableId((index * 2) + 1, [], new Date("2026-08-05T00:00:00.000Z"))));
    expect(expectedIds.every((id) => reachable.has(id))).toBe(true);

    const dueId = "sql-support-window-default-frame";
    expect(chooseStableId(0, [{
      stableId: dueId,
      interval: 1,
      reviews: 1,
      successfulReviews: 0,
      dueAt: "2026-08-04T00:00:00.000Z",
      updatedAt: "2026-08-04T00:00:00.000Z",
    }], new Date("2026-08-05T00:00:00.000Z"))).toBe(dueId);
  });
});
