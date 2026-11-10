/// <reference lib="webworker" />
import { loadPyodide, type PyodideInterface } from 'pyodide'
import type { RuntimeMessage } from './protocol'

declare const self: DedicatedWorkerGlobalScope
let runtime: Promise<PyodideInterface> | undefined
let stopped = false

const shim = `
import sys, types, time, json, math

def emit(kind, payload=None):
    __sim_emit(kind, json.dumps(payload or {}))

class Port:
    A='A'; B='B'; C='C'; D='D'; E='E'; F='F'
class Stop:
    COAST='coast'; BRAKE='brake'; HOLD='hold'
class Direction:
    CLOCKWISE=1; COUNTERCLOCKWISE=-1
class Color:
    BLACK='black'; BLUE='blue'; YELLOW='yellow'; GREEN='green'; WHITE='white'; NONE=None

motor_speeds={}
motor_angles={}
drive_ports=('B','C')
wheel_diameter_mm=56.0
track_width_m=0.12
sim_x=0.0
sim_z=1.15
sim_heading=0.0
sim_left=0.0
sim_right=0.0
sim_distance=0.0
last_tick=time.monotonic()
obstacles=[(-0.92,-0.88,0.42,0.34,'yellow'),(0.92,-0.85,0.30,0.30,'blue')]

def advance():
    global sim_x, sim_z, sim_heading, sim_left, sim_right, sim_distance, last_tick
    now=time.monotonic()
    remaining=max(0.0,now-last_tick)
    last_tick=now
    while remaining>0:
        dt=min(remaining,0.02)
        left=max(-100.0,min(100.0,sim_left))/100.0
        right=max(-100.0,min(100.0,sim_right))/100.0
        linear=(left+right)*0.5
        angular=(right-left)/max(track_width_m,0.01)
        heading=sim_heading+angular*dt
        half_width=max(track_width_m/2+0.0175,max(0.2,track_width_m+0.08)/2)
        limit_x=1.46-half_width
        limit_z=1.46-0.22
        raw_x=sim_x-math.sin(heading)*linear*dt
        raw_z=sim_z-math.cos(heading)*linear*dt
        boundary_hit=raw_x < -limit_x or raw_x > limit_x or raw_z < -limit_z or raw_z > limit_z
        next_x=max(-limit_x,min(limit_x,raw_x))
        next_z=max(-limit_z,min(limit_z,raw_z))
        hit=boundary_hit or any(abs(next_x-ox)<half_width+width/2 and abs(next_z-oz)<0.22+depth/2 for ox,oz,width,depth,_ in obstacles)
        sim_x,sim_z,sim_heading=next_x,next_z,heading
        sim_distance += linear*dt*1000.0
        for port,speed in list(motor_speeds.items()):
            motor_angles[port]=motor_angles.get(port,0.0)+speed*dt
        if hit:
            sim_left=sim_right=0.0
            for port in drive_ports: motor_speeds[port]=0.0
            emit('stop')
            break
        remaining-=dt

def publish_drive(left,right):
    global sim_left,sim_right
    advance()
    sim_left=max(-100.0,min(100.0,float(left)))
    sim_right=max(-100.0,min(100.0,float(right)))
    emit('drive',{'left':sim_left,'right':sim_right})

def stop_drive():
    global sim_left,sim_right
    advance()
    sim_left=sim_right=0.0
    for port in drive_ports: motor_speeds[port]=0.0
    emit('stop')

class Motor:
    def __init__(self, port, *args, **kwargs):
        self.port=str(port)
        self.current_speed=0.0
        motor_speeds.setdefault(self.port,0.0)
        motor_angles.setdefault(self.port,0.0)
    def _publish(self):
        if self.port in drive_ports:
            left=motor_speeds.get(drive_ports[0],0.0)*math.pi*wheel_diameter_mm/3600.0
            right=motor_speeds.get(drive_ports[1],0.0)*math.pi*wheel_diameter_mm/3600.0
            publish_drive(left,right)
        else:
            emit('motor',{'port':self.port,'speed':self.current_speed})
    def run(self,speed):
        advance()
        self.current_speed=max(-1000.0,min(1000.0,float(speed)))
        motor_speeds[self.port]=self.current_speed
        self._publish()
    def dc(self,duty): self.run(float(duty)*10.0)
    def stop(self):
        advance()
        self.current_speed=0.0
        motor_speeds[self.port]=0.0
        self._publish()
    def brake(self): self.stop()
    def hold(self): self.stop()
    def run_time(self,speed,duration,then=Stop.COAST,wait=True):
        self.run(speed)
        if wait:
            time.sleep(max(0.0,float(duration))/1000.0)
            self.stop()
    def run_angle(self,speed,rotation_angle,then=Stop.HOLD,wait=True):
        self.run(speed)
        if wait:
            time.sleep(abs(float(rotation_angle)/max(abs(float(speed)),1.0)))
            self.stop()
    def angle(self):
        advance()
        return int(round(motor_angles.get(self.port,0.0)))
    def speed(self):
        advance()
        return int(round(motor_speeds.get(self.port,0.0)))
    def reset_angle(self,angle=0):
        advance()
        motor_angles[self.port]=float(angle)

class DriveBase:
    def __init__(self,left_motor,right_motor,wheel_diameter,axle_track):
        global drive_ports,wheel_diameter_mm,track_width_m
        drive_ports=(left_motor.port,right_motor.port)
        wheel_diameter_mm=float(wheel_diameter)
        track_width_m=max(float(axle_track)/1000.0,0.01)
        motor_speeds.setdefault(left_motor.port,0.0)
        motor_speeds.setdefault(right_motor.port,0.0)
        self.left=left_motor; self.right=right_motor
        self.wheel_diameter=wheel_diameter_mm
        self.axle_track=float(axle_track)
    def drive(self,speed,turn_rate):
        advance()
        half=float(turn_rate)*self.axle_track*math.pi/360.0
        left=max(-100.0,min(100.0,(float(speed)-half)/10.0))
        right=max(-100.0,min(100.0,(float(speed)+half)/10.0))
        motor_speeds[drive_ports[0]]=left*10.0*360.0/(math.pi*wheel_diameter_mm)
        motor_speeds[drive_ports[1]]=right*10.0*360.0/(math.pi*wheel_diameter_mm)
        publish_drive(left,right)
    def stop(self): stop_drive()
    def straight(self,distance):
        speed=180.0 if float(distance)>=0 else -180.0
        self.drive(speed,0)
        time.sleep(abs(float(distance))/abs(speed))
        self.stop()
    def turn(self,angle):
        rate=90.0 if float(angle)>=0 else -90.0
        self.drive(0,rate)
        time.sleep(abs(float(angle))/90.0)
        self.stop()
    def settings(self,*args,**kwargs): return None
    def distance(self):
        advance()
        return int(round(sim_distance))
    def angle(self):
        advance()
        return int(round(sim_heading*180.0/math.pi))
    def reset(self):
        global sim_distance
        advance()
        sim_distance=0.0

class UltrasonicSensor:
    def __init__(self,port,*args,**kwargs): self.port=str(port)
    def distance(self):
        advance()
        dx=-math.sin(sim_heading); dz=-math.cos(sim_heading)
        ox=sim_x+dx*0.18; oz=sim_z+dz*0.18
        for mm in range(40,2001,20):
            d=mm/1000.0
            x=ox+dx*d; z=oz+dz*d
            if abs(x)>1.45 or abs(z)>1.45: return mm
            if any(abs(x-ax)<=width/2 and abs(z-az)<=depth/2 for ax,az,width,depth,_ in obstacles): return mm
        return 2000

class ColorSensor:
    def __init__(self,port,*args,**kwargs): self.port=str(port)
    def color(self):
        advance()
        x=sim_x-math.sin(sim_heading)*0.18
        z=sim_z-math.cos(sim_heading)*0.18
        for ox,oz,width,depth,color in obstacles:
            if abs(x-ox)<=width/2 and abs(z-oz)<=depth/2:
                return Color.YELLOW if color=='yellow' else Color.BLUE
        return Color.GREEN
    def reflection(self):
        color=self.color()
        return 70 if color==Color.YELLOW else 35 if color==Color.BLUE else 48
    def rgb(self):
        color=self.color()
        return (255,180,0) if color==Color.YELLOW else (0,80,255) if color==Color.BLUE else (45,105,75)

class VirtualIMU:
    def heading(self):
        advance()
        return int(round(sim_heading*180.0/math.pi))%360
    def ready(self): return True
    def tilt(self): return (0,0)

class PrimeHub:
    def __init__(self):
        self.system=types.SimpleNamespace()
        self.imu=VirtualIMU()
    def light(self): return None

def wait(milliseconds):
    time.sleep(max(0.0,float(milliseconds))/1000.0)
    advance()

def module(name):
    item=types.ModuleType(name)
    sys.modules[name]=item
    return item

root=module('pybricks'); root.__path__=[]
parameters=module('pybricks.parameters')
parameters.Port=Port; parameters.Stop=Stop; parameters.Direction=Direction; parameters.Color=Color
pup=module('pybricks.pupdevices')
pup.Motor=Motor; pup.UltrasonicSensor=UltrasonicSensor; pup.ColorSensor=ColorSensor
robotics=module('pybricks.robotics'); robotics.DriveBase=DriveBase
hubs=module('pybricks.hubs'); hubs.PrimeHub=PrimeHub
tools=module('pybricks.tools'); tools.wait=wait
`

async function getRuntime() {
  runtime ??= loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.3/full/' })
  return runtime
}

self.onmessage = async (event: MessageEvent<RuntimeMessage>) => {
  if (event.data.type === 'stop') { stopped = true; return }
  if (event.data.type !== 'run') return
  stopped = false
  try {
    const py = await getRuntime()
    py.setStdout({ batched: (message: string) => self.postMessage({ type: 'log', message }) })
    py.setStderr({ batched: (message: string) => self.postMessage({ type: 'error', message }) })
    py.globals.set('__sim_emit', (kind: string, payload: string) => {
      if (stopped) return
      const data = JSON.parse(payload) as Record<string, string | number>
      if (kind === 'drive') self.postMessage({ type: 'drive', left: Number(data.left), right: Number(data.right) })
      else if (kind === 'stop') self.postMessage({ type: 'stop' })
      else if (kind === 'motor' || kind === 'motor_stop') self.postMessage({ type: 'log', message: 'Motor ' + String(data.port) + ': ' + String(data.speed ?? 'stop') })
    })
    await py.runPythonAsync(shim)
    if (stopped) return
    const initialState = event.data.initialState ?? { x: 0, z: 1.15, heading: 0 }
    py.globals.set('__sim_initial_state', JSON.stringify(initialState))
    await py.runPythonAsync("import json, time\n_state=json.loads(__sim_initial_state)\nsim_x=float(_state['x'])\nsim_z=float(_state['z'])\nsim_heading=float(_state['heading'])\nlast_tick=time.monotonic()")
    self.postMessage({ type: 'ready' })
    await py.runPythonAsync(event.data.source)
    if (!stopped) self.postMessage({ type: 'finished' })
  } catch (error) {
    if (!stopped) self.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) })
  }
}
