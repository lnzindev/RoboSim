import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Grid, OrbitControls, PerspectiveCamera, Text } from '@react-three/drei'
import { Activity, Bot, Code2, Gauge, Play, RotateCcw, Square, Timer, Zap } from 'lucide-react'
import * as THREE from 'three'
import { initialRobot, interpretStarterCode, stepRobot, type RobotState } from './sim/robot'

const starter = `from pybricks.pupdevices import Motor
from pybricks.robotics import DriveBase
from pybricks.parameters import Port

# RoboSim FLL - exemplo inicial
# drive(velocidade_esquerda, velocidade_direita)
drive(50, 50)
wait(2000)
drive(0, 0)
`

function RobotModel({ state }: { state: RobotState }) {
  const group = useRef<THREE.Group>(null)
  useFrame(() => {
    if (group.current) {
      group.current.position.set(state.x, 0.17, state.z)
      group.current.rotation.y = state.heading
    }
  })
  return <group ref={group}>
    <mesh castShadow position={[0, 0.12, 0]}><boxGeometry args={[0.48, 0.2, 0.58]} /><meshStandardMaterial color="#e8edf5" roughness={0.42} /></mesh>
    <mesh castShadow position={[0, 0.245, -0.04]}><boxGeometry args={[0.32, 0.08, 0.32]} /><meshStandardMaterial color="#202b3d" /></mesh>
    <mesh position={[0, 0.3, -0.04]}><boxGeometry args={[0.12, 0.035, 0.12]} /><meshStandardMaterial color="#36d7a0" emissive="#0b6848" emissiveIntensity={0.5} /></mesh>
    {[-1, 1].map(side => <mesh key={side} castShadow position={[side * 0.27, 0.03, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.105, 0.105, 0.075, 24]} /><meshStandardMaterial color="#151a23" /></mesh>)}
    <mesh position={[0, 0.07, 0.32]}><boxGeometry args={[0.12, 0.12, 0.08]} /><meshStandardMaterial color="#f3a83b" /></mesh>
    <mesh position={[0, 0.25, 0.34]}><boxGeometry args={[0.05, 0.045, 0.05]} /><meshStandardMaterial color="#f3a83b" /></mesh>
  </group>
}

function Field({ state }: { state: RobotState }) {
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.03, 0]}>
      <planeGeometry args={[3, 3]} /><meshStandardMaterial color="#182b31" roughness={0.92} />
    </mesh>
    <Grid position={[0, 0.002, 0]} args={[3, 3]} cellSize={0.15} cellThickness={0.6} cellColor="#45645e" sectionSize={0.6} sectionColor="#6a9384" fadeDistance={5} infiniteGrid={false} />
    <mesh position={[0, 0.025, -1.48]}><boxGeometry args={[3, 0.05, 0.04]} /><meshStandardMaterial color="#e9e4d2" /></mesh>
    <mesh position={[0, 0.025, 1.48]}><boxGeometry args={[3, 0.05, 0.04]} /><meshStandardMaterial color="#e9e4d2" /></mesh>
    <mesh position={[-1.48, 0.025, 0]}><boxGeometry args={[0.04, 0.05, 3]} /><meshStandardMaterial color="#e9e4d2" /></mesh>
    <mesh position={[1.48, 0.025, 0]}><boxGeometry args={[0.04, 0.05, 3]} /><meshStandardMaterial color="#e9e4d2" /></mesh>
    <mesh position={[-0.92, 0.045, -0.88]}><boxGeometry args={[0.42, 0.09, 0.34]} /><meshStandardMaterial color="#e3a53b" /></mesh>
    <mesh position={[0.92, 0.07, -0.85]}><boxGeometry args={[0.3, 0.14, 0.3]} /><meshStandardMaterial color="#477cce" /></mesh>
    <Text position={[-0.92, 0.11, -0.88]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.1} color="#17202b">MISSÃO 01</Text>
    <RobotModel state={state} />
  </>
}

export default function App() {
  const [robot, setRobot] = useState<RobotState>(initialRobot)
  const [running, setRunning] = useState(false)
  const [code, setCode] = useState(starter)
  const [log, setLog] = useState<string[]>(['Sistema pronto. Aguardando execução.'])
  const [elapsed, setElapsed] = useState(0)
  const [score] = useState(0)
  const queue = useRef<string[]>([])
  const commandTimer = useRef(0)

  useEffect(() => {
    if (!running) return
    let last = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      setElapsed(v => v + dt)
      if (queue.current.length) {
        const cmd = queue.current[0]
        const [kind, a, b] = cmd.split(':')
        if (kind === 'drive') setRobot(s => ({ ...s, leftSpeed: Number(a), rightSpeed: Number(b) }))
        if (kind === 'stop') setRobot(s => ({ ...s, leftSpeed: 0, rightSpeed: 0 }))
        if (kind === 'wait') {
          commandTimer.current += dt * 1000
          if (commandTimer.current >= Number(a)) { queue.current.shift(); commandTimer.current = 0 }
        } else queue.current.shift()
      } else {
        setRobot(s => ({ ...s, leftSpeed: 0, rightSpeed: 0 }))
        setRunning(false)
        setLog(v => [...v, 'Execução concluída.'])
      }
      setRobot(s => stepRobot(s, dt))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running])

  const timeLabel = useMemo(() => {
    const total = Math.floor(elapsed)
    return `2:30 · ${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
  }, [elapsed])

  function runCode() {
    const commands = interpretStarterCode(code)
    if (!commands.length) {
      setLog(v => [...v, 'Nenhum comando reconhecido. Use drive(esquerda, direita), wait(ms) e stop().'])
      return
    }
    queue.current = commands
    commandTimer.current = 0
    setElapsed(0)
    setLog(v => [...v, `Iniciando programa: ${commands.length} comandos reconhecidos.`])
    setRunning(true)
  }
  function reset() {
    setRunning(false); queue.current = []; commandTimer.current = 0
    setRobot(initialRobot); setElapsed(0); setLog(v => [...v, 'Robô reiniciado.'])
  }

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><Bot size={22} /></div><div><strong>RoboSim <span>FLL</span></strong><small>ROBOTICS SIMULATION LAB</small></div></div>
      <div className="top-status"><span className="live-dot" /> SIMULADOR LOCAL <span className="version">V0.1.0</span></div>
      <button className="icon-button" title="Reiniciar simulação" onClick={reset}><RotateCcw size={17} /></button>
    </header>
    <section className="workspace">
      <div className="sim-panel">
        <div className="panel-heading"><div><span className="eyebrow">AMBIENTE DE TESTE</span><h1>Arena FLL</h1></div><div className="heading-pills"><span><span className="live-dot" /> 3D ATIVO</span><span>3 × 3 M</span></div></div>
        <div className="viewport">
          <Canvas shadows dpr={[1, 1.7]}>
            <PerspectiveCamera makeDefault position={[3.6, 3.8, 4.5]} fov={42} />
            <ambientLight intensity={0.75} />
            <directionalLight position={[4, 7, 3]} intensity={2} castShadow shadow-mapSize={[1024, 1024]} />
            <Field state={robot} />
            <OrbitControls target={[0, 0, 0]} minDistance={2.5} maxDistance={8} maxPolarAngle={Math.PI / 2.05} />
          </Canvas>
          <div className="viewport-tag"><span className="live-dot" /> LIVE VIEW</div>
          <div className="axis-tag">X: {robot.x.toFixed(2)} · Z: {robot.z.toFixed(2)}</div>
        </div>
        <div className="sim-footer">
          <div className="metric"><Gauge size={16} /><div><small>VELOCIDADE</small><strong>{Math.round((Math.abs(robot.leftSpeed) + Math.abs(robot.rightSpeed)) / 2)} <i>%</i></strong></div></div>
          <div className="metric"><Timer size={16} /><div><small>TEMPO DE RODADA</small><strong>{timeLabel}</strong></div></div>
          <div className="metric"><Zap size={16} /><div><small>PONTUAÇÃO</small><strong>{score} <i>PTS</i></strong></div></div>
        </div>
      </div>
      <aside className="code-panel">
        <div className="panel-heading code-heading"><div><span className="eyebrow">PROGRAMAÇÃO</span><h2><Code2 size={19} /> Editor Pybricks</h2></div><span className="python-badge">PYTHON</span></div>
        <div className="editor-toolbar"><span><span className="file-dot" /> main.py</span><span>PYBRICKS API · PREVIEW</span></div>
        <div className="editor-wrap"><div className="line-numbers">{code.split('\n').map((_, i) => <span key={i}>{i + 1}</span>)}</div><textarea spellCheck={false} value={code} onChange={e => setCode(e.target.value)} aria-label="Editor de código Python" /></div>
        <div className="editor-note"><Activity size={14} /> Runtime experimental: subconjunto de comandos</div>
        <div className="action-row"><button className="run-button" onClick={runCode} disabled={running}><Play size={16} fill="currentColor" /> Executar código</button><button className="stop-button" onClick={reset}><Square size={14} /> Parar</button></div>
        <div className="console"><div className="console-title"><span>CONSOLE</span><span>● READY</span></div><div className="console-output">{log.slice(-5).map((line, i) => <p key={i}><span>›</span> {line}</p>)}</div></div>
      </aside>
    </section>
    <footer><span>ROBOSIM FLL <b>·</b> LABORATÓRIO VIRTUAL DE ROBÓTICA</span><span>BUILD 0.1.0 <b>·</b> EXPERIMENTAL</span></footer>
  </main>
}