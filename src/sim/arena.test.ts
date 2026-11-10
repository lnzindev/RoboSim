import { describe, expect, it } from 'vitest'
import { practiceArena } from './arena'
import { spikePrimePreset } from '../robot/presets'

function isClearFromObstacles(x: number, z: number): boolean {
  const radius = Math.max(0.14, Math.hypot(spikePrimePreset.chassisWidthMm, spikePrimePreset.chassisLengthMm) / 2000)
  return practiceArena.obstacles.every((obstacle) => {
    const nearestX = Math.max(obstacle.x - obstacle.width / 2, Math.min(x, obstacle.x + obstacle.width / 2))
    const nearestZ = Math.max(obstacle.z - obstacle.depth / 2, Math.min(z, obstacle.z + obstacle.depth / 2))
    return Math.hypot(x - nearestX, z - nearestZ) >= radius
  })
}

describe('practice arena geometry', () => {
  it('keeps every demonstration target reachable without starting inside an obstacle', () => {
    for (const target of practiceArena.targets) {
      expect(isClearFromObstacles(target.x, target.z)).toBe(true)
    }
  })

  it('keeps its starting pose inside field boundaries', () => {
    const radius = Math.hypot(spikePrimePreset.chassisWidthMm, spikePrimePreset.chassisLengthMm) / 2000
    expect(0.42).toBeGreaterThan(radius)
    expect(0.42).toBeLessThan(practiceArena.width - radius)
    expect(0.42).toBeLessThan(practiceArena.depth - radius)
  })
})
