import { describe, expect, it } from "vitest";
import { contentBank } from "../src/content.js";
import { processExitItems } from "../src/process-exit-content.js";
import { chooseStableId } from "../src/scheduler.js";

describe("process termination diagnosis practice", () => {
  it("derives Bash signal termination status as 128 plus the signal number", () => {
    const item = contentBank.find((candidate) => candidate.id === "process-signal-status-convention");

    expect(item).toBeDefined();
    expect(item!.prompt).toMatch(/signal 11.*status/i);
    expect(item!.correctChoice).toBe("128 + 11 = 139; the process was signal-terminated, not a normal exit 139");
    expect(item!.answer).toMatch(/Bash.*128 \+ N.*signal-terminated.*not.*normal exit code/i);
    expect(item!.references?.map(({ url }) => url)).toContain(
      "https://www.gnu.org/software/bash/manual/html_node/Exit-Status.html",
    );
  });

  it("recalls the high-value statuses back to their signal names and numbers", () => {
    const item = contentBank.find((candidate) => candidate.id === "process-status-to-signal-anchors");

    expect(item).toBeDefined();
    expect(item!.prompt).toMatch(/137.*139.*143/i);
    expect(item!.correctChoice).toBe("137 → SIGKILL (9); 139 → SIGSEGV (11); 143 → SIGTERM (15)");
    expect(item!.answer).toMatch(/subtract 128.*137.*SIGKILL.*139.*SIGSEGV.*143.*SIGTERM/i);
  });

  it("derives the high-value signals forward to their Bash statuses", () => {
    const item = contentBank.find((candidate) => candidate.id === "process-signal-to-status-anchors");

    expect(item).toBeDefined();
    expect(item!.prompt).toMatch(/SIGKILL.*SIGSEGV.*SIGTERM/i);
    expect(item!.correctChoice).toBe("SIGKILL (9) → 137; SIGSEGV (11) → 139; SIGTERM (15) → 143");
    expect(item!.answer).toMatch(/add 128.*9.*137.*11.*139.*15.*143/i);
  });

  it("keeps the secondary crash anchors compact and derivable", () => {
    const item = contentBank.find((candidate) => candidate.id === "process-secondary-signal-status-anchors");

    expect(item).toBeDefined();
    expect(item!.prompt).toMatch(/SIGABRT.*SIGFPE.*SIGILL/i);
    expect(item!.correctChoice).toBe("SIGABRT (6) → 134; SIGFPE (8) → 136; SIGILL (4) → 132");
    expect(item!.answer).toMatch(/128 \+ 6 = 134.*128 \+ 8 = 136.*128 \+ 4 = 132/i);
  });

  it("treats status 137 as evidence of SIGKILL, not proof of OOM", () => {
    const item = contentBank.find((candidate) => candidate.id === "process-status-137-ambiguity");

    expect(item).toBeDefined();
    expect(item!.prompt).toMatch(/only observation.*137/i);
    expect(item!.correctChoice).toBe("It is consistent with SIGKILL; inspect OOM and runtime evidence before naming the cause");
    expect(item!.answer).toMatch(/137.*SIGKILL.*OOM.*does not prove/i);
    expect(item!.answer).toMatch(/kill -9.*exit 137/i);
  });

  it("uses Kubernetes termination reason plus exit code as stronger OOM evidence", () => {
    const item = contentBank.find((candidate) => candidate.id === "kubernetes-oom-termination-evidence");

    expect(item).toBeDefined();
    expect(item!.prompt).toContain("lastState:\n  terminated:\n    reason: OOMKilled\n    exitCode: 137");
    expect(item!.correctChoice).toBe("Kubernetes recorded the previous container as OOMKilled; 137 also aligns with SIGKILL");
    expect(item!.answer).toMatch(/stronger evidence than.*137 alone/i);
    expect(item!.references?.map(({ url }) => url)).toContain(
      "https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/",
    );
  });

  it("uses cgroup v2 memory.events oom_kill as follow-up evidence", () => {
    const item = contentBank.find((candidate) => candidate.id === "cgroup-v2-oom-kill-evidence");

    expect(item).toBeDefined();
    expect(item!.prompt).toContain("$ cd /sys/fs/cgroup/quiz\n$ cat memory.events\noom 3\noom_kill 2");
    expect(item!.correctChoice).toBe("Two processes in this cgroup were killed by an OOM killer; correlate the counter with the incident");
    expect(item!.answer).toMatch(/cgroup v2.*memory\.events.*oom_kill.*counter.*not.*particular status 137/i);
    expect(item!.references?.map(({ url }) => url)).toContain(
      "https://www.kernel.org/doc/html/latest/admin-guide/cgroup-v2.html#memory-interface-files",
    );
  });

  it("ships exactly seven unique, deterministic, sourced, normally reachable cards", () => {
    const ids = [
      "process-signal-status-convention",
      "process-status-to-signal-anchors",
      "process-signal-to-status-anchors",
      "process-secondary-signal-status-anchors",
      "process-status-137-ambiguity",
      "kubernetes-oom-termination-evidence",
      "cgroup-v2-oom-kill-evidence",
    ];

    expect(processExitItems.map(({ id }) => id)).toEqual(ids);
    expect(new Set(ids).size).toBe(ids.length);
    expect(processExitItems.every((item) => item.choices?.includes(item.correctChoice!))).toBe(true);

    const urls = processExitItems.flatMap((item) => item.references?.map(({ url }) => url) ?? []);
    expect(urls).toEqual(expect.arrayContaining([
      "https://www.gnu.org/software/bash/manual/html_node/Exit-Status.html",
      "https://man7.org/linux/man-pages/man7/signal.7.html",
      "https://www.kernel.org/doc/html/latest/admin-guide/cgroup-v2.html#memory-interface-files",
      "https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/",
    ]));

    const reachable = new Set(Array.from({ length: 1_000 }, (_, position) =>
      chooseStableId(position, [], new Date("2026-01-02T00:00:00.000Z"))));
    for (const id of ids) expect(reachable).toContain(id);
  });
});
