import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Grid, OrbitControls, PerspectiveCamera, Text } from '@react-three/drei'
import { Physics, RigidBody } from '@react-three/rapier'
import { Activity, Bot, Code2, Gauge, Play, RotateCcw, Square, Timer, Zap, Radio, ScanEye } from 'lucide-react'
import { initialRobot, stepRobot, type RobotState } from './sim/robot'
import { arenaObstacles, colorSensor, distanceSensor, gyroSensor, headingSensor } from './sim/sensors'
import { calculateScore, starterMissions } from './sim/scoring'
import type { RuntimeOutput } from './runtime/protocol'
import { defaultAssembly, validateAssembly } from './robot/assembly'

const starter = `from pybricks.pupdevices import Motor, UltrasonicSensor, ColorSensor
from pybricks.robotics import DriveBase
from pybricks.parameters import Port
from pybricks.hubs import PrimeHub
from pybricks.tools import wait

# RoboSim FLL - programa Pybricks de exemplo
left = Motor(Port.B)
right = Motor(Port.C)
robot = DriveBase(left, right, wheel_diameter=56, axle_track=120)
hub = PrimeHub()
distance_sensor = UltrasonicSensor(Port.A)
color_sensor = ColorSensor(Port.D)

robot.drive(150, 0)
wait(1200)
robot.stop()
print('Distância:', distance_sensor.distance(), 'mm')
print('Cor:', color_sensor.color())
print('Heading:', hub.imu.heading())
`

function RobotModel({ state, onCollision, wheelDiameterMm, axleTrackMm, assemblyParts }: { state: RobotState; onCollision: () => void; wheelDiameterMm: number; axleTrackMm: number; assemblyParts: typeof defaultAssembly.parts }) {
  const wheelRadius = Math.max(0.01, Math.min(0.06, wheelDiameterMm / 2000))
  const halfTrack = axleTrackMm / 2000
  const chassisWidth = Math.max(0.2, axleTrackMm / 1000 + 0.08)
  return <RigidBody type="kinematicPosition" colliders="cuboid" position={[state.x, -0.03, state.z]} rotation={[0, state.heading, 0]} onCollisionEnter={onCollision}>
    <group>
      <mesh castShadow position={[0, wheelRadius + 0.07, 0]}><boxGeometry args={[chassisWidth, 0.12, 0.32]} /><meshStandardMaterial color="#e8edf5" roughness={0.42} /></mesh>
      <mesh castShadow position={[0, wheelRadius + 0.15, -0.02]}><boxGeometry args={[chassisWidth * 0.65, 0.08, 0.18]} /><meshStandardMaterial color="#202b3d" /></mesh>
      <mesh position={[0, wheelRadius + 0.20, -0.02]}><boxGeometry args={[0.06, 0.025, 0.06]} /><meshStandardMaterial color="#36d7a0" emissive="#0b6848" emissiveIntensity={0.5} /></mesh>
      {[-1, 1].map(side => <mesh key={side} castShadow position={[side * halfTrack, wheelRadius, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[wheelRadius, wheelRadius, 0.035, 24]} /><meshStandardMaterial color="#151a23" /></mesh>)}
      {assemblyParts.some(part=>part.kind==='distance-sensor')&&<mesh position={[0,wheelRadius+0.02,-0.19]}><boxGeometry args={[0.07,0.035,0.05]}/><meshStandardMaterial color="#f3a83b"/></mesh>}
      {assemblyParts.some(part=>part.kind==='color-sensor')&&<mesh position={[0,wheelRadius-0.015,-0.19]}><boxGeometry args={[0.05,0.025,0.04]}/><meshStandardMaterial color="#4d9ee8"/></mesh>}
      {assemblyParts.filter(part=>part.kind==='beam').map(part=><mesh key={part.id} position={part.position}><boxGeometry args={[chassisWidth*0.9,0.025,0.035]}/><meshStandardMaterial color="#e8edf5"/></mesh>)}
    </group>
  </RigidBody>
}
function Field({ state, onCollision, onMissionComplete, wheelDiameterMm, axleTrackMm, assemblyParts }: { state: RobotState; onCollision: () => void; onMissionComplete: (id: string) => void; wheelDiameterMm: number; axleTrackMm: number; assemblyParts: typeof defaultAssembly.parts }) {
  return <Physics gravity={[0, -9.81, 0]}>
    <RigidBody type="fixed" colliders="cuboid" position={[0, -0.08, 0]}>
      <mesh receiveShadow><boxGeometry args={[3, 0.1, 3]} /><meshStandardMaterial color="#182b31" roughness={0.92} /></mesh>
    </RigidBody>
    <Grid position={[0, 0.002, 0]} args={[3, 3]} cellSize={0.15} cellThickness={0.6} cellColor="#45645e" sectionSize={0.6} sectionColor="#6a9384" fadeDistance={5} infiniteGrid={false} />
    {[
      {p:[0,0.05,-1.48] as [number,number,number],s:[3,0.16,0.04] as [number,number,number]},
      {p:[0,0.05,1.48] as [number,number,number],s:[3,0.16,0.04] as [number,number,number]},
      {p:[-1.48,0.05,0] as [number,number,number],s:[0.04,0.16,3] as [number,number,number]},
      {p:[1.48,0.05,0] as [number,number,number],s:[0.04,0.16,3] as [number,number,number]},
    ].map((wall,i)=><RigidBody key={i} type="fixed" colliders="cuboid" position={wall.p}><mesh><boxGeometry args={wall.s}/><meshStandardMaterial color="#e9e4d2"/></mesh></RigidBody>)}
    <RigidBody type="fixed" colliders="cuboid" position={[-0.92,0.015,-0.88]} onCollisionEnter={() => onMissionComplete("mission-01")}><mesh><boxGeometry args={[0.42,0.09,0.34]}/><meshStandardMaterial color="#e3a53b"/></mesh></RigidBody>
    <RigidBody type="fixed" colliders="cuboid" position={[0.92,0.04,-0.85]} onCollisionEnter={() => onMissionComplete("mission-02")}><mesh><boxGeometry args={[0.3,0.14,0.3]}/><meshStandardMaterial color="#477cce"/></mesh></RigidBody>
    <Text position={[-0.92,0.11,-0.88]} rotation={[-Math.PI/2,0,0]} fontSize={0.1} color="#17202b">MISSÃO 01</Text>
    <RobotModel state={state} onCollision={onCollision} wheelDiameterMm={wheelDiameterMm} axleTrackMm={axleTrackMm} assemblyParts={assemblyParts}/>
  </Physics>
}

export default function App() {
  const [robot, setRobot] = useState<RobotState>(initialRobot)
  const [running, setRunning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState(starter)
  const [log, setLog] = useState<string[]>(['Aguardando execução do programa.'])
  const [elapsed, setElapsed] = useState(0)
  const [missions, setMissions] = useState(starterMissions)
  const [leftPort, setLeftPort] = useState('B')
  const [rightPort, setRightPort] = useState('C')
  const [wheelDiameter, setWheelDiameter] = useState(56)
  const [axleTrack, setAxleTrack] = useState(120)
  const [assemblyParts,setAssemblyParts] = useState(defaultAssembly.parts)
  const worker = useRef<Worker | null>(null)
  const frameRef = useRef<number | null>(null)
  const elapsedRef = useRef(0)

  useEffect(() => {
    if (!running) return
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min((now-last)/1000,0.05)
      last=now
      elapsedRef.current += dt
      setElapsed(Math.min(elapsedRef.current,150))
      if(elapsedRef.current>=150){ worker.current?.terminate(); worker.current=null; setRunning(false); setRobot(s=>({...s,leftSpeed:0,rightSpeed:0})); appendLog('Tempo limite da rodada atingido.'); return }
      setRobot(state => stepRobot(state,dt,arenaObstacles,axleTrack/1000,Math.max(axleTrack/2000+0.0175,Math.max(0.2,axleTrack/1000+0.08)/2),0.22))
      frameRef.current=requestAnimationFrame(tick)
    }
    frameRef.current=requestAnimationFrame(tick)
    return () => { if(frameRef.current!==null) cancelAnimationFrame(frameRef.current) }
  },[running])

  useEffect(() => () => worker.current?.terminate(),[])

  const elapsedLabel = useMemo(() => {
    const remaining=Math.max(0,150-Math.floor(elapsed))
    return `${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`
  },[elapsed])
  const distance = useMemo(()=>distanceSensor(robot),[robot])
  const color = useMemo(()=>colorSensor(robot),[robot])
  const heading = useMemo(()=>headingSensor(robot),[robot])
  const gyro = useMemo(()=>gyroSensor(robot,axleTrack/1000),[robot,axleTrack])
  const score=calculateScore(missions)

  function appendLog(message:string){setLog(lines=>[...lines.slice(-39),message])}
  function completeMission(id:string){
    const mission=missions.find(item=>item.id===id)
    if(!mission || mission.completed) return
    setMissions(current=>current.map(item=>item.id===id?{...item,completed:true}:item))
    appendLog('Missão concluída: '+mission.title+' (+'+mission.points+' pts).')
  }
  function updatePartPort(id:string,port:string){
    setAssemblyParts(parts=>parts.map(part=>part.id===id?{...part,port}:part))
  }
  function toggleBeam(){
    if(assemblyParts.some(part=>part.kind==='beam')) setAssemblyParts(parts=>parts.filter(part=>part.kind!=='beam'))
    else setAssemblyParts(parts=>[...parts,{id:'front-beam',kind:'beam',parentId:'hub',position:[0,0.27,0],rotation:[0,0,0]}])
  }

  function applyRobotConfig(){
    if(leftPort===rightPort){appendLog('Configuração inválida: os motores precisam usar portas diferentes.');return}
    const assembly={...defaultAssembly,wheelDiameterMm:wheelDiameter,axleTrackMm:axleTrack,parts:assemblyParts.map(part=>part.id==='left-motor'?{...part,port:leftPort}:part.id==='right-motor'?{...part,port:rightPort}:part)}
    const assemblyErrors=validateAssembly(assembly)
    if(assemblyErrors.length){appendLog('Montagem inválida: '+assemblyErrors.join(' '));return}
    const updated=code
      .replace(/left = Motor.*/, 'left = Motor(Port.'+leftPort+')')
      .replace(/right = Motor.*/, 'right = Motor(Port.'+rightPort+')')
      .replace(/wheel_diameter=[^,)]*/, 'wheel_diameter='+wheelDiameter)
      .replace(/axle_track=[^,)]+/, 'axle_track='+axleTrack)
      .replace(/distance_sensor = UltrasonicSensor\(Port\.[A-F]\)/, assemblyParts.some(part=>part.id==='distance-sensor')?'distance_sensor = UltrasonicSensor(Port.'+(assemblyParts.find(part=>part.id==='distance-sensor')?.port??'A')+')':'# Sensor de distância removido da montagem')
      .replace(/color_sensor = ColorSensor\(Port\.[A-F]\)/, assemblyParts.some(part=>part.id==='color-sensor')?'color_sensor = ColorSensor(Port.'+(assemblyParts.find(part=>part.id==='color-sensor')?.port??'D')+')':'# Sensor de cor removido da montagem')
    if(updated===code){appendLog('O código atual não contém a estrutura do exemplo DriveBase; as configurações não foram aplicadas.');return}
    setCode(updated)
    appendLog('Configuração aplicada ao exemplo Python.')
  }
  function stopRuntime(message='Execução interrompida.'){
    worker.current?.terminate()
    worker.current=null
    setLoading(false)
    setRunning(false)
    setRobot(state=>({...state,leftSpeed:0,rightSpeed:0}))
    appendLog(message)
  }
  function runCode(){
    if(running||loading) return
    if(code.length>50000){appendLog('Programa muito grande: limite de 50.000 caracteres.');return}
    worker.current?.terminate()
    const instance=new Worker(new URL('./runtime/python.worker.ts',import.meta.url),{type:'module'})
    worker.current=instance
    instance.onmessage=(event:MessageEvent<RuntimeOutput>)=>{
      const output=event.data
      if(output.type==='ready'){setLoading(false);elapsedRef.current=0;setElapsed(0);setRunning(true);appendLog('Runtime Python pronto.')}
      else if(output.type==='drive') setRobot(state=>({...state,leftSpeed:output.left,rightSpeed:output.right}))
      else if(output.type==='stop') setRobot(state=>({...state,leftSpeed:0,rightSpeed:0}))
      else if(output.type==='log') appendLog(output.message)
      else if(output.type==='finished'){setRobot(state=>({...state,leftSpeed:0,rightSpeed:0}));setLoading(false);setRunning(false);appendLog('Programa concluído.');instance.terminate();worker.current=null}
      else if(output.type==='error'){setRobot(state=>({...state,leftSpeed:0,rightSpeed:0}));setLoading(false);setRunning(false);appendLog('ERRO: '+output.message);instance.terminate();worker.current=null}
    }
    instance.onerror=(event)=>{appendLog('Falha no Worker: '+event.message);setRobot(state=>({...state,leftSpeed:0,rightSpeed:0}));setLoading(false);setRunning(false);instance.terminate();worker.current=null}
    elapsedRef.current=0
    setElapsed(0)
    setRunning(false)
    setLoading(true)
    appendLog('Inicializando Python via Pyodide...')
    instance.postMessage({type:'run',source:code,initialState:{x:robot.x,z:robot.z,heading:robot.heading}})
  }
  function reset(){
    worker.current?.terminate();worker.current=null
    setLoading(false);setRunning(false);setRobot(initialRobot);setMissions(starterMissions);setAssemblyParts(defaultAssembly.parts);elapsedRef.current=0;setElapsed(0)
    appendLog('Simulação reiniciada.')
  }
  function collision(){
    setRobot(state=>({...state,leftSpeed:0,rightSpeed:0}))
    appendLog('Colisão detectada: motores parados.')
  }

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><Bot size={22}/></div><div><strong>RoboSim <span>FLL</span></strong><small>ROBOTICS SIMULATION LAB</small></div></div>
      <div className="top-status"><span className="live-dot"/>{loading?'CARREGANDO PYTHON':running?'PROGRAMA EM EXECUÇÃO':'SIMULADOR LOCAL'} <span className="version">V0.2.0</span></div>
      <button className="icon-button" title="Reiniciar simulação" onClick={reset}><RotateCcw size={17}/></button>
    </header>
    <section className="workspace">
      <div className="sim-panel">
        <div className="panel-heading"><div><span className="eyebrow">AMBIENTE DE TESTE</span><h1>Arena FLL</h1></div><div className="heading-pills"><span><span className="live-dot"/> FÍSICA ATIVA</span><span>3 × 3 M</span></div></div>
        <div className="viewport">
          <Canvas shadows dpr={[1,1.7]}>
            <PerspectiveCamera makeDefault position={[3.6,3.8,4.5]} fov={42}/>
            <ambientLight intensity={0.75}/>
            <directionalLight position={[4,7,3]} intensity={2} castShadow shadow-mapSize={[1024,1024]}/>
            <Field state={robot} onCollision={collision} onMissionComplete={completeMission} wheelDiameterMm={wheelDiameter} axleTrackMm={axleTrack} assemblyParts={assemblyParts}/>
            <OrbitControls target={[0,0,0]} minDistance={2.5} maxDistance={8} maxPolarAngle={Math.PI/2.05}/>
          </Canvas>
          <div className="viewport-tag"><span className="live-dot"/> LIVE VIEW</div>
          <div className="axis-tag">X {robot.x.toFixed(2)} · Z {robot.z.toFixed(2)} · {heading.toFixed(0)}°</div>
        </div>
        <div className="sim-footer">
          <div className="metric"><Gauge size={16}/><div><small>VELOCIDADE</small><strong>{Math.round((Math.abs(robot.leftSpeed)+Math.abs(robot.rightSpeed))/2)} <i>%</i></strong></div></div>
          <div className="metric"><Timer size={16}/><div><small>TEMPO RESTANTE</small><strong>{elapsedLabel}</strong></div></div>
          <div className="metric"><Zap size={16}/><div><small>PONTUAÇÃO</small><strong>{score} <i>PTS</i></strong></div></div>
        </div>
        <div className="builder-panel">
          <div className="builder-title"><Bot size={14}/> CONFIGURAÇÃO DO ROBÔ</div>
          <div className="builder-grid">
            <label>Motor esquerdo<select disabled={running||loading} value={leftPort} onChange={e=>setLeftPort(e.target.value)}>{['A','B','C','D','E','F'].map(port=><option key={port} value={port}>Porta {port}</option>)}</select></label>
            <label>Motor direito<select disabled={running||loading} value={rightPort} onChange={e=>setRightPort(e.target.value)}>{['A','B','C','D','E','F'].map(port=><option key={port} value={port}>Porta {port}</option>)}</select></label>
            <label>Diâmetro da roda (mm)<input disabled={running||loading} type="number" min="20" max="120" value={wheelDiameter} onChange={e=>setWheelDiameter(Number(e.target.value))}/></label>
            <label>Distância entre rodas (mm)<input disabled={running||loading} type="number" min="40" max="240" value={axleTrack} onChange={e=>setAxleTrack(Number(e.target.value))}/></label>
            <label>Sensor de distância<select disabled={running||loading} value={assemblyParts.find(part=>part.id==='distance-sensor')?.port??''} onChange={e=>updatePartPort('distance-sensor',e.target.value)}>{['A','B','C','D','E','F'].map(port=><option key={port} value={port}>Porta {port}</option>)}</select></label>
            <label>Sensor de cor<select disabled={running||loading} value={assemblyParts.find(part=>part.id==='color-sensor')?.port??''} onChange={e=>updatePartPort('color-sensor',e.target.value)}>{['A','B','C','D','E','F'].map(port=><option key={port} value={port}>Porta {port}</option>)}</select></label>
          </div>
          <div className="parts-editor"><div className="parts-label">PEÇAS INSTALADAS · {assemblyParts.length}</div><div className="parts-list">{assemblyParts.map(part=><span key={part.id}>{part.kind.replace('-',' ')}{part.port?' · '+part.port:''}</span>)}</div><button disabled={running||loading} className="apply-config" onClick={toggleBeam}>{assemblyParts.some(part=>part.kind==='beam')?'Remover viga estrutural':'Adicionar viga estrutural'}</button></div>
          <button disabled={running||loading} className="apply-config" onClick={applyRobotConfig}>Validar montagem e aplicar</button>
        </div>
        <div className="sensor-strip">
          <div><ScanEye size={15}/><span>DISTÂNCIA</span><b>{distance.toFixed(2)} m</b></div>
          <div><Radio size={15}/><span>COR</span><b><i style={{background:color}}/> {color.toUpperCase()}</b></div>
          <div><Activity size={15}/><span>HEADING</span><b>{heading.toFixed(1)}°</b></div>
          <div><Activity size={15}/><span>GIROSCÓPIO</span><b>{gyro.toFixed(1)}°/s</b></div>
        </div>
        <div className="mission-tracker">{missions.map(mission=><div key={mission.id} className={mission.completed?'mission-done':'mission-pending'}><span>{mission.completed?'✓':'○'}</span><small>{mission.title}</small><b>{mission.points} pts</b></div>)}</div>
      </div>
      <aside className="code-panel">
        <div className="panel-heading code-heading"><div><span className="eyebrow">PROGRAMAÇÃO</span><h2><Code2 size={19}/> Editor Pybricks</h2></div><span className="python-badge">PYTHON 3.12</span></div>
        <div className="editor-toolbar"><span><span className="file-dot"/> main.py</span><span>PYODIDE · WORKER</span></div>
        <div className="editor-wrap"><div className="line-numbers">{code.split('\n').map((_,i)=><span key={i}>{i+1}</span>)}</div><textarea spellCheck={false} value={code} onChange={e=>setCode(e.target.value)} aria-label="Editor de código Python" disabled={running||loading}/></div>
        <div className="editor-note"><Activity size={14}/> Python real no Worker · API Pybricks parcial</div>
        <div className="action-row"><button className="run-button" onClick={runCode} disabled={running||loading}><Play size={16} fill="currentColor"/> {loading?'Carregando Python...':'Executar Python'}</button><button className="stop-button" onClick={()=>stopRuntime()} disabled={!running&&!loading}><Square size={14}/> Parar</button></div>
        <div className="console"><div className="console-title"><span>CONSOLE</span><span>{loading?'● LOADING':running?'● RUNNING':'● READY'}</span></div><div className="console-output">{log.slice(-6).map((line,i)=><p key={i}><span>›</span> {line}</p>)}</div></div>
      </aside>
    </section>
    <footer><span>ROBOSIM FLL <b>·</b> LABORATÓRIO VIRTUAL DE ROBÓTICA</span><span>BUILD 0.2.0 <b>·</b> EXPERIMENTAL</span></footer>
  </main>
}