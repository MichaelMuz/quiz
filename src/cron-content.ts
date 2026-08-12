import type { Reference, StaticItem } from "./content.js";

const accessedAt = "accessed 2026-08-12";

const cronieReference: Reference = {
  label: `Cronie crontab(5), ${accessedAt}`,
  url: "https://github.com/cronie-crond/cronie/blob/master/man/crontab.5",
};

const kubernetesReference: Reference = {
  label: `Kubernetes CronJob documentation, ${accessedAt}`,
  url: "https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/",
};

export const cronItems: StaticItem[] = [
  {
    id: "cron-construct-weekday-morning",
    kind: "command",
    topic: "Cron",
    prompt: "Cronie user crontab. Construct the five-field expression that runs at 09:15 every Monday through Friday in the America/New_York time zone. Choose the expression only; the command follows it.",
    choices: [
      "15 9 * * 1-5",
      "9 15 * * 1-5",
      "15 9 1-5 * *",
      "15 9 * 1-5 *",
    ],
    correctChoice: "15 9 * * 1-5",
    answer: "The five fields are minute, hour, day of month, month, day of week. Their Cronie ranges are minute 0-59, hour 0-23, day of month 1-31, month 1-12, and day of week 0-7, where 0 and 7 both mean Sunday. `15 9 * * 1-5` therefore matches 09:15 on weekdays in the stated America/New_York zone. In a user crontab, the command comes next; it does not add a username field.",
    references: [cronieReference],
  },
  {
    id: "cron-predict-list-range-times",
    kind: "command",
    topic: "Cron",
    prompt: "Cronie expression `5,35 8-9 * * *`. On Tuesday 2026-08-18, at which local times does it match in America/New_York?",
    choices: [
      "08:05, 08:35, 09:05, and 09:35",
      "08:05 and 09:35 only",
      "08:05, 08:40, and 09:15",
      "Every minute from 08:05 through 09:35",
    ],
    correctChoice: "08:05, 08:35, 09:05, and 09:35",
    answer: "The comma makes `5,35` a minute list, so minute 5 or 35 matches. The `8-9` hour range is inclusive, so hour 8 or 9 matches. The wildcards accept every day of month, month, and day of week. Combining the matching field values gives 08:05, 08:35, 09:05, and 09:35 in America/New_York on the stated date.",
    references: [cronieReference],
  },
  {
    id: "cron-step-field-scope",
    kind: "command",
    topic: "Cron",
    prompt: "Cronie expression `0 */23 * * *`, interpreted in America/New_York. Which diagnosis is correct?",
    choices: [
      "It matches 00:00 and 23:00 every day, not every 23 elapsed hours",
      "It runs every 23 elapsed hours, so its local hour drifts each day",
      "It matches only 23:00 because hour 0 is excluded by the step",
      "It matches every 23 minutes because steps always modify the minute field",
    ],
    correctChoice: "It matches 00:00 and 23:00 every day, not every 23 elapsed hours",
    answer: "A step advances within the field where it appears. Here `*/23` expands over the hour field's 0-23 range, selecting hours 0 and 23. That field resets with each calendar day, so the expression matches midnight and 23:00 in America/New_York every day. It is not an elapsed-duration timer and does not maintain a 23-hour interval across day boundaries.",
    references: [cronieReference],
  },
  {
    id: "cron-dom-dow-or-calendar",
    kind: "command",
    topic: "Cron",
    prompt: "Cronie expression `30 4 1,15 * 5`. Which dates match during August 2026 in America/New_York? In this month, August 1 and 15 are Saturdays; Fridays are August 7, 14, 21, and 28.",
    choices: [
      "August 1, 7, 14, 15, 21, and 28 at 04:30",
      "August 7 only at 04:30, because every field must match",
      "August 1 and 15 only at 04:30, because day of month wins",
      "August 7, 14, 21, and 28 only at 04:30, because day of week wins",
    ],
    correctChoice: "August 1, 7, 14, 15, 21, and 28 at 04:30",
    answer: "Cronie treats day of month and day of week specially. When both fields are restricted, the command runs when either field matches, which is OR semantics. The dates 1 and 15 match the day-of-month list, while 7, 14, 21, and 28 match Friday (`5`). Their union runs at 04:30 in America/New_York on all six dates.",
    references: [cronieReference],
  },
  {
    id: "cron-next-run-weekdays",
    kind: "command",
    topic: "Cron",
    prompt: "Cronie expression `30 10 * * 2,4`. The current local time is Monday 2026-08-17 10:12 in America/New_York. What is the next run?",
    choices: [
      "Tuesday 2026-08-18 at 10:30",
      "Monday 2026-08-17 at 10:30",
      "Tuesday 2026-08-18 at 02:30",
      "Thursday 2026-08-20 at 10:30",
    ],
    correctChoice: "Tuesday 2026-08-18 at 10:30",
    answer: "Minute 30 and hour 10 require 10:30. Day-of-week list `2,4` means Tuesday and Thursday in Cronie, where Sunday is 0 or 7. Starting after the stated Monday time, the next matching instant in America/New_York is Tuesday 2026-08-18 at 10:30.",
    references: [cronieReference],
  },
  {
    id: "cron-common-nicknames",
    kind: "command",
    topic: "Cron",
    prompt: "In Cronie, which mapping expands @hourly, @daily, @weekly, and @monthly to their ordinary five-field schedules?",
    choices: [
      "@hourly → 0 * * * *; @daily → 0 0 * * *; @weekly → 0 0 * * 0; @monthly → 0 0 1 * *",
      "@hourly → * 0 * * *; @daily → 0 * 0 * *; @weekly → 0 0 0 * *; @monthly → 0 0 * 1 *",
      "@hourly → */60 * * * *; @daily → */24 * * * *; @weekly → */7 * * * *; @monthly → */30 * * * *",
      "@hourly → 0 * * * *; @daily → 0 0 * * *; @weekly → 0 0 * * 7; @monthly → 0 0 * * 1",
    ],
    correctChoice: "@hourly → 0 * * * *; @daily → 0 0 * * *; @weekly → 0 0 * * 0; @monthly → 0 0 1 * *",
    answer: "Cronie's nicknames select calendar boundaries: `@hourly` is the start of each hour (`0 * * * *`), `@daily` is midnight each day (`0 0 * * *`), `@weekly` is midnight Sunday (`0 0 * * 0`), and `@monthly` is midnight on the first day of each month (`0 0 1 * *`). These are schedule aliases, not elapsed-duration timers.",
    references: [cronieReference],
  },
  {
    id: "cron-user-system-entry-shape",
    kind: "command",
    topic: "Cron",
    prompt: "An entry begins `15 2 * * *` and runs a backup at 02:15 daily. How does it differ between a Cronie user crontab and a system crontab such as /etc/crontab?",
    choices: [
      "User: five fields then command; system: five fields then username then command",
      "User: five fields then username then command; system: five fields then command",
      "Both: five fields then command; the daemon infers the system username from the command",
      "Both: six time fields then command; the first field is seconds",
    ],
    correctChoice: "User: five fields then command; system: five fields then username then command",
    answer: "Cronie crontab(5) defines user crontab entries as five time-and-date fields followed by the command. A system crontab adds a sixth field for the user name, then the command. For example, a user crontab can use `15 2 * * * /usr/local/bin/backup`; `/etc/crontab` needs something like `15 2 * * * backupuser /usr/local/bin/backup`.",
    references: [cronieReference],
  },
  {
    id: "cron-kubernetes-transfer",
    kind: "command",
    topic: "Cron",
    prompt: "A Kubernetes CronJob must run at 09:15 Monday through Friday in America/New_York. Which `.spec` fragment uses the supported time-zone boundary?",
    choices: [
      "schedule: \"15 9 * * 1-5\"\ntimeZone: \"America/New_York\"",
      "schedule: \"CRON_TZ=America/New_York 15 9 * * 1-5\"",
      "schedule: \"TZ=America/New_York 15 9 * * 1-5\"",
      "schedule: \"0 15 9 * * 1-5\"\ntimeZone: \"America/New_York\"",
    ],
    correctChoice: "schedule: \"15 9 * * 1-5\"\ntimeZone: \"America/New_York\"",
    answer: "Kubernetes `.spec.schedule` keeps the five-field minute, hour, day-of-month, month, day-of-week core. `.spec.timeZone` owns the named IANA time zone. Kubernetes rejects embedded `TZ` or `CRON_TZ` declarations in `.spec.schedule`. Kubernetes documents day of week as 0-6 or names, while Cronie also accepts Sunday as 0 or 7, so prefer `0` or `SUN` when transferring a Sunday schedule.",
    references: [cronieReference, kubernetesReference],
  },
];
