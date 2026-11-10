export type LegoPartKind = 'hub' | 'motor' | 'wheel' | 'color-sensor' | 'distance-sensor' | 'beam'
export type LegoPart = {
  id: string
  kind: LegoPartKind
  port?: string
  parentId?: string
  position: [number, number, number]
  rotation: [number, number, number]
}
export type RobotAssembly = {
  name: string
  parts: LegoPart[]
  leftMotorId: string
  rightMotorId: string
  wheelDiameterMm: number
  axleTrackMm: number
}
export const defaultAssembly: RobotAssembly = {
  name: 'SPIKE Prime - Differential',
  parts: [
    { id: 'hub', kind: 'hub', position: [0, 0.19, 0], rotation: [0, 0, 0] },
    { id: 'left-motor', kind: 'motor', port: 'B', parentId: 'hub', position: [-0.06, 0.06, 0], rotation: [0, 0, 0] },
    { id: 'right-motor', kind: 'motor', port: 'C', parentId: 'hub', position: [0.06, 0.06, 0], rotation: [0, 0, 0] },
    { id: 'left-wheel', kind: 'wheel', parentId: 'left-motor', position: [-0.06, 0.028, 0], rotation: [0, 0, 1.5708] },
    { id: 'right-wheel', kind: 'wheel', parentId: 'right-motor', position: [0.06, 0.028, 0], rotation: [0, 0, 1.5708] },
    { id: 'distance-sensor', kind: 'distance-sensor', port: 'A', parentId: 'hub', position: [0, 0.08, -0.18], rotation: [0, 0, 0] },
    { id: 'color-sensor', kind: 'color-sensor', port: 'D', parentId: 'hub', position: [0, 0.02, -0.18], rotation: [0, 0, 0] },
  ],
  leftMotorId: 'left-motor',
  rightMotorId: 'right-motor',
  wheelDiameterMm: 56,
  axleTrackMm: 120,
}
export function validateAssembly(assembly: RobotAssembly): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  const ports = new Set<string>()
  for (const part of assembly.parts) {
    if (!part.id || ids.has(part.id)) errors.push('IDs de componentes ausentes ou duplicados.')
    ids.add(part.id)
    if (part.kind === 'motor' || part.kind === 'color-sensor' || part.kind === 'distance-sensor') {
      if (!part.port || part.port.length !== 1 || !'ABCDEF'.includes(part.port)) errors.push('Cada componente conectado precisa de uma porta A-F válida.')
      else if (ports.has(part.port)) errors.push('A porta ' + part.port + ' está atribuída a mais de um componente.')
      else ports.add(part.port)
    }
  }
  if (assembly.parts.filter(part => part.kind === 'hub').length !== 1) errors.push('A montagem precisa ter exatamente um hub.')
  for (const part of assembly.parts) {
    if (part.parentId && !ids.has(part.parentId)) errors.push('Componente ' + part.id + ' aponta para um pai inexistente.')
  }
  const left = assembly.parts.find(part => part.id === assembly.leftMotorId)
  const right = assembly.parts.find(part => part.id === assembly.rightMotorId)
  if (!left || left.kind !== 'motor' || !right || right.kind !== 'motor' || left.id === right.id) errors.push('O conjunto de tração precisa de dois motores diferentes.')
  if (!Number.isFinite(assembly.wheelDiameterMm) || assembly.wheelDiameterMm < 20 || assembly.wheelDiameterMm > 120) errors.push('Diâmetro de roda fora do intervalo de 20 a 120 mm.')
  if (!Number.isFinite(assembly.axleTrackMm) || assembly.axleTrackMm < 40 || assembly.axleTrackMm > 240) errors.push('Distância entre rodas fora do intervalo de 40 a 240 mm.')
  return errors
}
