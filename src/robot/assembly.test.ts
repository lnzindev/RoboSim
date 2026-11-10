import { describe, expect, it } from 'vitest'
import { defaultAssembly, validateAssembly } from './assembly'
describe('robot assembly', () => {
  it('accepts the default differential drive assembly', () => expect(validateAssembly(defaultAssembly)).toEqual([]))
  it('accepts an optional structural beam attached to the hub', () => {
    const assembly = { ...defaultAssembly, parts: [...defaultAssembly.parts, { id: 'front-beam', kind: 'beam' as const, parentId: 'hub', position: [0, 0.27, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] }] }
    expect(validateAssembly(assembly)).toEqual([])
  })
  it('rejects duplicate motor ports', () => {
    const assembly = { ...defaultAssembly, parts: defaultAssembly.parts.map(part => part.id === 'right-motor' ? { ...part, port: 'B' } : part) }
    expect(validateAssembly(assembly).some(error => error.includes('atribuída'))).toBe(true)
  })
  it('accepts a sensor on an unused configurable port', () => {
    const assembly = { ...defaultAssembly, parts: defaultAssembly.parts.map(part => part.id === 'distance-sensor' ? { ...part, port: 'E' } : part) }
    expect(validateAssembly(assembly)).toEqual([])
  })
  it('rejects a motor port already used by a sensor', () => {
    const assembly = { ...defaultAssembly, parts: defaultAssembly.parts.map(part => part.id === 'left-motor' ? { ...part, port: 'A' } : part) }
    expect(validateAssembly(assembly).some(error => error.includes('atribuída'))).toBe(true)
  })
  it('rejects a missing hub', () => {
    const assembly = { ...defaultAssembly, parts: defaultAssembly.parts.filter(part => part.kind !== 'hub') }
    expect(validateAssembly(assembly).some(error => error.includes('hub'))).toBe(true)
  })
})
