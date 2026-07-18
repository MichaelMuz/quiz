import { activeGeneratedDefinitions, commandExerciseId, contentBank, type StaticItem } from "./content.js";
import type { ReviewState } from "./store.js";

function isUnlocked(item: StaticItem, reviewedIds: Set<string>): boolean {
  if (!item.command || item.command.mode === "definition") return true;
  const prerequisite = item.command.mode === "read" ? "definition" : "read";
  return reviewedIds.has(commandExerciseId(item.command.command, item.command.concept, prerequisite));
}

export function chooseStableId(position: number, states: ReviewState[], now: Date): string {
  const reviewedIds = new Set(states.filter((state) => state.reviews > 0).map((state) => state.stableId));
  const staticItems = contentBank.filter((item) => isUnlocked(item, reviewedIds));
  const activeIds = new Set([
    ...staticItems.map((item) => item.id),
    ...activeGeneratedDefinitions.map((definition) => definition.id),
  ]);
  const due = states
    .filter((state) => activeIds.has(state.stableId) && Date.parse(state.dueAt) <= now.getTime())
    .sort((left, right) => left.dueAt.localeCompare(right.dueAt))[0];
  if (due) return due.stableId;
  if (position % 2 === 0) return activeGeneratedDefinitions[Math.floor(position / 2) % activeGeneratedDefinitions.length]!.id;
  return staticItems[Math.floor(position / 2) % staticItems.length]!.id;
}
