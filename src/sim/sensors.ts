import type { ArenaDefinition, RobotState, SensorMount, SensorSnapshot } from './types'

function rayRectDistance(
  ox: number,
  oz: number,
  dx: number,
  dz: number,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
): number | null {
  let near = 0
  let far = Number.POSITIVE_INFINITY
  for (const [origin, direction, min, max] of [
    [ox, dx, minX, maxX],
    [oz, dz, minZ, maxZ],
  ]) {
    if (Math.abs(direction) < 1e-9) {
      if (origin < min || origin > max) return null
      continue
    }
    let t1 = (min - origin) / direction
    let t2 = (max - origin) / direction
    if (t1 > t2) [t1, t2] = [t2, t1]
    near = Math.max(near, t1)
    far = Math.min(far, t2)
    if (near > far) return null
  }
  return far >= 0 ? Math.max(0, near) : null
}

export function readDistanceMm(
  state: RobotState,
  arena: ArenaDefinition,
  maxDistanceMm = 2000,
  origin = { x: state.x, z: state.z },
  heading = state.heading,
): number {
  const dx = Math.sin(heading)
  const dz = Math.cos(heading)
  const boundaryDistances: number[] = []
  if (dx > 1e-9) boundaryDistances.push((arena.width - origin.x) / dx)
  if (dx < -1e-9) boundaryDistances.push((0 - origin.x) / dx)
  if (dz > 1e-9) boundaryDistances.push((arena.depth - origin.z) / dz)
  if (dz < -1e-9) boundaryDistances.push((0 - origin.z) / dz)
  const distances = boundaryDistances.filter((distance) => distance >= 0)
  for (const obstacle of arena.obstacles) {
    const hit = rayRectDistance(
      origin.x, origin.z, dx, dz,
      obstacle.x - obstacle.width / 2,
      obstacle.x + obstacle.width / 2,
      obstacle.z - obstacle.depth / 2,
      obstacle.z + obstacle.depth / 2,
    )
    if (hit !== null) distances.push(hit)
  }
  const nearest = distances.length ? Math.min(...distances) : maxDistanceMm / 1000
  return Math.max(0, Math.min(maxDistanceMm, nearest * 1000))
}

export function readSensorSnapshot(
  state: RobotState,
  arena: ArenaDefinition,
  mount?: SensorMount,
): SensorSnapshot {
  const localX = (mount?.xMm ?? 0) / 1000
  const localZ = (mount?.zMm ?? 120) / 1000
  const cos = Math.cos(state.heading)
  const sin = Math.sin(state.heading)
  const origin = {
    x: state.x + localX * cos + localZ * sin,
    z: state.z - localX * sin + localZ * cos,
  }
  const sensorHeading = state.heading + (mount?.rotationDeg ?? 0) * Math.PI / 180
  const target = arena.targets.find((item) =>
    Math.hypot(origin.x - item.x, origin.z - item.z) <= item.radius,
  )
  const color = target?.id.includes('green')
    ? 'GREEN'
    : target?.id.includes('yellow')
      ? 'YELLOW'
      : target?.id.includes('blue')
        ? 'BLUE'
        : 'BLACK'
  const reflection = color === 'BLACK' ? 8 : color === 'GREEN' ? 42 : color === 'YELLOW' ? 75 : 55
  const headingDeg = ((sensorHeading * 180 / Math.PI) % 360 + 360) % 360
  return {
    distanceMm: readDistanceMm(state, arena, 2000, origin, sensorHeading),
    color,
    reflection,
    headingDeg,
    forcePressed: state.collisionCount > 0,
    forceN: state.collisionCount > 0 ? 1.2 : 0,
  }
}
