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
})