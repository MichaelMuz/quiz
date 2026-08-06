import type { StaticItem } from "./content.js";

const accessedAt = "accessed 2026-08-06";
const permissionAssumptions = "\n\nAssume ordinary mode-bit DAC only: no ACLs, root/capability override, SELinux, sticky/setuid/setgid, umask effect, or stale group membership.";

const inodeReference = {
  label: `Linux man-pages inode(7), ${accessedAt}`,
  url: "https://man7.org/linux/man-pages/man7/inode.7.html",
};
const pathResolutionReference = {
  label: `Linux man-pages path_resolution(7), ${accessedAt}`,
  url: "https://man7.org/linux/man-pages/man7/path_resolution.7.html",
};
const credentialsReference = {
  label: `Linux man-pages credentials(7), ${accessedAt}`,
  url: "https://man7.org/linux/man-pages/man7/credentials.7.html",
};
const groupsReference = {
  label: `GNU coreutils groups(1), ${accessedAt}`,
  url: "https://man7.org/linux/man-pages/man1/groups.1.html",
};
const unlinkReference = {
  label: `Linux man-pages unlink(2), ${accessedAt}`,
  url: "https://man7.org/linux/man-pages/man2/unlink.2.html",
};
const renameReference = {
  label: `Linux man-pages rename(2), ${accessedAt}`,
  url: "https://man7.org/linux/man-pages/man2/rename.2.html",
};
const namespacesReference = {
  label: `Linux man-pages namespaces(7), ${accessedAt}`,
  url: "https://man7.org/linux/man-pages/man7/namespaces.7.html",
};
const cgroupReference = {
  label: `Linux kernel Control Group v2 documentation, ${accessedAt}`,
  url: "https://www.kernel.org/doc/html/latest/admin-guide/cgroup-v2.html",
};
const ociConfigReference = {
  label: `OCI Runtime Specification config, ${accessedAt}`,
  url: "https://specs.opencontainers.org/runtime-spec/config/",
};

export const linuxPermissionsContainerItems: StaticItem[] = [
  {
    id: "linux-permissions-mode-decoding",
    kind: "command",
    topic: "Linux permissions",
    prompt: `Decode both modes and check the candidate symbolic form:\n0644\n0755\nrwxr-xr-x\n\nWhich mappings and octal weights match?${permissionAssumptions}`,
    choices: [
      "0644 = rw-r--r--; 0755 = rwxr-xr-x; in each class r=4, w=2, x=1",
      "0644 = rwxr--r--; 0755 = rw-r-xr-x; r=1, w=2, x=4",
      "0644 = rw-rw-rw-; 0755 = rwxrwxrwx; each digit applies to every class",
      "0644 = r--rw-rw-; 0755 = r-xr-xrwx; owner/group/other are read right to left",
    ],
    correctChoice: "0644 = rw-r--r--; 0755 = rwxr-xr-x; in each class r=4, w=2, x=1",
    answer: "Read the three permission classes independently as owner, group, then other. `r = 4`, `w = 2`, and `x = 1` inside each class, so 6 is `rw-`, 4 is `r--`, 7 is `rwx`, and 5 is `r-x`. Therefore `0644` is `rw-r--r--`, while `0755` is `rwxr-xr-x`. The leading zero marks octal notation here; no special bits are in scope.",
    references: [inodeReference],
  },
  {
    id: "linux-permissions-supplementary-group",
    kind: "command",
    topic: "Linux permissions",
    prompt: `Process:\nuid=1001(alice) gid=1001(alice) groups=1001(alice),2000(developers)\n\n/srv/report: owner=bob group=developers mode=0640 regular file\nOperation: read file bytes\n\nAllowed, and which exact class and bit decide?${permissionAssumptions}`,
    choices: [
      "Allow: group class; the group r bit (4) is set",
      "Deny: Alice's primary group is not developers, so supplementary groups do not count",
      "Allow: union the owner w bit with the other class",
      "Deny: Bob owns the file, so no other user can read it",
    ],
    correctChoice: "Allow: group class; the group r bit (4) is set",
    answer: "Alice is not the owner, but `developers` is one of her process's supplementary groups and matches the file group. That selects only the group bits, `r--`; the group `r` bit allows reading file bytes. Supplementary groups count in this class decision. Do not union owner/group/other or consult other after group matched. On Linux, filesystem IDs normally equal the corresponding effective IDs used in this normalized fixture.",
    references: [pathResolutionReference, credentialsReference, groupsReference],
  },
  {
    id: "linux-permissions-owner-no-fallthrough",
    kind: "command",
    topic: "Linux permissions",
    prompt: `Process:\nuid=1001(alice) gid=2000(developers) groups=2000(developers)\n\n/srv/note: owner=alice group=developers mode=0044 regular file\nOperation: read file bytes\n\nAllowed, and which exact class and bit decide?${permissionAssumptions}`,
    choices: [
      "Deny: owner class; the owner r bit is not set",
      "Allow: fall through to the group r bit because Alice is also in developers",
      "Allow: fall through to the other r bit because it is the most permissive match",
      "Allow: union the group and other r bits into the owner class",
    ],
    correctChoice: "Deny: owner class; the owner r bit is not set",
    answer: "The owner match selects only the owner class, which is `---` in `0044`. Because the owner `r` bit is absent, reading is denied. Class selection is not a search for the most permissive result: an owner does not fall through to matching group or other bits, and the classes are never unioned.",
    references: [pathResolutionReference],
  },
  {
    id: "linux-permissions-other-class",
    kind: "command",
    topic: "Linux permissions",
    prompt: `Process:\nuid=1003(carol) gid=1003(carol) groups=1003(carol),3000(ops)\n\n/srv/report: owner=bob group=developers mode=0004 regular file\nOperation: read file bytes\n\nAllowed, and which exact class and bit decide?${permissionAssumptions}`,
    choices: [
      "Allow: other class; the other r bit (4) is set",
      "Deny: Carol is neither the owner nor in developers, so other is never considered",
      "Allow: group class; membership in any supplementary group matches every file group",
      "Deny: the owner class has no bits, and it always overrides all users",
    ],
    correctChoice: "Allow: other class; the other r bit (4) is set",
    answer: "Carol matches neither the owner nor the file group through her effective or supplementary groups, so the other class is selected. In `0004`, the other `r` bit is set, which permits reading the regular file's bytes. Her unrelated `ops` membership does not select the file's `developers` group class.",
    references: [pathResolutionReference, credentialsReference],
  },
  {
    id: "linux-permissions-regular-file-bits",
    kind: "command",
    topic: "Linux permissions",
    prompt: `Process euid=alice. /srv/tool is a regular file owned by alice with mode=0700. Match the selected owner bits to operations.${permissionAssumptions}`,
    choices: [
      "r reads file bytes; w modifies or truncates contents; x permits execution, subject to path search and a usable executable/interpreter path",
      "r lists directory entries; w renames the parent; x grants storage quota",
      "r reads metadata only; w deletes the filename anywhere; x changes the owner",
      "r, w, and x have identical meanings for regular files and directories",
    ],
    correctChoice: "r reads file bytes; w modifies or truncates contents; x permits execution, subject to path search and a usable executable/interpreter path",
    answer: "For a regular file, `r` permits reading bytes and `w` permits modifying or truncating contents. `x` is the file execution bit, but execution also depends on successful search through the pathname and on the executable format or script interpreter path being usable. A file's `w` bit does not control removing its directory entry.",
    references: [inodeReference, pathResolutionReference],
  },
  {
    id: "linux-permissions-directory-bits",
    kind: "command",
    topic: "Linux permissions",
    prompt: `Process euid=alice. /srv/team is a directory owned by alice with mode=0500. What can the selected owner bits do?${permissionAssumptions}`,
    choices: [
      "r can list entry names; x can search/traverse and access a known child name; no w means entries cannot be created, deleted, or renamed",
      "r reads every child's bytes; x executes the directory as a program; no w prevents reading metadata",
      "r and x both grant storage quota; w would only modify bytes inside existing child files",
      "x lists names while r alone permits access to every named child",
    ],
    correctChoice: "r can list entry names; x can search/traverse and access a known child name; no w means entries cannot be created, deleted, or renamed",
    answer: "Directory permissions describe the name-to-inode mapping. Directory `r` lists entry names, `w` permits mutating entries, and `x` supplies search permission: traversing the directory and accessing a named child when the rest of the path and target permissions allow it. Here owner `r-x` supports listing and search, but not entry mutation. These meanings differ from regular-file byte access.",
    references: [inodeReference, pathResolutionReference, unlinkReference, renameReference],
  },
  {
    id: "linux-permissions-path-traversal",
    kind: "command",
    topic: "Linux permissions",
    prompt: `Process euid=alice, groups=alice.\nOperation: read /srv/team/report\n\n/srv: owner=root group=root mode=0711 directory (Alice gets other --x)\n/srv/team: owner=bob group=developers mode=0744 directory (Alice gets other r--, no x)\n/srv/team/report: owner=alice group=alice mode=0600 regular file\n\nAllowed, and where is the decisive check?${permissionAssumptions}`,
    choices: [
      "Deny at /srv/team: the selected other-class directory x bit is not set",
      "Allow because Alice owns report and its owner r bit is set",
      "Allow because directory r always implies x for a known child",
      "Deny at report because every regular file needs its x bit for reading",
    ],
    correctChoice: "Deny at /srv/team: the selected other-class directory x bit is not set",
    answer: "Every traversed pathname component requires directory search permission, `x`. `/srv` grants other `x`, but `/srv/team` selects other `r--` for Alice, so lookup stops there. Owning the final file and having its owner `r` bit cannot repair an earlier traversal denial; directory `r` can list names but does not substitute for `x` search.",
    references: [pathResolutionReference],
  },
  {
    id: "linux-permissions-directory-mutation",
    kind: "command",
    topic: "Linux permissions",
    prompt: `Process:\nuid=1001(alice) gid=1001(alice) groups=1001(alice),2000(developers)\n\n/srv/drop: owner=bob group=developers mode=0060 directory (group rw-, no x)\nOperation: create /srv/drop/new.txt\n\nAllowed, and which selected bits matter?${permissionAssumptions}`,
    choices: [
      "Deny: group class is selected; directory mutation normally needs both group w and group x, but x is absent",
      "Allow: group w alone is sufficient to create a named entry",
      "Allow: group r and w union into an implied x bit",
      "Deny: only the directory owner can ever create entries",
    ],
    correctChoice: "Deny: group class is selected; directory mutation normally needs both group w and group x, but x is absent",
    answer: "Alice's supplementary `developers` membership selects the directory's group bits, `rw-`. Creating a named entry needs directory `w` to mutate the entry set and directory `x` to search the directory. The missing group `x` bit denies this operation even though group `w` is set; no permission class is unioned with it.",
    references: [pathResolutionReference, credentialsReference, unlinkReference],
  },
  {
    id: "linux-permissions-parent-directory-rename",
    kind: "command",
    topic: "Linux permissions",
    prompt: `Process:\nuid=1001(alice) gid=1001(alice) groups=1001(alice),2000(developers)\n\n/srv: owner=root group=root mode=0711 directory\n/srv/drop: owner=bob group=developers mode=0730 directory (group wx)\n/srv/drop/report: owner=bob group=auditors mode=0444 regular file\nOperation: rename report to archived inside /srv/drop\n\nAllowed under these fixture assumptions?${permissionAssumptions}`,
    choices: [
      "Allow: /srv/drop selects group class with parent-directory w+x; the target file's 0444 mode does not control this rename",
      "Deny: report lacks its file w bit, which always controls rename and delete",
      "Deny: Alice must own report even when the parent grants w+x",
      "Allow only by unioning report's other r bit with the parent's group w bit",
    ],
    correctChoice: "Allow: /srv/drop selects group class with parent-directory w+x; the target file's 0444 mode does not control this rename",
    answer: "Renaming or deleting a directory entry is governed by the containing parent directory, not by the target file's write bit. Alice can traverse `/srv`, then her supplementary `developers` membership selects `/srv/drop` group `wx`, allowing this same-directory rename under the stated assumptions. The target's `0444` mode controls its own byte access, not the parent entry. Sticky-bit and cross-directory cases are deliberately excluded.",
    references: [pathResolutionReference, renameReference, unlinkReference, credentialsReference],
  },
  {
    id: "linux-container-namespace-map",
    kind: "command",
    topic: "Linux container primitives",
    prompt: "Match each namespace to the process view or identity it isolates: mount, PID, network, UTS, IPC, user.",
    choices: [
      "mount → mount points; PID → process IDs; network → devices/stacks/ports; UTS → hostname/domain name; IPC → System V IPC and POSIX message queues; user → user and group IDs",
      "mount → disk quota; PID → CPU time; network → memory; UTS → files; IPC → hostnames; user → block devices",
      "mount → file bytes; PID → process count limit; network → I/O bandwidth; UTS → CPU shares; IPC → RAM limit; user → VM hardware",
      "All six namespaces account for resources; cgroups only rename the resulting views",
    ],
    correctChoice: "mount → mount points; PID → process IDs; network → devices/stacks/ports; UTS → hostname/domain name; IPC → System V IPC and POSIX message queues; user → user and group IDs",
    answer: "Namespaces wrap global kernel resources so member processes see isolated instances. Mount namespaces isolate mount points and propagation, PID namespaces process-ID number spaces, network namespaces network devices/stacks/ports, UTS namespaces hostname/domain name, IPC namespaces System V IPC and POSIX message queues, and user namespaces user/group IDs plus related privilege context. They isolate views or identities; they are not a generic resource-limit mechanism.",
    references: [namespacesReference],
  },
  {
    id: "linux-container-mount-view-not-quota",
    kind: "command",
    topic: "Linux container primitives",
    prompt: "A process should see a private mount layout where /data names a different mounted tree. The request does not set any storage-capacity limit. Which primitive and boundary fit?",
    choices: [
      "A mount namespace isolates the mount-table/filesystem view; it does not itself create a storage quota",
      "A memory cgroup rewrites mount points and therefore supplies the private /data view",
      "A PID namespace limits disk blocks while preserving the host mount table",
      "A mount namespace is a virtual disk whose capacity is fixed by the namespace",
    ],
    correctChoice: "A mount namespace isolates the mount-table/filesystem view; it does not itself create a storage quota",
    answer: "Use a mount namespace when processes need a distinct view of mount points and propagation. The processes still use the same kernel, and the namespace does not itself impose filesystem capacity or storage quota. Quotas, backing-store limits, and I/O control are separate mechanisms; describing the mount namespace as a generic filesystem limit swaps view isolation with resource control.",
    references: [namespacesReference],
  },
  {
    id: "linux-container-cgroup-resources",
    kind: "command",
    topic: "Linux container primitives",
    prompt: "One workload needs CPU accounting, a memory ceiling, I/O distribution, and a maximum process count. Which primitive owns that behavior?",
    choices: [
      "cgroups organize processes and account for or constrain CPU, memory, I/O, and process count",
      "mount namespaces account for CPU and memory because resources appear under filesystems",
      "PID namespaces impose every resource ceiling by changing visible process IDs",
      "cgroups emulate separate processors and RAM as hardware virtualization",
    ],
    correctChoice: "cgroups organize processes and account for or constrain CPU, memory, I/O, and process count",
    answer: "Cgroups organize processes hierarchically, while controllers account for or distribute and constrain resources such as CPU, memory, I/O, and process count. The PID controller limits the number of tasks; it is different from a PID namespace's isolated process-ID view. Cgroups are kernel resource-control machinery, not hardware virtualization and not a VM boundary.",
    references: [cgroupReference, namespacesReference],
  },
  {
    id: "linux-container-scenario-classification",
    kind: "command",
    topic: "Linux container primitives",
    prompt: "Classify four requirements:\n1 private hostname\n2 a process sees itself as PID 1\n3 private network interfaces and port space\n4 enforced memory ceiling",
    choices: [
      "1 UTS namespace; 2 PID namespace; 3 network namespace; 4 memory cgroup",
      "1 memory cgroup; 2 pids cgroup; 3 mount namespace; 4 user namespace",
      "1 PID namespace; 2 UTS namespace; 3 I/O cgroup; 4 network namespace",
      "All four are cgroups because isolation and accounting are the same boundary",
    ],
    correctChoice: "1 UTS namespace; 2 PID namespace; 3 network namespace; 4 memory cgroup",
    answer: "The first three requirements change process-visible views: UTS for hostname, PID for process IDs, and network for devices/stacks/ports. A memory ceiling is resource control and belongs to the memory cgroup controller. Notice the tempting PID distinction: a PID namespace changes ID visibility, while a pids cgroup limits how many tasks may exist.",
    references: [namespacesReference, cgroupReference],
  },
  {
    id: "linux-container-component-map",
    kind: "command",
    topic: "Linux container primitives",
    prompt: "Which compact component map best describes an ordinary Linux container without pretending it is a VM?",
    choices: [
      "namespaces isolate selected views/identities; cgroups account for or constrain resources; a root filesystem supplies the file tree; the runtime configures these kernel mechanisms around processes",
      "namespaces provide virtual CPUs; cgroups provide a guest kernel; the root filesystem is a hardware disk",
      "cgroups isolate every process view; namespaces enforce every resource ceiling; the runtime replaces the host kernel",
      "a root filesystem alone is the container; namespaces and cgroups are optional aliases for a virtual machine monitor",
    ],
    correctChoice: "namespaces isolate selected views/identities; cgroups account for or constrain resources; a root filesystem supplies the file tree; the runtime configures these kernel mechanisms around processes",
    answer: "A container is a composed process environment: selected namespaces isolate views and identities, cgroups account for or constrain resources, the configured root filesystem supplies the visible file tree, and a runtime asks the host kernel to establish and start that environment. Neither namespaces nor cgroups alone is a container or VM, and the processes still run on the host kernel rather than a guest kernel created by either primitive.",
    references: [namespacesReference, cgroupReference, ociConfigReference],
  },
];
