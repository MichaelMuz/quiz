import type { GeneratedDefinition, GeneratedQuestion, StaticItem } from "./content.js";

type BaseGenerator = (seed: number) => Omit<GeneratedQuestion, "stableId" | "grader">;

export const baseConversionDefinitions: GeneratedDefinition[] = [
  { id: "base-binary-to-decimal", generator: "base-binary-to-decimal", grader: "base-decimal", active: true },
  { id: "base-decimal-to-binary", generator: "base-decimal-to-binary", grader: "base-binary-8", active: true },
  { id: "base-decimal-to-hex", generator: "base-decimal-to-hex", grader: "base-hex", active: true },
  { id: "base-hex-to-decimal", generator: "base-hex-to-decimal", grader: "base-decimal", active: true },
  { id: "base-binary-to-hex", generator: "base-binary-to-hex", grader: "base-hex", active: true },
  { id: "base-hex-to-binary", generator: "base-hex-to-binary", grader: "base-binary-8", active: true },
];

const boundaryValues = [256, 257, 511, 512, 1023, 4095, 4096, 65535] as const;

function seededFraction(seed: number): number {
  const state = (Math.imul(seed >>> 0, 1664525) + 1013904223) >>> 0;
  return state / 0x100000000;
}

function byteValue(seed: number): number {
  return Math.floor(seededFraction(seed) * 256);
}

function practiceValue(seed: number): number {
  const value = seededFraction(seed);
  return seed % 5 === 0
    ? boundaryValues[Math.floor(value * boundaryValues.length)]!
    : Math.floor(value * 256);
}

export const baseConversionGenerators: Record<string, BaseGenerator> = {
  "base-binary-to-decimal"(seed) {
    const value = practiceValue(seed);
    return { seed, prompt: `Convert ${value.toString(2)} from base 2 to base 10.`, expectedAnswer: String(value) };
  },
  "base-decimal-to-binary"(seed) {
    const value = byteValue(seed);
    return {
      seed,
      prompt: `Convert ${value} from base 10 to base 2. Give exactly 8 bits.`,
      expectedAnswer: value.toString(2).padStart(8, "0"),
    };
  },
  "base-decimal-to-hex"(seed) {
    const value = practiceValue(seed);
    return { seed, prompt: `Convert ${value} from base 10 to base 16.`, expectedAnswer: value.toString(16) };
  },
  "base-hex-to-decimal"(seed) {
    const value = practiceValue(seed);
    return { seed, prompt: `Convert ${value.toString(16)} from base 16 to base 10.`, expectedAnswer: String(value) };
  },
  "base-binary-to-hex"(seed) {
    const value = practiceValue(seed);
    return { seed, prompt: `Convert ${value.toString(2)} from base 2 to base 16.`, expectedAnswer: value.toString(16) };
  },
  "base-hex-to-binary"(seed) {
    const value = byteValue(seed);
    return {
      seed,
      prompt: `Convert ${value.toString(16)} from base 16 to base 2. Give exactly 8 bits.`,
      expectedAnswer: value.toString(2).padStart(8, "0"),
    };
  },
};

export const baseConversionGraders: Record<string, (response: string, expected: string) => boolean> = {
  "base-decimal": (response, expected) => /^\d+$/.test(response.trim())
    && BigInt(response.trim()) === BigInt(expected),
  "base-binary-8": (response, expected) => /^(?:0b)?[01]{8}$/i.test(response.trim())
    && response.trim().replace(/^0b/i, "") === expected,
  "base-hex": (response, expected) => {
    const value = response.trim().replace(/^0x/i, "");
    return /^[0-9a-f]+$/i.test(value) && BigInt(`0x${value}`) === BigInt(`0x${expected}`);
  },
};

const positionalNotationSource = {
  label: "OpenStax, Converting with Base Systems, accessed 2026-08-08",
  url: "https://openstax.org/books/contemporary-mathematics/pages/4-3-converting-with-base-systems",
} as const;

export const baseConversionMethodItems: StaticItem[] = [
  {
    id: "base-method-place-value",
    kind: "flashcard",
    topic: "Number representation",
    prompt: "How do you convert a binary or hexadecimal numeral to decimal by hand?",
    answer: "Expand each digit by its place value and add. For example, 101101 in base 2 is 1×2^5 + 0×2^4 + 1×2^3 + 1×2^2 + 0×2^1 + 1×2^0 = 45. Likewise, 2D in base 16 is 2×16 + 13 = 45.",
    references: [positionalNotationSource],
  },
  {
    id: "base-method-repeated-division",
    kind: "flashcard",
    topic: "Number representation",
    prompt: "How do you convert a nonnegative decimal integer to binary or hexadecimal by hand?",
    answer: "Repeatedly divide by the target base, record each remainder, then read the remainders from last to first. For 45 in base 2, the reversed remainders give 101101. For 45 in base 16, the remainders are 13 (D) then 2, giving 2D. Zero is represented as 0 rather than an empty remainder list.",
    references: [positionalNotationSource],
  },
  {
    id: "base-method-nibble-grouping",
    kind: "flashcard",
    topic: "Number representation",
    prompt: "What is the fast exact bridge between binary and hexadecimal?",
    answer: "One hexadecimal digit represents exactly four binary bits, a nibble. From the right, group binary digits in fours and left-pad only the leading group when needed: 101101 becomes 0010 1101, then 2D. In the other direction, expand every hex digit to four bits: 2D becomes 0010 1101.",
    references: [positionalNotationSource],
  },
  {
    id: "base-method-notation-and-width",
    kind: "flashcard",
    topic: "Number representation",
    prompt: "When do prefixes, letter case, and leading zeros change a base-conversion answer?",
    answer: "In these drills, 0b and 0x are optional notation prefixes, hex letters are case-insensitive, and harmless leading zeros do not change a value. A fixed-width prompt is different: give exactly the requested number of binary digits, excluding an optional 0b prefix. Digits outside the target base are always invalid.",
    references: [positionalNotationSource],
  },
];
