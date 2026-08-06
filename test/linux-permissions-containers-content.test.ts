import { describe, expect, it } from "vitest";
import { contentBank } from "../src/content.js";
import { chooseStableId } from "../src/scheduler.js";
import { QuizStore } from "../src/store.js";

function item(id: string) {
  const found = contentBank.find((candidate) => candidate.id === id);
  expect(found, `missing ${id}`).toBeDefined();
  return found!;
}

const permissionIds = [
  "linux-permissions-mode-decoding",
  "linux-permissions-supplementary-group",
  "linux-permissions-owner-no-fallthrough",
  "linux-permissions-other-class",
  "linux-permissions-regular-file-bits",
  "linux-permissions-directory-bits",
  "linux-permissions-path-traversal",
  "linux-permissions-directory-mutation",
  "linux-permissions-parent-directory-rename",
];

const containerIds = [
  "linux-container-namespace-map",
  "linux-container-mount-view-not-quota",
  "linux-container-cgroup-resources",
  "linux-container-scenario-classification",
  "linux-container-component-map",
];

const cohortIds = [...permissionIds, ...containerIds];
const accessedAt = "accessed 2026-08-06";

describe("Linux permissions and container primitives", () => {
  it("decodes ordinary mode bits and selects exactly one owner, group, or other class", () => {
    expect(contentBank.filter(({ id }) => id.startsWith("linux-permissions-")).map(({ id }) => id))
      .toEqual(permissionIds);

    const decoding = item("linux-permissions-mode-decoding");
    expect(decoding.prompt).toMatch(/0644.*0755.*rwxr-xr-x/is);
    expect(decoding.correctChoice).toMatch(/0644.*rw-r--r--.*0755.*rwxr-xr-x/is);
    expect(decoding.answer).toMatch(/r = 4.*w = 2.*x = 1.*class/is);

    const supplementary = item("linux-permissions-supplementary-group");
    expect(supplementary.prompt).toMatch(/uid=.*alice.*groups=.*developers.*owner=bob.*group=developers.*0640.*read/is);
    expect(supplementary.correctChoice).toMatch(/allow.*group class.*r bit/is);
    expect(supplementary.answer).toMatch(/supplementary.*group.*only.*group bits/is);

    const owner = item("linux-permissions-owner-no-fallthrough");
    expect(owner.prompt).toMatch(/owner=alice.*group=developers.*0044.*read/is);
    expect(owner.correctChoice).toMatch(/deny.*owner class.*r bit.*not set/is);
    expect(owner.answer).toMatch(/owner.*selects.*owner class.*does not fall through.*group or other/is);

    const other = item("linux-permissions-other-class");
    expect(other.prompt).toMatch(/uid=1003\(carol\).*groups=.*ops/is);
    expect(other.prompt).toMatch(/owner=bob.*group=developers.*mode=0004.*Operation: read/is);
    expect(other.correctChoice).toMatch(/allow.*other class.*r bit/is);

    for (const id of permissionIds) {
      const candidate = item(id);
      expect(candidate.choices).toContain(candidate.correctChoice);
      expect(candidate.prompt).toMatch(/no ACLs.*root\/capability override.*SELinux.*sticky\/setuid\/setgid.*umask.*stale group membership/is);
    }
  });

  it("distinguishes regular-file, directory, traversal, mutation, and parent-entry checks", () => {
    const fileBits = item("linux-permissions-regular-file-bits");
    expect(fileBits.answer).toMatch(/regular file.*r.*read.*bytes.*w.*contents.*x.*execut/is);
    expect(fileBits.answer).toMatch(/interpreter.*path/is);

    const directoryBits = item("linux-permissions-directory-bits");
    expect(directoryBits.answer).toMatch(/directory.*r.*list.*names.*w.*entries.*x.*search|directory.*r.*names.*w.*entries.*x.*search/is);
    expect(directoryBits.answer).not.toMatch(/x.*filesystem quota/i);

    const traversal = item("linux-permissions-path-traversal");
    expect(traversal.prompt).toMatch(/\/srv\/team\/report.*\/srv.*x.*\/srv\/team.*no.*x/is);
    expect(traversal.correctChoice).toMatch(/deny.*\/srv\/team.*directory.*x.*not set/is);
    expect(traversal.answer).toMatch(/every.*traversed.*component.*search.*x/is);

    const mutation = item("linux-permissions-directory-mutation");
    expect(mutation.prompt).toMatch(/mode=0060.*directory.*group rw-.*no x/is);
    expect(mutation.prompt).toMatch(/Operation: create \/srv\/drop\/new\.txt/is);
    expect(mutation.correctChoice).toMatch(/deny.*directory.*w.*x/is);

    const rename = item("linux-permissions-parent-directory-rename");
    expect(rename.prompt).toMatch(/rename|delete/i);
    expect(rename.prompt).toMatch(/\/srv\/drop:.*mode=0730.*group wx/is);
    expect(rename.prompt).toMatch(/\/srv\/drop\/report:.*mode=0444/is);
    expect(rename.correctChoice).toMatch(/allow.*parent[- ]directory.*w.*x/is);
    expect(rename.answer).toMatch(/renam.*directory entry.*parent directory.*target file.*write bit/is);
  });

  it("classifies namespace views, cgroup controls, and a container's component boundaries", () => {
    expect(contentBank.filter(({ id }) => id.startsWith("linux-container-")).map(({ id }) => id))
      .toEqual(containerIds);

    const namespaceMap = item("linux-container-namespace-map");
    expect(namespaceMap.correctChoice).toMatch(/mount.*mount points.*PID.*process IDs.*network.*devices.*ports.*UTS.*hostname.*IPC.*message queues.*user.*user and group IDs/is);

    const mount = item("linux-container-mount-view-not-quota");
    expect(mount.correctChoice).toMatch(/mount namespace.*mount-table.*view.*not.*quota/is);
    expect(mount.answer).toMatch(/same kernel.*view.*not.*capacity|not.*storage.*limit/is);

    const cgroups = item("linux-container-cgroup-resources");
    expect(cgroups.correctChoice).toMatch(/cgroups.*CPU.*memory.*I\/O.*process count/is);
    expect(cgroups.answer).toMatch(/organize processes.*account.*constrain/is);
    expect(cgroups.answer).toMatch(/not.*hardware virtualization/is);

    const scenarios = item("linux-container-scenario-classification");
    expect(scenarios.prompt).toMatch(/hostname.*PID 1.*network interface.*memory ceiling/is);
    expect(scenarios.correctChoice).toMatch(/UTS namespace.*PID namespace.*network namespace.*memory cgroup/is);

    const components = item("linux-container-component-map");
    expect(components.correctChoice).toMatch(/namespaces.*views.*cgroups.*resources.*root filesystem.*runtime.*kernel/is);
    expect(components.answer).toMatch(/neither.*alone.*VM|not.*VM/is);

    for (const id of containerIds) {
      const candidate = item(id);
      expect(candidate.choices).toContain(candidate.correctChoice);
      expect(candidate.references?.length).toBeGreaterThan(0);
    }
  });

  it("keeps stable choice grading, source scope, mixed-queue reachability, and stored replay", () => {
    expect(cohortIds).toHaveLength(14);
    expect(new Set(cohortIds).size).toBe(14);

    for (const id of cohortIds) {
      const candidate = item(id);
      expect(candidate.kind).toBe("command");
      expect(candidate.choices).toContain(candidate.correctChoice);
      expect(candidate.references?.length).toBeGreaterThan(0);
      expect(candidate.references?.every(({ label, url }) =>
        label.includes(accessedAt) && url.startsWith("https://")),
      ).toBe(true);
      expect(`${candidate.prompt}\n${candidate.answer}`).not.toMatch(/find -perm|memory\.events|chmod inventory/i);
    }

    const urls = new Set(cohortIds.flatMap((id) => item(id).references?.map(({ url }) => url) ?? []));
    expect(urls).toEqual(expect.objectContaining(new Set([
      "https://man7.org/linux/man-pages/man7/inode.7.html",
      "https://man7.org/linux/man-pages/man7/path_resolution.7.html",
      "https://man7.org/linux/man-pages/man7/credentials.7.html",
      "https://man7.org/linux/man-pages/man1/groups.1.html",
      "https://man7.org/linux/man-pages/man7/namespaces.7.html",
      "https://www.kernel.org/doc/html/latest/admin-guide/cgroup-v2.html",
    ])));

    const now = new Date("2026-08-06T12:00:00Z");
    const mixedIds = new Set(Array.from({ length: contentBank.length * 2 }, (_, index) =>
      chooseStableId(index, [], now)));
    expect(cohortIds.every((id) => mixedIds.has(id))).toBe(true);

    const replay = item("linux-permissions-supplementary-group");
    const store = new QuizStore(":memory:");
    try {
      store.recordAttempt({
        submissionId: "linux-permissions-replay",
        stableId: replay.id,
        seed: null,
        prompt: replay.prompt,
        expectedAnswer: replay.answer,
        response: replay.correctChoice!,
        correct: true,
        rating: "good",
        reviewedAt: now.toISOString(),
      });
      expect(store.attemptBySubmission("linux-permissions-replay")).toMatchObject({
        stableId: replay.id,
        prompt: replay.prompt,
        expectedAnswer: replay.answer,
        response: replay.correctChoice,
        correct: true,
      });
      expect(store.reviewState(replay.id)).toMatchObject({ reviews: 1, successfulReviews: 1 });
    } finally {
      store.close();
    }
  });
});
