import { describe, expect, it } from 'vitest'
import {
  calculateDriveSpeeds,
  calculateStraightDurationMs,
  calculateTurnDurationMs,
  motorSpeedToLinearMmS,
} from './drivebase'

describe('differential drivebase calculations', () => {
  it('uses equal wheel speeds for straight movement', () => {
    expect(calculateDriveSpeeds(300, 0, 120)).toEqual({ leftMmS: 300, rightMmS: 300 })
  })

  it('uses opposite wheel directions for an in-place turn', () => {
    const speeds = calculateDriveSpeeds(0, 90, 120)
    expect(speeds.leftMmS).toBeLessThan(0)
    expect(speeds.rightMmS).toBeGreaterThan(0)
    expect(Math.abs(speeds.leftMmS)).toBeCloseTo(Math.abs(speeds.rightMmS))
  })

  it('calculates movement durations in milliseconds', () => {
    expect(calculateStraightDurationMs(500, 250)).toBe(2000)
    expect(calculateTurnDurationMs(90, 90)).toBe(1000)
  })

  it('converts motor angular speed to wheel linear speed', () => {
    expect(motorSpeedToLinearMmS(360, 56)).toBeCloseTo(Math.PI * 56)
  })
})
