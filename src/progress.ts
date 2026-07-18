import { commandConcepts, commandExerciseId, type CommandExerciseMode, type CommandName } from "./content.js";
import type { ReviewState } from "./store.js";

export type MasteryStatus = "unseen" | "learning" | "established";
export type CommandProgress = {
  command: CommandName;
  concepts: Array<{
    id: string;
    label: string;
    platform: string;
    modes: Record<CommandExerciseMode, MasteryStatus>;
  }>;
};

function status(state: ReviewState | undefined): MasteryStatus {
  if (!state) return "unseen";
  return state.successfulReviews >= 2 && state.interval >= 4 ? "established" : "learning";
}

export function buildCommandProgress(states: ReviewState[]): CommandProgress[] {
  const byStableId = new Map(states.map((state) => [state.stableId, state]));
  const byCommand = new Map<CommandName, CommandProgress>();
  for (const concept of commandConcepts) {
    let command = byCommand.get(concept.command);
    if (!command) {
      command = { command: concept.command, concepts: [] };
      byCommand.set(concept.command, command);
    }
    command.concepts.push({
      id: concept.concept,
      label: concept.label,
      platform: concept.platform,
      modes: {
        definition: status(byStableId.get(commandExerciseId(concept.command, concept.concept, "definition"))),
        read: status(byStableId.get(commandExerciseId(concept.command, concept.concept, "read"))),
        write: status(byStableId.get(commandExerciseId(concept.command, concept.concept, "write"))),
      },
    });
  }
  return [...byCommand.values()];
}
