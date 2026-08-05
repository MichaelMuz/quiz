import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

const fixtureUrl = new URL("./fixtures/sql-support-postgres.sql", import.meta.url);
const expectedUrl = new URL("./fixtures/sql-support-postgres.expected.txt", import.meta.url);

function executableSetup(source: string): string {
  return source.split("\\set QUIET 0", 1)[0]!
    .split("\n")
    .filter((line) => !line.startsWith("\\"))
    .join("\n");
}

function fixtureQueries(source: string): Array<{ label: string; sql: string }> {
  return source.split(/^\\echo /m).slice(1).map((section) => {
    const newline = section.indexOf("\n");
    return { label: section.slice(0, newline).trim(), sql: section.slice(newline + 1).trim() };
  });
}

describe("SQL support PostgreSQL fixture", () => {
  it("matches every portable and PostgreSQL-specific expected result in a real PostgreSQL engine", async () => {
    const source = await readFile(fixtureUrl, "utf8");
    const expected = await readFile(expectedUrl, "utf8");
    const db = new PGlite();
    try {
      await db.exec(executableSetup(source));
      const lines: string[] = [];
      for (const { label, sql } of fixtureQueries(source)) {
        const result = await db.query<Record<string, unknown>>(sql);
        lines.push(label, ...result.rows.map((row) => Object.values(row).map((value) => value ?? "[NULL]").join("|")));
      }
      expect(`${lines.join("\n")}\n`).toBe(expected);
    } finally {
      await db.close();
    }
  });
});
