import { activeGeneratedDefinitions, contentBank } from "./content.js";
import type { ReviewState } from "./store.js";

export function chooseStableId(position: number, states: ReviewState[], now: Date): string {
  const activeIds = new Set([
    ...contentBank.map((item) => item.id),
    ...activeGeneratedDefinitions.map((definition) => definition.id),
  ]);
  const due = states
    .filter((state) => activeIds.has(state.stableId) && Date.parse(state.dueAt) <= now.getTime())
    .sort((left, right) => left.dueAt.localeCompare(right.dueAt))[0];
  if (due) return due.stableId;
  if (position % 2 === 0) return activeGeneratedDefinitions[Math.floor(position / 2) % activeGeneratedDefinitions.length]!.id;
  return contentBank[Math.floor(position / 2) % contentBank.length]!.id;
}
