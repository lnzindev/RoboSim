export type Vec2 = { x: number; z: number }

export type Obstacle = {
  id: string
  x: number
  z: number
  width: number
  depth: number
  height: number
  color: string
}

export type MissionTarget = {
  id: string
  label: string
  x: number
  z: number
  radius: number
  points: number
  color: string
}

export type MissionInfo = {
  id: string
  name: string
  description: string
}

export type LaunchZone = {
  id: string
  x: number
  z: number
  radius: number
  startAngle: number
  color: string
}

export type ArenaDefinition = {
  id: string
  name: string
  width: number
  depth: number
  official: boolean
  seasonLabel?: string
  layoutNote?: string
  cellSize?: number
  launchZones?: LaunchZone[]
  missions?: MissionInfo[]
  obstacles: Obstacle[]
  targets: MissionTarget[]
}

export type SensorMount = {
  id: string
  kind: 'color' | 'distance' | 'force'
  port: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  xMm: number
  zMm: number
  rotationDeg: number
}

export type RobotConfig = {
  chassisWidthMm: number
  chassisLengthMm: number
  sensorMounts: SensorMount[]
  wheelDiameterMm: number
  axleTrackMm: number
  maxSpeedMmS: number
  leftMotorPort: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  rightMotorPort: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
}

export type RobotState = {
  x: number
  z: number
  heading: number
  leftSpeedMmS: number
  rightSpeedMmS: number
  collisionCount: number
}

export type SimulationCommand =
  | { type: 'drive'; leftMmS: number; rightMmS: number }
  | { type: 'wait'; durationMs: number }
  | { type: 'stop' }
  | { type: 'motor'; port: string; speedDegS: number }
  | { type: 'motorTimed'; port: string; speedDegS: number; durationMs: number }

export type SensorSnapshot = {
  distanceMm: number
  color: 'BLACK' | 'WHITE' | 'RED' | 'GREEN' | 'BLUE' | 'YELLOW'
  reflection: number
  headingDeg: number
  forcePressed: boolean
  forceN: number
}