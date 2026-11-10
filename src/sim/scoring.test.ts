import { describe, expect, it } from 'vitest'
import { practiceArena } from './arena'
import { createInitialRobot } from './physics'
import { calculateScore, collectMissionEvents } from './scoring'

describe('mission scoring', () => {
  it('awards points once when the robot enters a target zone', () => {
    const state = { ...createInitialRobot(), x: 0.58, z: 1 }
    const events = collectMissionEvents(state, practiceArena, new Set())
    expect(events.map((event) => event.id)).toContain('target-green')
    expect(calculateScore(events)).toBe(10)
    expect(collectMissionEvents(state, practiceArena, new Set(events.map((event) => event.id)))).toHaveLength(0)
  })
})
