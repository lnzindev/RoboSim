import type { ArenaDefinition, RobotConfig, RobotState } from './types'

export const FIXED_STEP_SECONDS = 1 / 60
export const ROBOT_RADIUS_METERS = 0.14

export function createInitialRobot(): RobotState {
  return {
    x: 0.42,
    z: 0.42,
    heading: 0,
    leftSpeedMmS: 0,
    rightSpeedMmS: 0,
    collisionCount: 0,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function overlapsObstacle(x: number, z: number, radius: number, obstacle: ArenaDefinition['obstacles'][number]): boolean {
  const nearestX = clamp(x, obstacle.x - obstacle.width / 2, obstacle.x + obstacle.width / 2)
  const nearestZ = clamp(z, obstacle.z - obstacle.depth / 2, obstacle.z + obstacle.depth / 2)
  const dx = x - nearestX
  const dz = z - nearestZ
  return dx * dx + dz * dz < radius * radius
}

export function stepRobot(
  state: RobotState,
  config: RobotConfig,
  arena: ArenaDefinition,
  deltaSeconds: number,
): RobotState {
  const dt = clamp(deltaSeconds, 0, 0.05)
  const linearMetersPerSecond = (state.leftSpeedMmS + state.rightSpeedMmS) / 2000
  const angularRadiansPerSecond = (state.rightSpeedMmS - state.leftSpeedMmS) / Math.max(config.axleTrackMm, 1)
  const heading = state.heading + angularRadiansPerSecond * dt
  const candidateX = state.x + Math.sin(heading) * linearMetersPerSecond * dt
  const candidateZ = state.z + Math.cos(heading) * linearMetersPerSecond * dt
  const minX = ROBOT_RADIUS_METERS
  const maxX = arena.width - ROBOT_RADIUS_METERS
  const minZ = ROBOT_RADIUS_METERS
  const maxZ = arena.depth - ROBOT_RADIUS_METERS
  const hitWall = candidateX < minX || candidateX > maxX || candidateZ < minZ || candidateZ > maxZ
  const hitObstacle = arena.obstacles.some((obstacle) =>
    overlapsObstacle(candidateX, candidateZ, ROBOT_RADIUS_METERS, obstacle),
  )

  if (hitWall || hitObstacle) {
    return {
      ...state,
      leftSpeedMmS: 0,
      rightSpeedMmS: 0,
      collisionCount: state.collisionCount + 1,
    }
  }

  return {
    ...state,
    x: candidateX,
    z: candidateZ,
    heading,
  }
}

export function setDriveSpeeds(state: RobotState, leftMmS: number, rightMmS: number, config: RobotConfig): RobotState {
  const limit = Math.max(0, config.maxSpeedMmS)
  return {
    ...state,
    leftSpeedMmS: clamp(leftMmS, -limit, limit),
    rightSpeedMmS: clamp(rightMmS, -limit, limit),
  }
}

export function stopRobot(state: RobotState): RobotState {
  return { ...state, leftSpeedMmS: 0, rightSpeedMmS: 0 }
}

export function distanceBetween(a: { x: number; z: number }, b: { x: number; z: number }): number {
  return Math.hypot(a.x - b.x, a.z - b.z)
}