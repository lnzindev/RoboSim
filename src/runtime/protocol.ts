import type { SensorSnapshot, SimulationCommand } from '../sim/types'

export type RuntimeEnvironment = SensorSnapshot

export type WorkerRequest = {
  code: string
  environment: RuntimeEnvironment
}

export type WorkerResponse =
  | { type: 'loading'; message: string }
  | { type: 'stdout'; message: string }
  | { type: 'result'; commands: SimulationCommand[] }
  | { type: 'error'; message: string }