import { z } from 'zod'
import { spikePrimePreset } from './presets'

export const RobotConfigSchema = z.object({
  wheelDiameterMm: z.number().min(20).max(200),
  axleTrackMm: z.number().min(40).max(300),
  maxSpeedMmS: z.number().min(50).max(1500),
  leftMotorPort: z.enum(['A', 'B', 'C', 'D', 'E', 'F']),
  rightMotorPort: z.enum(['A', 'B', 'C', 'D', 'E', 'F']),
}).refine((value) => value.leftMotorPort !== value.rightMotorPort, {
  message: 'Os motores esquerdo e direito precisam usar portas diferentes.',
  path: ['rightMotorPort'],
})

export const ProjectSchema = z.object({
  schemaVersion: z.literal(1),
  name: z.string().min(1).max(80),
  arenaId: z.string().min(1).max(100),
  robot: RobotConfigSchema,
  code: z.string().max(100_000),
})

export type ProjectDocument = z.infer<typeof ProjectSchema>

export function createProject(code: string, robot = spikePrimePreset, arenaId: string = 'robosim-practice-v1'): ProjectDocument {
  return {
    schemaVersion: 1,
    name: 'Meu projeto RoboSim',
    arenaId,
    robot,
    code,
  }
}

export function parseProject(input: unknown): ProjectDocument {
  return ProjectSchema.parse(input)
}