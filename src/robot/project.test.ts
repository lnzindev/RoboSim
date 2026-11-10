import { describe, expect, it } from 'vitest'
import { createProject, parseProject } from './project'

describe('project document validation', () => {
  it('round-trips a valid project document', () => {
    const project = createProject('print("hello")')
    expect(parseProject(project)).toEqual(project)
  })

  it('rejects duplicate motor ports', () => {
    const project = createProject('pass')
    expect(() => parseProject({
      ...project,
      robot: { ...project.robot, rightMotorPort: project.robot.leftMotorPort },
    })).toThrow()
  })

  it('rejects a sensor connected to a motor port', () => {
    const project = createProject('pass')
    expect(() => parseProject({
      ...project,
      robot: {
        ...project.robot,
        sensorMounts: project.robot.sensorMounts.map((sensor, index) =>
          index === 0 ? { ...sensor, port: project.robot.leftMotorPort } : sensor,
        ),
      },
    })).toThrow()
  })

  it('keeps custom arena dimensions in the project document', () => {
    const project = createProject('pass', undefined, 'robosim-custom-v1', 5, 2.5)
    expect(parseProject(project).arenaWidth).toBe(5)
    expect(parseProject(project).arenaDepth).toBe(2.5)
  })
})