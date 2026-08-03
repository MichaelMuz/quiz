import type { StaticItem } from "./content.js";

const accessedAt = "accessed 2026-08-03";

const dnfSearchReference = {
  label: `DNF5 search documentation, ${accessedAt}`,
  url: "https://dnf5.readthedocs.io/en/latest/commands/search.8.html",
};
const dnfInfoReference = {
  label: `DNF5 info documentation, ${accessedAt}`,
  url: "https://dnf5.readthedocs.io/en/latest/commands/info.8.html",
};
const dnfProvidesReference = {
  label: `DNF5 provides documentation, ${accessedAt}`,
  url: "https://dnf5.readthedocs.io/en/latest/commands/provides.8.html",
};
const dnfRepoqueryReference = {
  label: `DNF5 repoquery documentation, ${accessedAt}`,
  url: "https://dnf5.readthedocs.io/en/latest/commands/repoquery.8.html",
};
const dnfGlobalReference = {
  label: `DNF5 global options documentation, ${accessedAt}`,
  url: "https://dnf5.readthedocs.io/en/latest/dnf5.8.html",
};
const dnfInstallReference = {
  label: `DNF5 install documentation, ${accessedAt}`,
  url: "https://dnf5.readthedocs.io/en/latest/commands/install.8.html",
};
const dnfRemoveReference = {
  label: `DNF5 remove documentation, ${accessedAt}`,
  url: "https://dnf5.readthedocs.io/en/latest/commands/remove.8.html",
};
const dnfAutoremoveReference = {
  label: `DNF5 autoremove documentation, ${accessedAt}`,
  url: "https://dnf5.readthedocs.io/en/latest/commands/autoremove.8.html",
};
const dnfUpgradeReference = {
  label: `DNF5 upgrade documentation, ${accessedAt}`,
  url: "https://dnf5.readthedocs.io/en/latest/commands/upgrade.8.html",
};
const dnfReinstallReference = {
  label: `DNF5 reinstall documentation, ${accessedAt}`,
  url: "https://dnf5.readthedocs.io/en/latest/commands/reinstall.8.html",
};
const dnfDowngradeReference = {
  label: `DNF5 downgrade documentation, ${accessedAt}`,
  url: "https://dnf5.readthedocs.io/en/latest/commands/downgrade.8.html",
};
const dnfRepoReference = {
  label: `DNF5 repo documentation, ${accessedAt}`,
  url: "https://dnf5.readthedocs.io/en/latest/commands/repo.8.html",
};
const dnfConfigManagerReference = {
  label: `DNF5 config-manager plugin documentation, ${accessedAt}`,
  url: "https://dnf5.readthedocs.io/en/latest/dnf5_plugins/config-manager.8.html",
};
const dnfCoprReference = {
  label: `DNF5 COPR plugin documentation, ${accessedAt}`,
  url: "https://dnf5.readthedocs.io/en/latest/dnf5_plugins/copr.8.html",
};
const fedoraThirdPartyReference = {
  label: `Fedora Workstation third-party repository documentation, ${accessedAt}`,
  url: "https://docs.fedoraproject.org/en-US/workstation-working-group/third-party-repos/",
};
const rpmFusionReference = {
  label: `Fedora RPM Fusion setup documentation, ${accessedAt}`,
  url: "https://docs.fedoraproject.org/en-US/quick-docs/rpmfusion-setup/",
};
const rpmFusionOwnerReference = {
  label: `RPM Fusion repository-owner configuration documentation, ${accessedAt}`,
  url: "https://rpmfusion.org/Configuration",
};
const rpmReference = {
  label: `RPM 6.0.x rpm(8) documentation, ${accessedAt}`,
  url: "https://rpm.org/docs/6.0.x/man/rpm.8",
};
const journalctlReference = {
  label: `systemd 261.2 journalctl documentation, ${accessedAt}`,
  url: "https://www.freedesktop.org/software/systemd/man/latest/journalctl.html",
};
const journaldReference = {
  label: `systemd 261.2 systemd-journald documentation, ${accessedAt}`,
  url: "https://www.freedesktop.org/software/systemd/man/latest/systemd-journald.service.html",
};
const systemctlReference = {
  label: `systemd 261.2 systemctl documentation, ${accessedAt}`,
  url: "https://www.freedesktop.org/software/systemd/man/latest/systemctl.html",
};
const dmesgReference = {
  label: `util-linux 2.41 dmesg(1) documentation, ${accessedAt}`,
  url: "https://man7.org/linux/man-pages/man1/dmesg.1.html",
};
const fhsReference = {
  label: `Filesystem Hierarchy Standard 3.0, ${accessedAt}`,
  url: "https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html",
};
const fileHierarchyReference = {
  label: `systemd 261.2 file-hierarchy documentation, ${accessedAt}`,
  url: "https://www.freedesktop.org/software/systemd/man/latest/file-hierarchy.html",
};
const xdgReference = {
  label: `XDG Base Directory Specification 0.8, ${accessedAt}`,
  url: "https://specifications.freedesktop.org/basedir-spec/latest/",
};
const fedoraUsrMoveReference = {
  label: `Fedora UsrMove implementation documentation, ${accessedAt}`,
  url: "https://fedoraproject.org/wiki/Features/UsrMove",
};

export const linuxBasicsItems: StaticItem[] = [
  {
    id: "linux-dnf-search-v-info",
    kind: "command",
    topic: "Fedora DNF5",
    prompt: "You know the idea “fast recursive text search,” but not its Fedora package name. After search returns ripgrep, which pair discovers the name and then inspects that package?",
    choices: [
      "dnf5 search 'recursive text search', then dnf5 info ripgrep",
      "dnf5 info 'recursive text search', then dnf5 search --installed ripgrep",
      "rpm -qf 'recursive text search', then dnf5 remove ripgrep",
      "dnf5 provides ripgrep, then journalctl -u ripgrep",
    ],
    correctChoice: "dnf5 search 'recursive text search', then dnf5 info ripgrep",
    answer: "`dnf5 search` searches package metadata, by default names and summaries, so it is the useful first query when the package name is unknown. Once `ripgrep` is a candidate, `dnf5 info ripgrep` shows package details and whether matching builds are installed or available. Search results are candidates, not proof that the package is installed.",
    references: [dnfSearchReference, dnfInfoReference],
  },
  {
    id: "linux-dnf-provides-command",
    kind: "command",
    topic: "Fedora DNF5",
    prompt: "A script needs /usr/bin/rg, but `rg` is not the package name. Which query asks enabled repository metadata which package provides that file?",
    choices: [
      "dnf5 provides /usr/bin/rg",
      "dnf5 search --installed /usr/bin/rg",
      "rpm -ql /usr/bin/rg",
      "dnf5 repo list /usr/bin/rg",
    ],
    correctChoice: "dnf5 provides /usr/bin/rg",
    answer: "`dnf5 provides /usr/bin/rg` searches package capabilities and file provides, including available packages, and can reveal that the command comes from a differently named package. `rpm -qf /usr/bin/rg` is the complementary installed-system query after that path already exists; it asks which installed package owns the file.",
    references: [dnfProvidesReference, rpmReference],
  },
  {
    id: "linux-dnf-installed-available-provenance",
    kind: "command",
    topic: "Fedora DNF5",
    prompt: "Match each DNF5 repoquery question:\n\ninstalled package? → --installed\nenabled-repo package? → --available\nfull identity? → %{full_nevra}\ninstalled origin? → %{from_repo}\ncurrent repo? → %{repoid}",
    choices: [
      "%{full_nevra} is identity; %{from_repo} is installed provenance; %{repoid} names the current population",
      "--available means installed only; %{repoid} prints a package's files",
      "%{full_nevra} is only a repository name; --installed contacts every vendor server",
      "All four fields prove who signed and maintains the repository",
    ],
    correctChoice: "%{full_nevra} is identity; %{from_repo} is installed provenance; %{repoid} names the current population",
    answer: "`--installed` selects the installed population; `--available` selects enabled-repository candidates and is the default. They can be combined. `%{full_nevra}` is name-epoch:version-release.architecture. For an installed package, `%{from_repo}` reports the repository it came from. `%{repoid}` instead names the package's current population: `@System` for installed packages or the enabled repository ID for available packages. None of these fields alone proves who owns or deserves trust in that repository.",
    references: [dnfRepoqueryReference],
  },
  {
    id: "linux-dnf-transaction-preview",
    kind: "command",
    topic: "Fedora DNF5",
    prompt: "Normalized dry-stop transcript:\n\n$ dnf5 --assumeno install ripgrep\nInstalling:\n ripgrep x86_64 <ver> updates\nInstalling dependencies:\n pcre2 x86_64 <ver> fedora\nTransaction Summary:\n Installing: 2 packages\nIs this ok [y/N]: N\nOperation aborted\n\nWhat was learned?",
    choices: [
      "The proposed actions, versions, architectures, repositories, and dependency edge were resolved; --assumeno declined commitment, so no package state changed",
      "Both packages were installed because dependency resolution always commits",
      "Only ripgrep was installed; dependencies shown below the heading are informational",
      "The transcript proves every future Fedora release will choose these exact versions",
    ],
    correctChoice: "The proposed actions, versions, architectures, repositories, and dependency edge were resolved; --assumeno declined commitment, so no package state changed",
    answer: "Read the transaction by action, package identity, architecture, source repository, and dependency reason before approving it. `--assumeno` automatically answers no, so this is a safe preview and no package state changed. It still refreshed/read metadata and solved the transaction, and a later run may differ when repository metadata changes.",
    references: [dnfGlobalReference, dnfInstallReference],
  },
  {
    id: "linux-dnf-remove-autoremove-boundary",
    kind: "command",
    topic: "Fedora DNF5",
    prompt: "You are previewing removal of `photo-app`. DNF5 also proposes libraries that were installed as dependencies and are no longer needed. Which boundary is accurate?",
    choices: [
      "dnf5 remove may clean newly unneeded dependencies; use --no-autoremove to retain them, while dnf5 autoremove targets all dependency-installed leaves no longer required",
      "dnf5 remove can remove only the named package; dnf5 autoremove removes every package installed by a user",
      "--no-autoremove keeps photo-app but removes its dependencies",
      "autoremove is equivalent to deleting the DNF cache",
    ],
    correctChoice: "dnf5 remove may clean newly unneeded dependencies; use --no-autoremove to retain them, while dnf5 autoremove targets all dependency-installed leaves no longer required",
    answer: "By default, `dnf5 remove photo-app` may also remove dependencies that become unused, according to the `clean_requirements_on_remove` policy. `--no-autoremove` keeps those dependencies for that removal. Separate `dnf5 autoremove` finds dependency-installed leaf packages that are no longer required by any user-installed package. Preview the exact transaction rather than treating either command as a blind cleanup ritual.",
    references: [dnfRemoveReference, dnfAutoremoveReference],
  },
  {
    id: "linux-dnf-repair-version-local-rpm",
    kind: "command",
    topic: "Fedora DNF5",
    prompt: "Choose the operation that matches each intent:\n1 repair files at the same installed version\n2 move to the newest suitable repository build\n3 move to an older repository build\n4 install a downloaded local package with dependency solving",
    choices: [
      "1 dnf5 reinstall tool; 2 dnf5 upgrade tool; 3 dnf5 downgrade tool; 4 dnf5 install ./tool-1.2-1.fc43.x86_64.rpm",
      "1 dnf5 upgrade tool; 2 rpm -V tool; 3 dnf5 reinstall tool; 4 chmod +x ./tool.rpm",
      "1 dnf5 remove tool; 2 dnf5 info tool; 3 dnf5 search tool; 4 rpm -qf ./tool.rpm",
      "Use dnf5 install tool for all four; DNF5 ignores version and file-path intent",
    ],
    correctChoice: "1 dnf5 reinstall tool; 2 dnf5 upgrade tool; 3 dnf5 downgrade tool; 4 dnf5 install ./tool-1.2-1.fc43.x86_64.rpm",
    answer: "Use the verb that states the intended transaction: `reinstall` repairs the same NEVRA when that build remains available, `upgrade` selects a newer suitable build, `downgrade` selects an older suitable build, and `install ./name.rpm` treats the path as a local RPM while DNF5 resolves dependencies. `rpm -V tool` is a useful read-only verification query, but it does not repair files.",
    references: [dnfReinstallReference, dnfUpgradeReference, dnfDowngradeReference, dnfInstallReference, rpmReference],
  },
  {
    id: "linux-dnf-repository-provenance",
    kind: "command",
    topic: "Fedora DNF5",
    prompt: "A repo list contains Fedora (`fedora`), updates (`updates`), Google Chrome (`google-chrome`), COPR (`copr:...:alex:tools`), and RPM Fusion (`rpmfusion-free-updates`). Which provenance model is accurate?",
    choices: [
      "fedora/updates are Fedora repositories; google-chrome is Fedora Workstation's opt-in third-party path for Google's repo; COPR is project-scoped build hosting; RPM Fusion is a separate third-party repository family",
      "Every listed repository is built, maintained, and signed by the Fedora Project",
      "COPR and RPM Fusion are aliases for updates; google-chrome is part of Fedora base",
      "A familiar repository ID proves its packages are open source and security-reviewed by Fedora",
    ],
    correctChoice: "fedora/updates are Fedora repositories; google-chrome is Fedora Workstation's opt-in third-party path for Google's repo; COPR is project-scoped build hosting; RPM Fusion is a separate third-party repository family",
    answer: "Treat repository identity as an ownership and trust boundary. Fedora Workstation preinstalls its selected third-party definitions through `fedora-workstation-repositories`; the opt-in `google-chrome` repository supplies Google Chrome, but that does not turn it into Fedora-built software. COPR repositories belong to individual projects, and RPM Fusion is a separate third-party family. Before enabling an outside source, inspect its owner/maintenance, base URL, enabled scope, GPG key location, and package-signing policy. A valid signature proves the package matches a trusted key, not that the repository deserves trust.",
    references: [fedoraThirdPartyReference, dnfCoprReference, rpmFusionReference, rpmFusionOwnerReference],
  },
  {
    id: "linux-dnf-temporary-persistent-repos",
    kind: "command",
    topic: "Fedora DNF5",
    prompt: "Repo `copr:copr.fedorainfracloud.org:alex:tools` is configured but disabled. Which DNF5 pair distinguishes one-query access from a persistent enable?",
    choices: [
      "Temporary: dnf5 --enable-repo=copr:copr.fedorainfracloud.org:alex:tools repoquery tool; persistent: dnf5 config-manager setopt copr:copr.fedorainfracloud.org:alex:tools.enabled=1",
      "Temporary: dnf5 config-manager setopt ...enabled=1; persistent: dnf5 --enable-repo=... repoquery tool",
      "Both forms permanently rewrite the original .repo file",
      "Neither form can target a disabled repository",
    ],
    correctChoice: "Temporary: dnf5 --enable-repo=copr:copr.fedorainfracloud.org:alex:tools repoquery tool; persistent: dnf5 config-manager setopt copr:copr.fedorainfracloud.org:alex:tools.enabled=1",
    answer: "The global `--enable-repo=ID` option enables a repository only for the current DNF5 command. The DNF5 config-manager plugin's `setopt ID.enabled=1` writes a persistent repository override without editing the vendor's original file. `dnf5 copr enable OWNER/PROJECT` is another DNF5 plugin operation: it downloads and installs a persistent COPR `.repo` definition. Legacy DNF4 examples commonly use `config-manager --set-enabled`; learn DNF5 `setopt repo.enabled=1` first.",
    references: [dnfGlobalReference, dnfConfigManagerReference, dnfCoprReference],
  },
  {
    id: "linux-dnf-unavailable-diagnosis",
    kind: "command",
    topic: "Fedora DNF5",
    prompt: "`dnf5 install widget` says no matching packages. Which investigation preserves the evidence boundaries?",
    choices: [
      "Check the name/capability, refresh metadata deliberately, list enabled and disabled repos, inspect candidate architecture/release, then inspect repository ownership and signing configuration before enabling anything",
      "Retry with --no-gpgchecks; missing signatures are the usual reason search finds no package",
      "Run autoremove, because unavailable names are caused by unused dependencies",
      "Assume Fedora has no such software; an empty current query proves no repository could provide it",
    ],
    correctChoice: "Check the name/capability, refresh metadata deliberately, list enabled and disabled repos, inspect candidate architecture/release, then inspect repository ownership and signing configuration before enabling anything",
    answer: "Diagnose the failed edge instead of guessing. A wrong name may require `dnf5 search` or `dnf5 provides`; stale metadata can be retested with a deliberate `dnf5 --refresh repoquery ...`; `dnf5 repo list --all` can reveal a disabled source; repoquery can expose architecture and NEVRA conflicts. If a provider exists only outside current sources, verify the repository owner, release support, base URL, OpenPGP key, and signature policy before enabling it. `--no-gpgchecks` weakens verification and does not make an absent package appear.",
    references: [dnfSearchReference, dnfProvidesReference, dnfGlobalReference, dnfRepoReference, dnfRepoqueryReference],
  },
  {
    id: "linux-logs-evidence-pipeline",
    kind: "command",
    topic: "Linux log evidence",
    prompt: "Normalized path:\napi.service stdout → systemd-journald → /var/log/journal retention → journalctl -u api.service → one matching error\n\nWhich reasoning order is sound?",
    choices: [
      "producer/source → collector → retention/storage → query/filter → bounded conclusion",
      "query flag → conclusion → assume source and retention afterward",
      "collector → every event that ever happened → one universal log file",
      "service name → kernel ring buffer → proof of application intent",
    ],
    correctChoice: "producer/source → collector → retention/storage → query/filter → bounded conclusion",
    answer: "Trace the evidence in order: the service was the source, journald was the collector, persistent journal storage retained a record, `journalctl -u` filtered accessible records, and the result proves that matching retained evidence exists. It does not prove the record was the only error, that every emitted line was collected, or why the service failed. With volatile `/run/log/journal` storage, reboot changes the retention boundary.",
    references: [journaldReference, journalctlReference],
  },
  {
    id: "linux-logs-ring-v-journal",
    kind: "command",
    topic: "Linux log evidence",
    prompt: "After a long current boot, `dmesg` shows a recent kernel warning, while `journalctl -k` does not show it to this user. Must one tool be broken?",
    choices: [
      "No; dmesg reads the live finite kernel ring, while journalctl -k queries accessible journal-retained kernel records, so capture, permissions, rate limits, retention, and boot scope can differ",
      "Yes; journalctl -k is always a byte-for-byte strict superset of dmesg",
      "Yes; dmesg reads service stdout while journalctl -k reads only application files",
      "No; both commands generate synthetic warnings rather than read evidence",
    ],
    correctChoice: "No; dmesg reads the live finite kernel ring, while journalctl -k queries accessible journal-retained kernel records, so capture, permissions, rate limits, retention, and boot scope can differ",
    answer: "`dmesg` reads the live kernel ring buffer, a finite current-kernel evidence source whose access may be restricted. `journalctl -k` queries journal-retained kernel records. Journald has broader source coverage overall, but its kernel view is not a guaranteed strict superset of the live ring: capture timing, permissions, rate limits, retention/storage mode, and boot selection can all change the visible sets.",
    references: [dmesgReference, journalctlReference, journaldReference],
  },
  {
    id: "linux-logs-boot-selection",
    kind: "command",
    topic: "Linux log evidence",
    prompt: "The machine rebooted after a driver failure. Persistent journal records from the prior boot exist. Which query asks only for prior-boot kernel records?",
    choices: [
      "journalctl -k -b -1",
      "dmesg -w",
      "journalctl -u kernel.service -b 0",
      "systemctl status -1",
    ],
    correctChoice: "journalctl -k -b -1",
    answer: "`journalctl -k -b -1` combines the journal's kernel-message filter with the boot immediately before the current one. `-b 0` selects the current boot. The query works only if prior-boot records were retained and are accessible; `dmesg` ordinarily exposes the live kernel ring, not a saved previous-boot ring.",
    references: [journalctlReference, dmesgReference],
  },
  {
    id: "linux-logs-unit-v-status",
    kind: "command",
    topic: "Linux log evidence",
    prompt: "`systemctl status api.service` shows Failed plus five recent lines. You need the service's retained records from this boot. What is the next evidence query?",
    choices: [
      "journalctl -b -u api.service",
      "dmesg -u api.service",
      "systemctl status api.service proves the complete history already",
      "journalctl -k api.service",
    ],
    correctChoice: "journalctl -b -u api.service",
    answer: "`systemctl status` combines current unit state with a bounded convenience excerpt, so it is a fast starting point, not the full log history. `journalctl -b -u api.service` asks for the fuller set of accessible retained records for that unit in the current boot. Even that result remains limited by collection, retention, permissions, and the chosen boot.",
    references: [systemctlReference, journalctlReference],
  },
  {
    id: "linux-logs-time-priority",
    kind: "command",
    topic: "Linux log evidence",
    prompt: "What does this query select?\n\njournalctl -u api.service \\\n  --since '2026-08-03 10:00' \\\n  --until '2026-08-03 10:10' \\\n  -p warning",
    choices: [
      "Accessible retained api.service records in that interval at warning priority or more severe",
      "Every warning emitted anywhere, including records already expired or never collected",
      "Only kernel warnings from the ten minutes before the command runs",
      "Exactly one record because priorities are unique",
    ],
    correctChoice: "Accessible retained api.service records in that interval at warning priority or more severe",
    answer: "The filters are combined: retained records for `api.service`, inside the stated time interval, with warning priority or anything more severe through emergency. The timestamps are query bounds, not proof that collection was complete. An empty result means no matching accessible retained record, not that the service emitted no such event.",
    references: [journalctlReference],
  },
  {
    id: "linux-logs-follow-boundary",
    kind: "command",
    topic: "Linux log evidence",
    prompt: "You run `journalctl -u api.service -f`, watch one error arrive, then stop with Ctrl-C. What did follow mode establish?",
    choices: [
      "A matching new retained entry became visible while following; this short observation does not prove the error began then or reveal complete history",
      "The service emitted exactly one error in its lifetime",
      "Every prior record was replayed before follow mode started",
      "The kernel ring buffer contains the same application error forever",
    ],
    correctChoice: "A matching new retained entry became visible while following; this short observation does not prove the error began then or reveal complete history",
    answer: "`-f` follows new journal entries after showing its initial tail. It answers “is matching evidence arriving now?” during the observation window. It is not a substitute for a bounded historical query and does not prove when the failure began, whether earlier entries expired, or whether every producer message reached the journal.",
    references: [journalctlReference],
  },
  {
    id: "linux-logs-no-retained-match",
    kind: "command",
    topic: "Linux log evidence",
    prompt: "Normalized transcript:\n\n$ journalctl -k -b -1 --grep='I/O error'\n-- No entries --\n\nThe previous boot is selectable. What is the strongest conclusion?",
    choices: [
      "No matching retained record was accessible under this prior-boot kernel query; that does not prove the event never happened",
      "The previous boot had no storage error of any kind",
      "The kernel emitted the event, but journald certainly deleted only that line",
      "dmesg from the current boot must contain the missing previous-boot record",
    ],
    correctChoice: "No matching retained record was accessible under this prior-boot kernel query; that does not prove the event never happened",
    answer: "The query establishes absence only inside its evidence boundary: accessible journal-retained kernel records, selected previous boot, and matching text. The event may not have happened, may have used different wording, may not have been captured, may have been rate-limited or expired, or may be hidden by permissions. Do not upgrade “no retained match” into “the event did not happen.”",
    references: [journalctlReference, journaldReference],
  },
  {
    id: "linux-fs-root-role-map",
    kind: "command",
    topic: "Linux filesystem layout",
    prompt: "Match these system-wide roles:\n/\n/boot\n/etc\n/usr\n/var",
    choices: [
      "hierarchy root; boot files; host configuration; distribution/vendor OS content; persistent variable data",
      "root user's home; removable media; user cache; volatile runtime; kernel API",
      "boot files; hierarchy root; package cache; home directories; local administrator tools",
      "All five are interchangeable persistent application-data directories",
    ],
    correctChoice: "hierarchy root; boot files; host configuration; distribution/vendor OS content; persistent variable data",
    answer: "`/` is the root of the entire hierarchy, not the root user's home. `/boot` carries boot-loader and kernel-related static files. `/etc` is host-specific system configuration. `/usr` is primarily distribution/vendor-supplied, shareable operating-system content. `/var` carries persistent variable data such as logs, queues, databases, spools, and caches. These are standards and distribution conventions, not proof that every application behaves perfectly.",
    references: [fhsReference, fileHierarchyReference],
  },
  {
    id: "linux-fs-runtime-virtual-temporary",
    kind: "command",
    topic: "Linux filesystem layout",
    prompt: "Which classification preserves data kind and lifetime?",
    choices: [
      "/run = current-boot runtime state; /dev = device nodes; /proc and /sys = virtual kernel/API views; /tmp = temporary data whose cleanup follows system policy",
      "/run = durable backups; /dev = ordinary package files; /proc and /sys = persisted logs; /tmp = permanent configuration",
      "/run and /var are both guaranteed to survive reboot; /proc is a home directory",
      "/tmp is always erased at reboot on every Unix system, with no policy variation",
    ],
    correctChoice: "/run = current-boot runtime state; /dev = device nodes; /proc and /sys = virtual kernel/API views; /tmp = temporary data whose cleanup follows system policy",
    answer: "`/run` is volatile state for the current boot. `/dev` exposes device nodes and related runtime objects. `/proc` and `/sys` are virtual kernel/API filesystems, not ordinary persisted trees to back up. `/tmp` is for temporary files, but its exact cleanup and persistence are policy-dependent; do not infer a universal reboot guarantee from the pathname alone.",
    references: [fhsReference, fileHierarchyReference],
  },
  {
    id: "linux-fs-packaged-local-addon",
    kind: "command",
    topic: "Linux filesystem layout",
    prompt: "Place each ownership class:\nFedora/package content → /usr\nlocal-admin hierarchy → /usr/local\nself-contained add-on → /opt/acme\nits host config → /etc/opt/acme\nits variable data → /var/opt/acme",
    choices: [
      "This is the intended ownership split, while real applications may not follow every convention",
      "Put every class directly in /usr so the package manager and local administrator share ownership",
      "Use /opt only for temporary mount points and /usr/local only for logs",
      "FHS requires every third-party application to follow this layout exactly",
    ],
    correctChoice: "This is the intended ownership split, while real applications may not follow every convention",
    answer: "`/usr` is normally distribution/package-manager territory; `/usr/local` is the local administrator's parallel hierarchy outside ordinary distribution ownership. FHS defines `/opt/<provider-or-package>` for add-on packages, with related host configuration under `/etc/opt` and variable data under `/var/opt`. That is an FHS convention and a useful diagnosis model, not a guarantee: imperfect applications may store files elsewhere.",
    references: [fhsReference, fileHierarchyReference],
  },
  {
    id: "linux-fs-mount-service-homes",
    kind: "command",
    topic: "Linux filesystem layout",
    prompt: "Match the path to its usual role:\n/home, /root, /media, /mnt, /srv",
    choices: [
      "ordinary user homes; root user's home; removable-media mounts; temporary/manual mount point; data served by system services",
      "filesystem root; boot files; device nodes; runtime state; package cache",
      "five aliases for the same user home directory",
      "kernel APIs; host configuration; distribution binaries; local binaries; temporary files",
    ],
    correctChoice: "ordinary user homes; root user's home; removable-media mounts; temporary/manual mount point; data served by system services",
    answer: "`/home` contains ordinary users' home directories, while `/root` is the root user's home and is distinct from `/`. `/media` is the convention for removable-media mount points; `/mnt` is the conventional temporary/manual mount point. `/srv` may hold site-specific data served by system services when that convention fits. Mount and service placement remain policy choices, not magical behavior attached to names.",
    references: [fhsReference, fileHierarchyReference],
  },
  {
    id: "linux-fs-merged-usr",
    kind: "command",
    topic: "Linux filesystem layout",
    prompt: "On current Fedora, `/bin` resolves to `/usr/bin`. How should you classify `/bin`, `/sbin`, and `/lib*`?",
    choices: [
      "Compatibility paths into the merged /usr hierarchy, not independent package-content stores",
      "Three independent writable local-administrator hierarchies",
      "Per-user XDG directories that default inside $HOME",
      "Virtual kernel filesystems recreated from /proc at every command",
    ],
    correctChoice: "Compatibility paths into the merged /usr hierarchy, not independent package-content stores",
    answer: "Fedora's merged-`/usr` implementation makes `/bin`, `/sbin`, and `/lib*` compatibility symbolic links into corresponding `/usr` locations. Classify packaged executables and libraries by their `/usr` ownership even when an old path is displayed. The compatibility path remains usable, but memorizing two independent stores would teach a false current-Fedora model.",
    references: [fedoraUsrMoveReference, fileHierarchyReference],
  },
  {
    id: "linux-fs-xdg-user-defaults",
    kind: "command",
    topic: "Linux filesystem layout",
    prompt: "All four variables are unset. Match the XDG purpose to its default:\nconfig, data, state, cache",
    choices: [
      "~/.config; ~/.local/share; ~/.local/state; ~/.cache",
      "~/.local/share; ~/.config; ~/.cache; ~/.local/state",
      "/etc; /var/lib; /run; /tmp",
      "~/.config for all four purposes",
    ],
    correctChoice: "~/.config; ~/.local/share; ~/.local/state; ~/.cache",
    answer: "XDG separates user configuration (`~/.config`), durable and portable user data (`~/.local/share`), persistent but nonportable state such as history (`~/.local/state`), and disposable cache (`~/.cache`). The split supports targeted backup, synchronization, and cleanup. These are defaults when the corresponding variables are unset or empty, not permission to expand a literal `~` inside an XDG variable value.",
    references: [xdgReference],
  },
  {
    id: "linux-fs-xdg-runtime-absolute",
    kind: "command",
    topic: "Linux filesystem layout",
    prompt: "An app sees `XDG_CONFIG_HOME=relative/config` and no `XDG_RUNTIME_DIR`. Which interpretation follows XDG 0.8?",
    choices: [
      "Ignore the relative config value and use the config default; use a replacement runtime directory with similar capabilities, print a warning, and invent no fixed home default",
      "Resolve relative/config against the current working directory and use ~/.run for runtime",
      "Store both config and runtime files in /tmp forever",
      "Treat every relative XDG value as relative to /etc",
    ],
    correctChoice: "Ignore the relative config value and use the config default; use a replacement runtime directory with similar capabilities, print a warning, and invent no fixed home default",
    answer: "XDG base-directory values must be absolute; an implementation should treat a relative value as invalid and ignore it, so config falls back to `$HOME/.config`. `XDG_RUNTIME_DIR` is normally supplied by the login/runtime environment as an absolute, user-owned session-lifetime directory. When it is unset, the application should fall back to a replacement directory with similar capabilities and print a warning; the specification defines no fixed home-directory default. Runtime data is not durable or a backup target.",
    references: [xdgReference],
  },
  {
    id: "linux-fs-xdg-search-backup",
    kind: "command",
    topic: "Linux filesystem layout",
    prompt: "Defaults:\nXDG_CONFIG_DIRS=/etc/xdg\nXDG_DATA_DIRS=\n/usr/local/share:/usr/share\n\nWhat do the order and user-directory split imply?",
    choices: [
      "Earlier system directories have preference; user config/data/state are backup candidates by value, cache is recreatable, and runtime is session-scoped",
      "Later system directories always override earlier ones; cache and runtime are the only durable backup targets",
      "The lists replace XDG_CONFIG_HOME and XDG_DATA_HOME rather than supplement them",
      "Colon order is decorative because applications must merge every conflicting file identically",
    ],
    correctChoice: "Earlier system directories have preference; user config/data/state are backup candidates by value, cache is recreatable, and runtime is session-scoped",
    answer: "`XDG_CONFIG_DIRS` and `XDG_DATA_DIRS` are preference-ordered system search paths used in addition to the user-specific base directory; earlier entries take precedence when the same relative file appears. Back up valuable config and durable data, and often valuable state while recognizing that state may be machine-specific. Cache should be safe to clear and recreate; runtime is login/session-scoped and should not be backed up. Application adoption can still be imperfect.",
    references: [xdgReference],
  },
];
