import type { RuntimeEnvironment, WorkerResponse } from './protocol'
import type { SimulationCommand } from '../sim/types'

export function executePython(
  code: string,
  environment: RuntimeEnvironment,
  onOutput: (message: string) => void,
  timeoutMs = 20_000,
  signal?: AbortSignal,
  loadTimeoutMs = 120_000,
): Promise<SimulationCommand[]> {
  if (code.length > 100_000) {
    return Promise.reject(new Error('O programa excede o limite de 100.000 caracteres.'))
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./python.worker.ts', import.meta.url), { type: 'module' })
    let settled = false
    let timeoutId: number | undefined
    let abortHandler: (() => void) | undefined

    const finish = (callback: () => void) => {
      if (settled) return
      settled = true
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
      if (abortHandler) signal?.removeEventListener('abort', abortHandler)
      worker.terminate()
      callback()
    }

    const setTimeoutFor = (durationMs: number, message: string) => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        finish(() => reject(new Error(message)))
      }, durationMs)
    }

    setTimeoutFor(
      loadTimeoutMs,
      'O Pyodide demorou demais para carregar. Verifique a conexão e tente novamente.',
    )

    abortHandler = () => finish(() => reject(new Error('Execução cancelada.')))
    if (signal?.aborted) {
      abortHandler()
      return
    }
    signal?.addEventListener('abort', abortHandler, { once: true })

    worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const message = event.data
      if (message.type === 'loading' || message.type === 'stdout') {
        onOutput(message.message)
      } else if (message.type === 'ready') {
        onOutput(message.message)
        setTimeoutFor(
          timeoutMs,
          'O programa Python excedeu o limite de execução e o Worker foi encerrado.',
        )
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
