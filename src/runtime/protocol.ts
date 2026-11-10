import type { SensorMount, SensorSnapshot } from '../sim/types'

export type RuntimeEnvironment = SensorSnapshot & {
  motorPorts: { left: string; right: string }
  sensorMounts: SensorMount[]
}

export type WorkerRequest = {
  code: string
  environment: RuntimeEnvironment
}

export type WorkerResponse =
  | { type: 'loading'; message: string }
  | { type: 'stdout'; message: string }
  | { type: 'result'; commands: import('../sim/types').SimulationCommand[] }
  | { type: 'error'; message: string }
