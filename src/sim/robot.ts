export type RobotState = { x: number; z: number; heading: number; leftSpeed: number; rightSpeed: number }
export type CollisionBox = { x: number; z: number; width: number; depth: number }
export const initialRobot: RobotState = { x: 0, z: 1.15, heading: 0, leftSpeed: 0, rightSpeed: 0 }

export function stepRobot(
  state: RobotState,
  dt: number,
  obstacles: CollisionBox[] = [],
  trackWidth = 0.12,
  robotHalfWidth = Math.max(trackWidth / 2 + 0.0175, Math.max(0.2, trackWidth + 0.08) / 2),
  robotHalfLength = 0.22,
): RobotState {
  const left = clampMotorSpeed(state.leftSpeed) / 100
  const right = clampMotorSpeed(state.rightSpeed) / 100
  const linear = (left + right) * 0.5
  const angular = (right - left) / Math.max(trackWidth, 0.01)
  const heading = state.heading + angular * dt
  const limitX = 1.46 - robotHalfWidth
  const limitZ = 1.46 - robotHalfLength
  const rawX = state.x - Math.sin(heading) * linear * dt
  const rawZ = state.z - Math.cos(heading) * linear * dt
  const boundaryHit = rawX < -limitX || rawX > limitX || rawZ < -limitZ || rawZ > limitZ
  const nextX = Math.max(-limitX, Math.min(limitX, rawX))
  const nextZ = Math.max(-limitZ, Math.min(limitZ, rawZ))
  const collides = boundaryHit || obstacles.some(obstacle =>
    Math.abs(nextX - obstacle.x) < robotHalfWidth + obstacle.width / 2 &&
    Math.abs(nextZ - obstacle.z) < robotHalfLength + obstacle.depth / 2
  )
  if (collides) return { ...state, x: nextX, z: nextZ, heading, leftSpeed: 0, rightSpeed: 0 }
  return { ...state, x: nextX, z: nextZ, heading }
}

export function clampMotorSpeed(speed: number): number {
  return Number.isFinite(speed) ? Math.max(-100, Math.min(100, speed)) : 0
}

export function differentialDrive(speed: number, turnRate: number, trackWidth = 120): [number, number] {
  const half = turnRate * trackWidth * Math.PI / 360
  return [clampMotorSpeed((speed - half) / 10), clampMotorSpeed((speed + half) / 10)]
}
