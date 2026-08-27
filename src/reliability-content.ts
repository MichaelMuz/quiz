import type { GeneratedDefinition, GeneratedQuestion, StaticItem } from "./content.js";

type ReliabilityGenerator = (seed: number) => Omit<GeneratedQuestion, "stableId" | "grader">;

const minutesPerCommonYear = 365 * 24 * 60;
const availabilityLevels = [99, 99.9, 99.99, 99.999] as const;
const ninesNames = ["two nines", "three nines", "four nines", "five nines"] as const;

export const reliabilityGeneratedDefinitions: GeneratedDefinition[] = [
  { id: "reliability-year-hours", generator: "reliability-year-hours", grader: "reliability-number", active: true },
  { id: "reliability-year-minutes", generator: "reliability-year-minutes", grader: "reliability-number", active: true },
  { id: "reliability-year-seconds", generator: "reliability-year-seconds", grader: "reliability-number", active: true },
  { id: "reliability-availability-to-downtime", generator: "reliability-availability-to-downtime", grader: "reliability-number", active: true },
  { id: "reliability-downtime-to-availability", generator: "reliability-downtime-to-availability", grader: "reliability-number", active: true },
];

function indexFor(seed: number): number {
  return Math.abs(seed) % availabilityLevels.length;
}

export const reliabilityGenerators: Record<string, ReliabilityGenerator> = {
  "reliability-year-hours"(seed) {
    return {
      seed,
      prompt: "How many hours are in a common non-leap year of 365 days?",
      expectedAnswer: "8760",
      feedback: "365 days × 24 hours/day = 8,760 hours.",
    };
  },
  "reliability-year-minutes"(seed) {
    return {
      seed,
      prompt: "How many minutes are in a common non-leap year of 365 days?",
      expectedAnswer: "525600",
      feedback: "365 days × 24 hours/day × 60 minutes/hour = 525,600 minutes.",
    };
  },
  "reliability-year-seconds"(seed) {
    return {
      seed,
      prompt: "How many seconds are in a common non-leap year of 365 days?",
      expectedAnswer: "31536000",
      feedback: "365 days × 24 hours/day × 60 minutes/hour × 60 seconds/minute = 31,536,000 seconds.",
    };
  },
  "reliability-availability-to-downtime"(seed) {
    const index = indexFor(seed);
    const availability = availabilityLevels[index]!;
    const downtimeMinutes = minutesPerCommonYear * (1 - availability / 100);
    const expectedAnswer = String(Number(downtimeMinutes.toFixed(6)));
    return {
      seed,
      prompt: `Estimate first, then calculate: ${availability}% availability over a common non-leap year of 365 days allows how many minutes of downtime?`,
      expectedAnswer,
      feedback: `(1 − ${(availability / 100).toFixed(index + 2)}) × 525,600 = ${expectedAnswer} minutes. The result is a time-based downtime budget for this stated one-year accounting window.`,
    };
  },
  "reliability-downtime-to-availability"(seed) {
    const index = indexFor(seed);
    const availability = availabilityLevels[index]!;
    const downtimeMinutes = Number((minutesPerCommonYear * (1 - availability / 100)).toFixed(6));
    return {
      seed,
      prompt: `Estimate first, then calculate: ${downtimeMinutes} minutes of downtime in a common non-leap year of 365 days equals what availability percentage?`,
      expectedAnswer: String(availability),
      feedback: `(1 − ${downtimeMinutes} ÷ 525,600) × 100 = ${availability}%, commonly called ${ninesNames[index]}. The label only has meaning with the accounting window and measurement rule stated.`,
    };
  },
};

export const reliabilityGraders: Record<string, (response: string, expected: string) => boolean> = {
  "reliability-number": (response, expected) => {
    const value = response.trim().replaceAll(",", "");
    return /^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(value) && Number(value) === Number(expected);
  },
};

const accessedAt = "accessed 2026-08-27";
const availabilityReference = {
  label: `Google Cloud, SRE at Google: What is availability?, ${accessedAt}`,
  url: "https://cloud.google.com/blog/products/gcp/available-or-not-that-is-the-question-cre-life-lessons",
};

export const reliabilityItems: StaticItem[] = [
  {
    id: "reliability-extra-nine",
    kind: "flashcard",
    topic: "Reliability",
    prompt: "What does one additional nine do to allowed downtime over the same accounting window and time-based availability definition?",
    choices: [
      "It divides unavailability and the downtime budget by 10",
      "It subtracts exactly one minute from the downtime budget",
      "It doubles the downtime budget",
      "It changes durability, not availability",
    ],
    correctChoice: "It divides unavailability and the downtime budget by 10",
    answer: "One additional nine divides unavailability by a factor of 10, so it also divides the allowed downtime budget by a factor of 10 over the same accounting window. For example, 99.9% has 0.1% unavailability, while 99.99% has 0.01%. Always state the window and measurement rule: a calendar year, a 30-day month, and request-based availability produce different budgets.",
    references: [availabilityReference],
  },
];
