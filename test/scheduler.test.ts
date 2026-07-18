import { describe, expect, it } from "vitest";
import { chooseStableId } from "../src/scheduler.js";

describe("transparent interval scheduler", () => {
  it("resurfaces an overdue item before the mixed base queue", () => {
    expect(chooseStableId(3, [{ stableId: "bash-single-quotes", interval: 0, reviews: 2, dueAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }], new Date("2026-01-02T00:00:00.000Z")))
      .toBe("bash-single-quotes");
  });

  it("uses a mixed generated/static queue when nothing is due", () => {
    const ids = Array.from({ length: 10 }, (_, position) => chooseStableId(position, [], new Date()));
    expect(ids).toContain("binary-prefix-exponent");
    expect(ids).toContain("binary-amount-exponent");
    expect(ids).toContain("binary-prefix-ladder");
  });
});
