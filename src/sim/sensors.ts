import type { RobotState } from './robot'
export type Obstacle = { x: number; z: number; width: number; depth: number; color: string }
export const arenaObstacles: Obstacle[] = [
  { x: -0.92, z: -0.88, width: 0.42, depth: 0.34, color: '#e3a53b' },
  { x: 0.92, z: -0.85, width: 0.3, depth: 0.3, color: '#477cce' },
]
export function distanceSensor(state: RobotState, obstacles = arenaObstacles, maxRange = 2): number {
  const dx = -Math.sin(state.heading), dz = -Math.cos(state.heading)
  const originX = state.x + dx * 0.18, originZ = state.z + dz * 0.18
  for (let d = 0.04; d <= maxRange; d += 0.02) {
    const x = originX + dx * d, z = originZ + dz * d
    if (Math.abs(x) > 1.45 || Math.abs(z) > 1.45) return Number(d.toFixed(2))
    if (obstacles.some(o => Math.abs(x-o.x) <= o.width/2 && Math.abs(z-o.z) <= o.depth/2)) return Number(d.toFixed(2))
  }
  return Number(maxRange.toFixed(2))
}
export function colorSensor(state: RobotState, obstacles = arenaObstacles): string {
  const x = state.x - Math.sin(state.heading)*0.18
  const z = state.z - Math.cos(state.heading)*0.18
  return obstacles.find(o => Math.abs(x-o.x) <= o.width/2 && Math.abs(z-o.z) <= o.depth/2)?.color ?? '#182b31'
}
export function headingSensor(state: RobotState): number { return ((state.heading*180/Math.PI)%360+360)%360 }

export function gyroSensor(state: RobotState, trackWidth = 0.12): number {
  const angularRate = ((state.rightSpeed-state.leftSpeed)/100) / Math.max(trackWidth,0.01)
  return Number((angularRate*180/Math.PI).toFixed(1))
}
