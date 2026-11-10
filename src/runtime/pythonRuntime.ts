import type { RuntimeEnvironment, WorkerResponse } from './protocol'
import type { SimulationCommand } from '../sim/types'

export function executePython(
  code: string,
  environment: RuntimeEnvironment,
  onOutput: (message: string) => void,
  timeoutMs = 30_000,
): Promise<SimulationCommand[]> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./python.worker.ts', import.meta.url), { type: 'module' })
    let settled = false
    const finish = (callback: () => void) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      worker.terminate()
      callback()
    }
    const timeout = window.setTimeout(() => {
      finish(() => reject(new Error('Tempo limite excedido. O Worker foi encerrado para interromper o programa.')))
    }, timeoutMs)

    worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const message = event.data
      if (message.type === 'loading' || message.type === 'stdout') {
        onOutput(message.message)
      } else if (message.type === 'result') {
        finish(() => resolve(message.commands))
      } else {
        finish(() => reject(new Error(message.message)))
      }
    })
    worker.addEventListener('error', (event) => {
      finish(() => reject(new Error(event.message || 'Falha inesperada no Worker Python.')))
    })
    worker.postMessage({ code, environment })
  })
}