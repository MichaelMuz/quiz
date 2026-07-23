import type { StaticItem } from "./content.js";

const bashExitStatus = {
  label: "GNU Bash manual, Exit Status",
  url: "https://www.gnu.org/software/bash/manual/html_node/Exit-Status.html",
};
const linuxSignals = {
  label: "Linux signal(7)",
  url: "https://man7.org/linux/man-pages/man7/signal.7.html",
};
const linuxOomKiller = {
  label: "Linux kernel, OOM killer implementation",
  url: "https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/mm/oom_kill.c",
};
const kubernetesResources = {
  label: "Kubernetes, Resource Management for Pods and Containers",
  url: "https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/",
};
const kubernetesTerminationStatus = {
  label: "Kubernetes API, ContainerStateTerminated",
  url: "https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.35/#containerstateterminated-v1-core",
};
const cgroupV2 = {
  label: "Linux kernel, cgroup v2 memory.events",
  url: "https://www.kernel.org/doc/html/latest/admin-guide/cgroup-v2.html#memory-interface-files",
};

export const processExitItems: StaticItem[] = [
  {
    id: "process-signal-status-convention",
    kind: "flashcard",
    topic: "Process diagnosis",
    prompt: "A child is terminated by signal 11. Under Bash's convention, what status is reported, and what does that status mean?",
    answer: "Bash reports 128 + N when a command terminates on fatal signal N, so signal 11 becomes status 139. This records signal termination: the process was signal-terminated, not a process that returned the normal exit code 139. Other shells and runtimes commonly expose the same convention, but Bash is the authority scoped here.",
    choices: [
      "128 + 11 = 139; the process was signal-terminated, not a normal exit 139",
      "128 - 11 = 117; the process returned exit code 117",
      "11; signal numbers are always reported unchanged as normal exit codes",
      "139; the process must have called exit 139",
    ],
    correctChoice: "128 + 11 = 139; the process was signal-terminated, not a normal exit 139",
    references: [bashExitStatus, linuxSignals],
  },
  {
    id: "process-status-to-signal-anchors",
    kind: "flashcard",
    topic: "Process diagnosis",
    prompt: "Under Bash's 128 + N convention, map statuses 137, 139, and 143 back to their signal names and numbers.",
    answer: "Subtract 128 from each status: 137 − 128 = 9, SIGKILL; 139 − 128 = 11, SIGSEGV; 143 − 128 = 15, SIGTERM. In particular, 139 maps to SIGSEGV, not SIGKILL.",
    choices: [
      "137 → SIGKILL (9); 139 → SIGSEGV (11); 143 → SIGTERM (15)",
      "137 → SIGSEGV (9); 139 → SIGKILL (11); 143 → SIGTERM (15)",
      "137 → SIGKILL (9); 139 → SIGTERM (11); 143 → SIGSEGV (15)",
      "137 → SIGTERM (9); 139 → SIGSEGV (11); 143 → SIGKILL (15)",
    ],
    correctChoice: "137 → SIGKILL (9); 139 → SIGSEGV (11); 143 → SIGTERM (15)",
    references: [bashExitStatus, linuxSignals],
  },
  {
    id: "process-signal-to-status-anchors",
    kind: "flashcard",
    topic: "Process diagnosis",
    prompt: "Under Bash's convention, derive the statuses for SIGKILL (9), SIGSEGV (11), and SIGTERM (15).",
    answer: "Add 128 to each signal number: 9 + 128 = 137, 11 + 128 = 139, and 15 + 128 = 143. Therefore SIGKILL maps to 137, SIGSEGV maps to 139, and SIGTERM maps to 143.",
    choices: [
      "SIGKILL (9) → 137; SIGSEGV (11) → 139; SIGTERM (15) → 143",
      "SIGKILL (9) → 139; SIGSEGV (11) → 137; SIGTERM (15) → 143",
      "SIGKILL (9) → 9; SIGSEGV (11) → 11; SIGTERM (15) → 15",
      "SIGKILL (9) → 119; SIGSEGV (11) → 117; SIGTERM (15) → 113",
    ],
    correctChoice: "SIGKILL (9) → 137; SIGSEGV (11) → 139; SIGTERM (15) → 143",
    references: [bashExitStatus, linuxSignals],
  },
  {
    id: "process-secondary-signal-status-anchors",
    kind: "flashcard",
    topic: "Process diagnosis",
    prompt: "Use 128 + signal number to derive the compact crash set: SIGABRT (6), SIGFPE (8), and SIGILL (4).",
    answer: "Apply the same rule: 128 + 6 = 134 for SIGABRT, 128 + 8 = 136 for SIGFPE, and 128 + 4 = 132 for SIGILL. Derive these when needed rather than memorizing a full signal-status inventory.",
    choices: [
      "SIGABRT (6) → 134; SIGFPE (8) → 136; SIGILL (4) → 132",
      "SIGABRT (6) → 136; SIGFPE (8) → 134; SIGILL (4) → 132",
      "SIGABRT (6) → 122; SIGFPE (8) → 120; SIGILL (4) → 124",
      "SIGABRT (6) → 6; SIGFPE (8) → 8; SIGILL (4) → 4",
    ],
    correctChoice: "SIGABRT (6) → 134; SIGFPE (8) → 136; SIGILL (4) → 132",
    references: [bashExitStatus, linuxSignals],
  },
  {
    id: "process-status-137-ambiguity",
    kind: "flashcard",
    topic: "Process diagnosis",
    prompt: "Your only observation is shell status 137. What can you conclude, and what must you inspect next?",
    answer: "Under Bash's convention, 137 points to signal 9, SIGKILL. Linux OOM handling can send SIGKILL, so an OOM kill is consistent with 137, but 137 alone does not prove OOM. A manual kill -9 can produce the same signal-derived status, and an explicit exit 137 produces the same numeric shell-status observation without signal termination. Inspect runtime, kernel, Kubernetes, or cgroup evidence before naming the cause.",
    choices: [
      "It is consistent with SIGKILL; inspect OOM and runtime evidence before naming the cause",
      "It proves the Linux OOM killer selected the process",
      "It means SIGSEGV because every crash uses status 137",
      "It proves the process called exit 137 normally",
    ],
    correctChoice: "It is consistent with SIGKILL; inspect OOM and runtime evidence before naming the cause",
    references: [bashExitStatus, linuxSignals, linuxOomKiller],
  },
  {
    id: "kubernetes-oom-termination-evidence",
    kind: "bash",
    topic: "Kubernetes diagnosis",
    prompt: "A container status includes:\n\nlastState:\n  terminated:\n    reason: OOMKilled\n    exitCode: 137\n\nWhat is the strongest supported conclusion?",
    answer: "Kubernetes recorded the previous container state with reason OOMKilled, while exitCode 137 aligns with SIGKILL under the common 128 + N convention. The recorded reason plus code is stronger evidence than the number 137 alone. Continue with memory limits, usage, Events, node evidence, and cgroup counters when you need the circumstances rather than just the recorded reason.",
    choices: [
      "Kubernetes recorded the previous container as OOMKilled; 137 also aligns with SIGKILL",
      "Exit code 137 alone proves OOMKilled, so the reason field adds no evidence",
      "The container segfaulted because 137 means SIGSEGV",
      "The current container is necessarily still out of memory",
    ],
    correctChoice: "Kubernetes recorded the previous container as OOMKilled; 137 also aligns with SIGKILL",
    references: [kubernetesResources, kubernetesTerminationStatus, bashExitStatus],
  },
  {
    id: "cgroup-v2-oom-kill-evidence",
    kind: "bash",
    topic: "Linux diagnosis",
    prompt: "$ cd /sys/fs/cgroup/quiz\n$ cat memory.events\noom 3\noom_kill 2\n\nWhat does oom_kill 2 establish?",
    answer: "In cgroup v2, memory.events exposes the oom_kill counter: the number of processes belonging to this cgroup killed by an OOM killer. Here that cumulative counter is 2. It is useful evidence to correlate with the incident, not proof that a particular status 137 was an OOM kill.",
    choices: [
      "Two processes in this cgroup were killed by an OOM killer; correlate the counter with the incident",
      "The latest process definitely exited normally with code 2",
      "Exactly two bytes exceeded the memory limit",
      "Every status 137 on the host came from this cgroup",
    ],
    correctChoice: "Two processes in this cgroup were killed by an OOM killer; correlate the counter with the incident",
    references: [cgroupV2],
  },
];
