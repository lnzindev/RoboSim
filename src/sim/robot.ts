export type RobotState = { x: number; z: number; heading: number; leftSpeed: number; rightSpeed: number }
export const initialRobot: RobotState = { x: 0, z: 1.15, heading: 0, leftSpeed: 0, rightSpeed: 0 }

export function stepRobot(state: RobotState, dt: number): RobotState {
  const left = state.leftSpeed / 100
  const right = state.rightSpeed / 100
  const linear = (left + right) * 0.5
  const angular = (right - left) * 0.72
  const heading = state.heading + angular * dt
  return {
    ...state,
    heading,
    x: Math.max(-1.32, Math.min(1.32, state.x + Math.sin(heading) * linear * dt)),
    z: Math.max(-1.32, Math.min(1.32, state.z + Math.cos(heading) * linear * dt)),
  }
}

export function interpretStarterCode(source: string): string[] {
  const lines = source.split(/\r?\n/)
  const commands: string[] = []
  for (const line of lines) {
    const move = line.match(/wait\s*\(\s*(\d+)\s*\)/)
    const drive = line.match(/drive\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/)
    const stop = line.match(/stop\s*\(/)
    if (drive) commands.push(`drive:${drive[1]}:${drive[2]}`)
    else if (stop) commands.push('stop')
    else if (move) commands.push(`wait:${move[1]}`)
  }
  return commands
}