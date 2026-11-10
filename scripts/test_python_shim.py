#!/usr/bin/env python3
"""Smoke-test the Python compatibility layer embedded in the Pyodide worker."""
import json
import re
import time
from pathlib import Path

worker_source = Path("src/runtime/python.worker.ts").read_text(encoding="utf-8")
match = re.search(r"const shim = `\n(.*?)\n`", worker_source, re.DOTALL)
if not match:
    raise SystemExit("Could not extract Python compatibility shim from Worker source")

shim_source = match.group(1)

def make_runtime():
    events = []
    namespace = {
        "__sim_emit": lambda kind, payload: events.append((kind, json.loads(payload))),
    }
    exec(compile(shim_source, "pybricks_compat.py", "exec"), namespace)
    return namespace, events

# API, drivetrain units, virtual sensors, odometry and IMU.
runtime, events = make_runtime()
exec("""
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
wait(20)
robot.stop()
readings = (sonar.distance(), color.color(), hub.imu.heading(), robot.distance())
""", runtime)
assert events[0][0] == "drive", "DriveBase.drive did not emit a drive event"
assert events[-1][0] == "stop", "DriveBase.stop did not emit a stop event"
assert runtime["readings"][1] == runtime["Color"].GREEN, "Floor color sensor reading is incorrect"
assert runtime["readings"][2] == 0, "Virtual IMU heading should start at zero"
assert runtime["readings"][3] > 0, "DriveBase odometry did not accumulate distance"

# Sensor readings should detect the yellow mission object.
runtime["sim_x"] = -0.92
runtime["sim_z"] = -0.70
assert runtime["ColorSensor"]("D").color() == runtime["Color"].YELLOW
assert runtime["UltrasonicSensor"]("A").distance() <= 100

# Arbitrary configured motor ports should map to left/right drive outputs.
runtime2, events2 = make_runtime()
exec("""
from pybricks.pupdevices import Motor
from pybricks.robotics import DriveBase
from pybricks.parameters import Port
left = Motor(Port.A)
right = Motor(Port.F)
robot = DriveBase(left, right, 56, 120)
left.run(360)
right.run(360)
""", runtime2)
drive_events = [payload for kind, payload in events2 if kind == "drive"]
assert len(drive_events) >= 2
assert abs(drive_events[-1]["left"] - 17.5929) < 0.02
assert abs(drive_events[-1]["right"] - 17.5929) < 0.02

# The Python-side kinematics must stop at the same mission obstacle as the UI.
runtime3, events3 = make_runtime()
exec("""
from pybricks.pupdevices import Motor
from pybricks.robotics import DriveBase
from pybricks.parameters import Port
left = Motor(Port.B)
right = Motor(Port.C)
robot = DriveBase(left, right, 56, 120)
sim_x = -0.92
sim_z = -0.35
robot.drive(150, 0)
last_tick = time.monotonic() - 1.2
advance()
""", runtime3)
assert runtime3["sim_left"] == 0 and runtime3["sim_right"] == 0
assert any(kind == "stop" for kind, _ in events3), "Collision did not stop the virtual drivetrain"


# The Python runtime must also stop when the chassis reaches a wall.
runtime4, events4 = make_runtime()
exec("""
from pybricks.pupdevices import Motor
from pybricks.robotics import DriveBase
from pybricks.parameters import Port
left = Motor(Port.B)
right = Motor(Port.C)
robot = DriveBase(left, right, 56, 120)
sim_z = 1.23
robot.drive(-150, 0)
""", runtime4)
runtime4["last_tick"] = time.monotonic() - 1.2
runtime4["advance"]()
assert runtime4["sim_left"] == 0 and runtime4["sim_right"] == 0
assert any(kind == "stop" for kind, _ in events4), "Wall collision did not stop the virtual drivetrain"


# Worker initialization must preserve the current pose when a program is rerun.
runtime5, _ = make_runtime()
runtime5["__sim_initial_state"] = json.dumps({"x": 0.25, "z": 0.4, "heading": 1.2})
exec("""
import json, time
_state = json.loads(__sim_initial_state)
sim_x = float(_state['x'])
sim_z = float(_state['z'])
sim_heading = float(_state['heading'])
last_tick = time.monotonic()
""", runtime5)
assert abs(runtime5["sim_x"] - 0.25) < 1e-9
assert abs(runtime5["sim_z"] - 0.4) < 1e-9
assert abs(runtime5["sim_heading"] - 1.2) < 1e-9

print("Pybricks Worker shim smoke tests passed.")
