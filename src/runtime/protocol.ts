export type RuntimeEvent =
  | { type: 'drive'; left: number; right: number }
  | { type: 'stop' }
  | { type: 'log'; message: string }
  | { type: 'finished' }
  | { type: 'ready' }
  | { type: 'error'; message: string }
export type RuntimeMessage = { type: 'run'; source: string; initialState?: { x: number; z: number; heading: number } } | { type: 'stop' }

export type RuntimeOutput = RuntimeEvent
