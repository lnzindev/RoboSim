import { describe, expect, it } from 'vitest'
import { practiceArena } from './arena'
import { readDistanceMm, readSensorSnapshot } from './sensors'
import { createInitialRobot } from './physics'
import type { SensorMount } from './types'

describe('virtual sensors', () => {
  it('returns a finite distance reading inside the field', () => {
    const distance = readDistanceMm(createInitialRobot(), practiceArena)
    expect(distance).toBeGreaterThan(0)
    expect(distance).toBeLessThanOrEqual(2000)
  })

  it('reads the surface from the configured sensor mount position', () => {
    const state = { ...createInitialRobot(), x: 0.58, z: 0.8 }
    const mount: SensorMount = {
      id: 'color-test',
      kind: 'color',
      port: 'A',
      xMm: 0,
      zMm: 120,
      rotationDeg: 0,
    }
    const snapshot = readSensorSnapshot(state, practiceArena, mount)
    expect(snapshot.color).toBe('GREEN')
    expect(snapshot.reflection).toBe(42)
  })

  it('measures obstacle distance from the mounted ultrasonic sensor', () => {
    const state = { ...createInitialRobot(), x: 0.92, z: 0.8 }
    const mount: SensorMount = {
      id: 'distance-test',
      kind: 'distance',
      port: 'D',
      xMm: 0,
      zMm: 100,
      rotationDeg: 0,
    }
    const snapshot = readSensorSnapshot(state, practiceArena, mount)
    expect(snapshot.distanceMm).toBeGreaterThan(0)
    expect(snapshot.distanceMm).toBeLessThan(200)
  })

  it('returns heading, color and force values in a stable snapshot', () => {
    const snapshot = readSensorSnapshot(createInitialRobot(), practiceArena)
    expect(snapshot.headingDeg).toBe(0)
    expect(snapshot.color).toBe('BLACK')
    expect(snapshot.forcePressed).toBe(false)
  })
})