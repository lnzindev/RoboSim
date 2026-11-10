import { describe, expect, it } from 'vitest'
import { practiceArena } from './arena'
import { readDistanceMm, readSensorSnapshot } from './sensors'
import { createInitialRobot } from './physics'
import { spikePrimePreset } from '../robot/presets'

describe('virtual sensors', () => {
  it('returns a finite distance reading inside the field', () => {
    const distance = readDistanceMm(createInitialRobot(), practiceArena)
    expect(distance).toBeGreaterThan(0)
    expect(distance).toBeLessThanOrEqual(2000)
  })

  it('returns heading, color and force values in a stable snapshot', () => {
    const snapshot = readSensorSnapshot(createInitialRobot(), spikePrimePreset, practiceArena)
    expect(snapshot.headingDeg).toBe(0)
    expect(snapshot.color).toBe('BLACK')
    expect(snapshot.forcePressed).toBe(false)
  })
})