import type { GeneratedDefinition, GeneratedQuestion, StaticItem } from "./content.js";

type ReliabilityGenerator = (seed: number) => Omit<GeneratedQuestion, "stableId" | "grader">;

const availabilityCases = [
  { availability: "90", downtime: "36.5", unit: "days", period: "365", nines: "one nine" },
  { availability: "99", downtime: "87.6", unit: "hours", period: "8,760", nines: "two nines" },
  { availability: "99.9", downtime: "8.76", unit: "hours", period: "8,760", nines: "three nines" },
  { availability: "99.99", downtime: "52.56", unit: "minutes", period: "525,600", nines: "four nines" },
  { availability: "99.999", downtime: "5.256", unit: "minutes", period: "525,600", nines: "five nines" },
  { availability: "99.9999", downtime: "31.536", unit: "seconds", period: "31,536,000", nines: "six nines" },
] as const;

export const reliabilityGeneratedDefinitions: GeneratedDefinition[] = [
  { id: "reliability-year-hours", generator: "reliability-year-hours", grader: "reliability-number", active: true },
  { id: "reliability-year-minutes", generator: "reliability-year-minutes", grader: "reliability-number", active: true },
  { id: "reliability-year-seconds", generator: "reliability-year-seconds", grader: "reliability-number", active: true },
  { id: "reliability-availability-to-downtime", generator: "reliability-availability-to-downtime", grader: "reliability-number", active: true },
  { id: "reliability-downtime-to-availability", generator: "reliability-downtime-to-availability", grader: "integer", active: true },
];

function indexFor(seed: number): number {
  return Math.abs(seed) % availabilityCases.length;
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
    const current = availabilityCases[index]!;
    return {
      seed,
      prompt: `Estimate first, then calculate: ${current.availability}% availability over a common non-leap year of 365 days allows how many ${current.unit} of downtime? Answers within ±0.5% are accepted.`,
      expectedAnswer: current.downtime,
      feedback: `(1 − ${Number(current.availability) / 100}) × ${current.period} = ${current.downtime} ${current.unit}. The result is a time-based downtime budget for this stated one-year accounting window; leap years and provider-defined monthly SLA windows change the exact value.`,
    };
  },
  "reliability-downtime-to-availability"(seed) {
    const index = indexFor(seed);
    const current = availabilityCases[index]!;
    return {
      seed,
      prompt: `Estimate first: ${current.downtime} ${current.unit} of downtime in a common non-leap year of 365 days is approximately how many consecutive nines of availability? Enter the number of nines.`,
      expectedAnswer: String(index + 1),
      feedback: `(1 − ${current.downtime} ÷ ${current.period}) × 100 = ${current.availability}%, commonly called ${current.nines}. The label only has meaning with the accounting window and measurement rule stated.`,
    };
  },
};

export const reliabilityGraders: Record<string, (response: string, expected: string) => boolean> = {
  "reliability-number": (response, expected) => {
    const value = response.trim();
    if (!/^[-+]?(?:(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d*)?|\.\d+)$/.test(value)) return false;
    const answer = Number(value.replaceAll(",", ""));
    const target = Number(expected);
    if (!expected.includes(".")) return answer === target;
    const tolerance = Math.abs(target) * 0.005;
    const floatingPointSlack = Number.EPSILON * Math.max(1, Math.abs(answer), Math.abs(target));
    return Math.abs(answer - target) <= tolerance + floatingPointSlack;
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
    prompt: "What does one additional nine do to allowed downtime over the same common non-leap year of 365 days and time-based availability definition?",
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
