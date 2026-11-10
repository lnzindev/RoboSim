import type { ArenaDefinition } from './types'
import { bioglowFounders2026 } from './seasons/bioglow-founders-2026'

export const practiceArena: ArenaDefinition = {
  id: 'robosim-practice-v1',
  name: 'Arena de treino RoboSim',
  width: 3,
  depth: 3,
  official: false,
  obstacles: [
    { id: 'barrier-west', x: 0.92, z: 1.23, width: 0.34, depth: 0.34, height: 0.18, color: '#d29b43' },
    { id: 'barrier-east', x: 2.14, z: 0.83, width: 0.32, depth: 0.44, height: 0.28, color: '#3c80c8' },
    { id: 'barrier-center', x: 1.52, z: 1.68, width: 0.52, depth: 0.18, height: 0.12, color: '#d65c52' },
  ],
  targets: [
    { id: 'target-green', label: 'Zona verde', x: 0.5, z: 0.9, radius: 0.2, points: 10, color: '#48b98a' },
    { id: 'target-yellow', label: 'Zona amarela', x: 2.38, z: 2.38, radius: 0.2, points: 15, color: '#e3b44d' },
    { id: 'target-blue', label: 'Zona azul', x: 2.55, z: 0.35, radius: 0.2, points: 20, color: '#5798e2' },
  ],
}

export const customArena: ArenaDefinition = {
  id: 'robosim-custom-v1',
  name: 'Arena personalizada',
  width: 4,
  depth: 3,
  official: false,
  obstacles: [],
  targets: [],
}

export function getArenaById(id: string): ArenaDefinition {
  if (id === bioglowFounders2026.id) return bioglowFounders2026
  return id === customArena.id ? customArena : practiceArena
}