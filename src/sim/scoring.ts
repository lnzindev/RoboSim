import type { ArenaDefinition, RobotState } from './types'

export type MissionEvent = { id: string; label: string; points: number }

export function collectMissionEvents(
  state: RobotState,
  arena: ArenaDefinition,
  alreadyCompleted: ReadonlySet<string>,
): MissionEvent[] {
  return arena.targets
    .filter((target) =>
      !alreadyCompleted.has(target.id) &&
      Math.hypot(state.x - target.x, state.z - target.z) <= target.radius,
    )
    .map((target) => ({ id: target.id, label: target.label, points: target.points }))
}

export function calculateScore(events: readonly MissionEvent[]): number {
  return events.reduce((total, event) => total + event.points, 0)
}