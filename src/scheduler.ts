import { contentBank, generatedDefinitions } from "./content.js";
import type { ReviewState } from "./store.js";

export function chooseStableId(position: number, states: ReviewState[], now: Date): string {
  const due = states
    .filter((state) => Date.parse(state.dueAt) <= now.getTime())
    .sort((left, right) => left.dueAt.localeCompare(right.dueAt))[0];
  if (due) return due.stableId;
  if (position % 2 === 0) return generatedDefinitions[position % generatedDefinitions.length]!.id;
  return contentBank[Math.floor(position / 2) % contentBank.length]!.id;
}
