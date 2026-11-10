import { describe, expect, it } from 'vitest'
import { clampMotorSpeed, differentialDrive, initialRobot, stepRobot } from './robot'
import { arenaObstacles, colorSensor, distanceSensor, gyroSensor, headingSensor } from './sensors'
import { calculateScore, starterMissions } from './scoring'

describe('robot motion', () => {
  it('moves forward with equal wheel speeds', () => {
    const next = stepRobot({ ...initialRobot, leftSpeed: 50, rightSpeed: 50 }, 1)
    expect(next.z).toBeLessThan(initialRobot.z)
    expect(next.x).toBeCloseTo(0)
  })
  it('stops at arena boundaries', () => {
    const next=stepRobot({...initialRobot,leftSpeed:-50,rightSpeed:-50},1)
    expect(next.z).toBeLessThanOrEqual(1.24)
    expect(next.leftSpeed).toBe(0)
  })
  it('stops at a mission obstacle', () => {
    const state = { ...initialRobot, x: -0.92, z: -0.35, leftSpeed: 50, rightSpeed: 50 }
    const next = stepRobot(state, 0.5, arenaObstacles)
    expect(next.leftSpeed).toBe(0)
    expect(next.rightSpeed).toBe(0)
  })
  it('clamps motor power', () => expect(clampMotorSpeed(140)).toBe(100))
  it('calculates differential wheel speeds', () => expect(differentialDrive(200, 0)).toEqual([20, 20]))
  it('converts turn rate using axle track in millimeters', () => {
    const [left,right]=differentialDrive(150,90,120)
    expect(left).toBeCloseTo(5.575)
    expect(right).toBeCloseTo(24.425)
  })
  it('uses track width to calculate angular motion', () => {
    const next=stepRobot({...initialRobot,leftSpeed:5.575,rightSpeed:24.425},1,[],0.12)
    expect(next.heading).toBeCloseTo(Math.PI/2,1)
  })
})

describe('virtual sensors', () => {
  it('returns a bounded distance', () => expect(distanceSensor(initialRobot)).toBeGreaterThan(0))
  it('returns the floor color', () => expect(colorSensor(initialRobot)).toBe('#182b31'))
  it('detects the color beneath the forward sensor mount', () => {
    expect(colorSensor({ ...initialRobot, x: -0.92, z: -0.56 })).toBe('#e3a53b')
  })
  it('normalizes heading', () => expect(headingSensor({ ...initialRobot, heading: Math.PI * 2 })).toBeCloseTo(0))
  it('reports gyro rate from differential wheel speeds', () => {
    expect(gyroSensor({ ...initialRobot, leftSpeed: -10, rightSpeed: 10 }, 0.12)).toBeGreaterThan(0)
  })
})

describe('mission score', () => {
  it('sums only completed missions', () => {
    expect(calculateScore(starterMissions.map((mission, index) => ({ ...mission, completed: index === 0 })))).toBe(10)
  })
})
