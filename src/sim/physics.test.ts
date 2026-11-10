import { describe, expect, it } from 'vitest'
import { practiceArena } from './arena'
import { createInitialRobot, setDriveSpeeds, stepRobot } from './physics'
import { spikePrimePreset } from '../robot/presets'

describe('simulation physics', () => {
  it('moves forward when both wheels have equal positive speed', () => {
    const initial = createInitialRobot()
    const moving = setDriveSpeeds(initial, 300, 300, spikePrimePreset)
    const next = stepRobot(moving, spikePrimePreset, practiceArena, 1 / 60)
    expect(next.z).toBeGreaterThan(initial.z)
    expect(next.x).toBeCloseTo(initial.x)
  })

  it('rotates when wheel speeds differ', () => {
    const initial = createInitialRobot()
    const moving = setDriveSpeeds(initial, -150, 150, spikePrimePreset)
    const next = stepRobot(moving, spikePrimePreset, practiceArena, 1 / 60)
    expect(next.heading).toBeGreaterThan(0)
  })

  it('stops the robot and records a collision at the field boundary', () => {
    const initial = { ...createInitialRobot(), x: 1.5, z: 2.85 }
    const moving = setDriveSpeeds(initial, 500, 500, spikePrimePreset)
    const next = stepRobot(moving, spikePrimePreset, practiceArena, 1 / 30)
    expect(next.collisionCount).toBe(1)
    expect(next.leftSpeedMmS).toBe(0)
  })

  it('detects collisions against mission obstacles', () => {
    const initial = { ...createInitialRobot(), x: 0.92, z: 1.03 }
    const moving = setDriveSpeeds(initial, 500, 500, spikePrimePreset)
    const next = stepRobot(moving, spikePrimePreset, practiceArena, 1 / 60)
    expect(next.collisionCount).toBe(1)
    expect(next.rightSpeedMmS).toBe(0)
  })
})