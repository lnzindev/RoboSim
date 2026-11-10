import { z } from 'zod'
import { spikePrimePreset } from './presets'

const SensorMountSchema = z.object({
  id: z.string().min(1).max(80),
  kind: z.enum(['color', 'distance', 'force']),
  port: z.enum(['A', 'B', 'C', 'D', 'E', 'F']),
  xMm: z.number().min(-250).max(250),
  zMm: z.number().min(-250).max(300),
  rotationDeg: z.number().min(-360).max(360),
})

export const RobotConfigSchema = z.object({
  chassisWidthMm: z.number().min(80).max(400),
  chassisLengthMm: z.number().min(80).max(500),
  sensorMounts: z.array(SensorMountSchema).max(10),
  wheelDiameterMm: z.number().min(20).max(200),
  axleTrackMm: z.number().min(40).max(300),
  maxSpeedMmS: z.number().min(50).max(1500),
  leftMotorPort: z.enum(['A', 'B', 'C', 'D', 'E', 'F']),
  rightMotorPort: z.enum(['A', 'B', 'C', 'D', 'E', 'F']),
}).refine((value) => {
  const ports = [value.leftMotorPort, value.rightMotorPort, ...value.sensorMounts.map((sensor) => sensor.port)]
  return new Set(ports).size === ports.length
}, {
  message: 'Cada dispositivo precisa usar uma porta diferente do hub.',
  path: ['sensorMounts'],
})

export const ProjectSchema = z.object({
  schemaVersion: z.literal(1),
  name: z.string().min(1).max(80),
  arenaId: z.enum(['robosim-practice-v1', 'robosim-custom-v1', 'bioglow-founders-2026-27']),
  arenaWidth: z.number().min(1).max(8).default(4),
  arenaDepth: z.number().min(1).max(8).default(3),
  robot: RobotConfigSchema,
  code: z.string().max(100_000),
})

export type ProjectDocument = z.infer<typeof ProjectSchema>

export function createProject(code: string, robot = spikePrimePreset, arenaId: ProjectDocument['arenaId'] = 'robosim-practice-v1', arenaWidth = 4, arenaDepth = 3): ProjectDocument {
  return {
    schemaVersion: 1,
    name: 'Meu projeto RoboSim',
    arenaId,
    arenaWidth,
    arenaDepth,
    robot,
    code,
  }
}

export function parseProject(input: unknown): ProjectDocument {
  return ProjectSchema.parse(input)
}