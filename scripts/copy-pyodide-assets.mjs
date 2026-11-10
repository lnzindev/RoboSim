import { cp, mkdir, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const source = fileURLToPath(new URL('../node_modules/pyodide/', import.meta.url))
const publicDirectory = fileURLToPath(new URL('../public/', import.meta.url))
const destination = fileURLToPath(new URL('../public/pyodide/', import.meta.url))

await mkdir(publicDirectory, { recursive: true })
await rm(destination, { recursive: true, force: true })
await cp(source, destination, { recursive: true })
console.log('Pyodide browser assets copied to public/pyodide/')
