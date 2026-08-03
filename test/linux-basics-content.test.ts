import { describe, expect, it } from "vitest";
import { contentBank } from "../src/content.js";
import { chooseStableId } from "../src/scheduler.js";
import { QuizStore } from "../src/store.js";

function item(id: string) {
  const found = contentBank.find((candidate) => candidate.id === id);
  expect(found, `missing ${id}`).toBeDefined();
  return found!;
}

const laneIds = (lane: string) => contentBank
  .filter(({ id }) => id.startsWith(`linux-${lane}-`))
  .map(({ id }) => id);

const accessedAt = "accessed 2026-08-03";

describe("practical Fedora and Linux fluency", () => {
  it("answers DNF5 discovery, transaction, provenance, and diagnosis questions", () => {
    expect(laneIds("dnf")).toEqual([
      "linux-dnf-search-v-info",
      "linux-dnf-provides-command",
      "linux-dnf-installed-available-provenance",
      "linux-dnf-transaction-preview",
      "linux-dnf-remove-autoremove-boundary",
      "linux-dnf-repair-version-local-rpm",
      "linux-dnf-repository-provenance",
      "linux-dnf-temporary-persistent-repos",
      "linux-dnf-unavailable-diagnosis",
    ]);

    expect(item("linux-dnf-search-v-info").correctChoice).toMatch(/dnf5 search.*dnf5 info/i);
    expect(item("linux-dnf-provides-command").correctChoice).toContain("dnf5 provides /usr/bin/rg");
    const packagePopulation = item("linux-dnf-installed-available-provenance");
    expect(packagePopulation.prompt).toMatch(/--installed.*--available.*full_nevra.*from_repo.*repoid/is);
    expect(packagePopulation.correctChoice).toMatch(/full_nevra.*identity.*from_repo.*installed provenance.*repoid.*current population/is);
    expect(packagePopulation.answer).toMatch(/full_nevra.*name-epoch:version-release\.architecture/is);
    expect(packagePopulation.answer).toMatch(/from_repo.*repository.*came from/is);
    expect(packagePopulation.answer).toMatch(/repoid.*system.*installed.*enabled repository.*available/is);

    const preview = item("linux-dnf-transaction-preview");
    expect(preview.prompt).toMatch(/dnf5 --assumeno install ripgrep.*Installing.*Installing dependencies.*Is this ok/is);
    expect(preview.answer).toMatch(/repository.*dependency.*preview.*no package state changed/is);

    expect(item("linux-dnf-remove-autoremove-boundary").answer).toMatch(/remove.*dependenc.*--no-autoremove.*autoremove.*no longer required/is);
    expect(item("linux-dnf-repair-version-local-rpm").correctChoice).toMatch(/reinstall.*downgrade.*\.\/tool.*\.rpm/is);

    const provenance = item("linux-dnf-repository-provenance");
    expect(provenance.prompt).toMatch(/Fedora.*updates.*google-chrome.*COPR.*RPM Fusion/is);
    expect(provenance.answer).toMatch(/fedora-workstation-repositories.*Google Chrome.*third-party.*owner.*signing/is);
    expect(provenance.references?.map(({ url }) => url)).toEqual(expect.arrayContaining([
      "https://docs.fedoraproject.org/en-US/workstation-working-group/third-party-repos/",
      "https://rpmfusion.org/Configuration",
    ]));

    const repoScope = item("linux-dnf-temporary-persistent-repos");
    expect(repoScope.correctChoice).toMatch(/--enable-repo=copr:copr\.fedorainfracloud\.org:alex:tools.*config-manager setopt.*enabled=1/is);
    expect(repoScope.answer).toMatch(/current DNF5 command.*persistent repository override.*plugin/is);

    const diagnosis = item("linux-dnf-unavailable-diagnosis");
    expect(diagnosis.answer).toMatch(/wrong name.*provides.*--refresh.*disabled.*architecture.*OpenPGP/is);
    expect(diagnosis.answer).not.toMatch(/disable.*gpg.*recommended/i);

    for (const id of laneIds("dnf")) {
      const candidate = item(id);
      expect(candidate.choices).toContain(candidate.correctChoice);
      expect(candidate.references?.length).toBeGreaterThan(0);
      expect(candidate.references?.every(({ label, url }) =>
        label.includes(accessedAt)
        && url.startsWith("https://")),
      ).toBe(true);
    }
  });

  it("chooses Linux log evidence and preserves absence boundaries", () => {
    expect(laneIds("logs")).toEqual([
      "linux-logs-evidence-pipeline",
      "linux-logs-ring-v-journal",
      "linux-logs-boot-selection",
      "linux-logs-unit-v-status",
      "linux-logs-time-priority",
      "linux-logs-follow-boundary",
      "linux-logs-no-retained-match",
    ]);

    const pipeline = item("linux-logs-evidence-pipeline");
    expect(pipeline.correctChoice).toMatch(/producer.*collector.*retention.*query.*conclusion/i);
    expect(pipeline.answer).toMatch(/source.*collector.*storage.*retained.*filtered.*proves/is);

    const ring = item("linux-logs-ring-v-journal");
    expect(ring.prompt).toMatch(/dmesg.*journalctl -k/is);
    expect(ring.answer).toMatch(/live kernel ring buffer.*journal-retained kernel.*not.*strict superset/is);
    expect(ring.answer).toMatch(/capture.*permissions.*rate limit.*retention.*boot/is);
    expect(ring.references?.map(({ label }) => label)).toContain(
      "util-linux 2.43.devel-739-eee2e dmesg(1) documentation, accessed 2026-08-03",
    );

    expect(item("linux-logs-boot-selection").correctChoice).toMatch(/journalctl -k -b -1/);
    expect(item("linux-logs-unit-v-status").answer).toMatch(/systemctl status.*bounded.*journalctl.*-u.*fuller/is);

    const filtered = item("linux-logs-time-priority");
    expect(filtered.prompt).toMatch(/--since.*--until.*-p warning/is);
    expect(filtered.answer).toMatch(/retained.*api\.service.*interval.*warning.*more severe/is);

    expect(item("linux-logs-follow-boundary").answer).toMatch(/-f.*follows.*new.*entries.*historical.*does not prove/is);
    expect(item("linux-logs-no-retained-match").correctChoice).toMatch(/No matching retained record.*not.*event never happened/is);

    for (const id of laneIds("logs")) {
      const candidate = item(id);
      expect(candidate.choices).toContain(candidate.correctChoice);
      expect(candidate.references?.length).toBeGreaterThan(0);
      expect(candidate.references?.every(({ label, url }) =>
        label.includes(accessedAt)
        && url.startsWith("https://")),
      ).toBe(true);
    }
  });

  it("places Linux and XDG artifacts by scope, owner, kind, lifetime, and authority", () => {
    expect(laneIds("fs")).toEqual([
      "linux-fs-root-role-map",
      "linux-fs-runtime-virtual-temporary",
      "linux-fs-packaged-local-addon",
      "linux-fs-mount-service-homes",
      "linux-fs-merged-usr",
      "linux-fs-xdg-user-defaults",
      "linux-fs-xdg-runtime-absolute",
      "linux-fs-xdg-search-backup",
    ]);

    const rootMap = item("linux-fs-root-role-map");
    expect(rootMap.answer).toMatch(/\/.*root.*\/boot.*\/etc.*host-specific.*\/usr.*distribution.*\/var.*variable/is);

    expect(item("linux-fs-runtime-virtual-temporary").correctChoice).toMatch(/\/run.*boot.*\/dev.*device.*\/proc.*\/sys.*kernel.*\/tmp.*policy/is);

    const ownership = item("linux-fs-packaged-local-addon");
    expect(ownership.prompt).toMatch(/\/usr.*\/usr\/local.*\/opt.*\/etc\/opt.*\/var\/opt/is);
    expect(ownership.answer).toMatch(/distribution.*local administrator.*add-on.*FHS convention.*imperfect/is);

    expect(item("linux-fs-mount-service-homes").answer).toMatch(/\/home.*\/root.*\/media.*removable.*\/mnt.*temporary.*\/srv.*served/is);
    expect(item("linux-fs-merged-usr").answer).toMatch(/Fedora.*\/bin.*\/sbin.*\/lib.*compatibility.*\/usr/is);

    const defaults = item("linux-fs-xdg-user-defaults");
    expect(defaults.correctChoice).toMatch(/\.config.*\.local\/share.*\.local\/state.*\.cache/is);
    expect(defaults.answer).toMatch(/configuration.*durable.*nonportable.*disposable/is);

    const runtime = item("linux-fs-xdg-runtime-absolute");
    expect(runtime.answer).toMatch(/values.*absolute.*relative.*invalid/is);
    expect(runtime.correctChoice).toMatch(/config default.*replacement.*directory.*similar capabilities.*warning.*no fixed home/is);
    expect(runtime.answer).toMatch(/XDG_RUNTIME_DIR.*login.*absolute.*unset.*replacement directory.*similar capabilities.*warning.*no fixed home/is);

    const backup = item("linux-fs-xdg-search-backup");
    expect(backup.prompt).toMatch(/XDG_CONFIG_DIRS.*\/etc\/xdg.*XDG_DATA_DIRS.*\/usr\/local\/share:\/usr\/share/is);
    expect(backup.answer).toMatch(/preference-ordered.*back up.*config.*data.*state.*cache.*clear.*runtime/is);

    const ids = [...laneIds("dnf"), ...laneIds("logs"), ...laneIds("fs")];
    expect(ids).toHaveLength(24);
    expect(new Set(ids).size).toBe(24);
    for (const id of laneIds("fs")) {
      const candidate = item(id);
      expect(candidate.choices).toContain(candidate.correctChoice);
      expect(candidate.references?.length).toBeGreaterThan(0);
      expect(candidate.references?.every(({ label, url }) =>
        label.includes(accessedAt)
        && url.startsWith("https://")),
      ).toBe(true);
    }

    const now = new Date("2026-08-03T09:00:00Z");
    const mixedIds = new Set(Array.from({ length: contentBank.length * 2 }, (_, index) =>
      chooseStableId((index * 2) + 1, [], now)));
    expect(ids.every((id) => mixedIds.has(id))).toBe(true);

    const replay = item("linux-fs-xdg-runtime-absolute");
    const store = new QuizStore(":memory:");
    try {
      store.recordAttempt({
        submissionId: "linux-xdg-runtime-replay",
        stableId: replay.id,
        seed: null,
        prompt: replay.prompt,
        expectedAnswer: replay.answer,
        response: replay.correctChoice!,
        correct: true,
        rating: "good",
        reviewedAt: now.toISOString(),
      });
      expect(store.attemptBySubmission("linux-xdg-runtime-replay")).toMatchObject({
        stableId: replay.id,
        prompt: replay.prompt,
        expectedAnswer: replay.answer,
        response: replay.correctChoice,
        correct: true,
      });
      expect(store.reviewState(replay.id)).toMatchObject({
        reviews: 1,
        successfulReviews: 1,
      });
    } finally {
      store.close();
    }
  });
});
