import { readFile } from 'node:fs/promises'
import { loadPyodide } from 'pyodide'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

try {
const worker = await readFile('src/runtime/python.worker.ts', 'utf8')
const match = worker.match(/const shim = `\n([\s\S]*?)\n`/)
if (!match) throw new Error('Could not extract Pybricks shim from Worker source')

console.log('Loading Pyodide from the npm package...')
const indexURL = dirname(fileURLToPath(import.meta.resolve('pyodide'))) + '/'
const py = await loadPyodide({ indexURL })
console.log('Pyodide initialized.')
const events = []
py.globals.set('__sim_emit', (kind, payload) => events.push({ kind, payload: JSON.parse(payload) }))
await py.runPythonAsync(match[1])
console.log('Compatibility shim imported.')

let invalidProgramReported = false
try {
  await py.runPythonAsync("raise ValueError('invalid program smoke test')")
} catch (error) {
  invalidProgramReported = String(error).includes('invalid program smoke test')
}
if (!invalidProgramReported) throw new Error('Python runtime did not surface an invalid-program error')
await py.runPythonAsync('assert 1 + 1 == 2')

const initialState = { x: 0.25, z: 0.4, heading: 1.2 }
py.globals.set('__sim_initial_state', JSON.stringify(initialState))
await py.runPythonAsync(`import json, time
_state = json.loads(__sim_initial_state)
sim_x = float(_state['x'])
sim_z = float(_state['z'])
sim_heading = float(_state['heading'])
last_tick = time.monotonic()
assert abs(sim_x - 0.25) < 1e-9
assert abs(sim_z - 0.4) < 1e-9
assert abs(sim_heading - 1.2) < 1e-9
`)

await py.runPythonAsync(`
from pybricks.pupdevices import Motor, UltrasonicSensor, ColorSensor
from pybricks.robotics import DriveBase
from pybricks.parameters import Port, Color
from pybricks.hubs import PrimeHub
from pybricks.tools import wait

left = Motor(Port.B)
right = Motor(Port.C)
robot = DriveBase(left, right, 56, 120)
sonar = UltrasonicSensor(Port.A)
color = ColorSensor(Port.D)
hub = PrimeHub()
robot.drive(150, 0)
wait(100)
robot.stop()
assert color.color() == Color.GREEN, 'floor color sensor should read green'
assert hub.imu.heading() >= 0, 'virtual IMU heading should be non-negative'
assert robot.distance() > 0, 'DriveBase odometry should advance while wait() runs'
`)

await py.runPythonAsync(`
sim_x = -0.92
sim_z = -0.70
assert ColorSensor(Port.D).color() == Color.YELLOW, 'color sensor should detect the yellow mission object'
assert UltrasonicSensor(Port.A).distance() <= 100, 'ultrasonic sensor should detect the nearby mission object'
`)

const driveEvents = events.filter(event => event.kind === 'drive')
if (driveEvents.length < 1) throw new Error('DriveBase did not emit motor commands')
if (!events.some(event => event.kind === 'stop')) throw new Error('DriveBase did not emit stop')

await py.runPythonAsync(`
sim_x = 0.0
sim_z = 1.15
sim_heading = 0.0
sim_left = sim_right = 0.0
last_tick = time.monotonic()
left = Motor(Port.A)
right = Motor(Port.F)
alternate = DriveBase(left, right, 56, 120)
left.run(360)
right.run(360)
assert sim_left > 0, 'left motor should map to the configured drivebase port'
assert sim_right > 0, 'right motor should map to the configured drivebase port'
assert abs(sim_left - sim_right) < 0.02, 'equal motor speeds should produce equal wheel speeds'
`)

await py.runPythonAsync(`
sim_x = -0.92
sim_z = -0.35
left = Motor(Port.B)
right = Motor(Port.C)
collision_test = DriveBase(left, right, 56, 120)
collision_test.drive(150, 0)
last_tick = time.monotonic() - 1.2
advance()
assert sim_left == 0 and sim_right == 0, 'mission collision should stop both drive motors'
`)

if (!events.some(event => event.kind === 'stop')) throw new Error('Collision did not stop drivetrain')
console.log('Pyodide runtime integration tests passed.')
} catch (error) {
  console.error('Pyodide runtime integration failed:', error?.stack ?? error)
  throw error
}
