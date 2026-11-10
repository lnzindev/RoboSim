import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import Editor from '@monaco-editor/react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Grid, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import {
  Activity, Bot, Check, ChevronDown, Code2, Cpu, Download, Gauge, Pause, Plus, Trash2,
  Play, RotateCcw, Save, StepForward, Square, Timer, Upload, Wifi,
} from 'lucide-react'
import * as THREE from 'three'
import { customArena, practiceArena } from './sim/arena'
import { collectMissionEvents } from './sim/scoring'
import { readSensorSnapshot } from './sim/sensors'
import { FIXED_STEP_SECONDS, createInitialRobot, setDriveSpeeds, stepRobot, stopRobot } from './sim/physics'
import type { ArenaDefinition, RobotConfig, RobotState, SensorMount, SimulationCommand } from './sim/types'
import { motorSpeedToLinearMmS } from './sim/drivebase'
import { spikePrimePreset } from './robot/presets'
import { createProject, parseProject, RobotConfigSchema } from './robot/project'
import { executePython } from './runtime/pythonRuntime'

const STARTER_CODE = `from pybricks.hubs import PrimeHub
from pybricks.pupdevices import Motor, ColorSensor, UltrasonicSensor
from pybricks.robotics import DriveBase
from pybricks.parameters import Port
from pybricks.tools import wait

hub = PrimeHub()
left_motor = Motor(Port.B)
right_motor = Motor(Port.C)
drive_base = DriveBase(left_motor, right_motor, 56, 120)

# Ajustes: velocidade, aceleracao, taxa de giro, aceleracao de giro
drive_base.settings(400, 600, 180, 360)

drive_base.straight(450)
drive_base.turn(90)
drive_base.straight(250)
drive_base.stop()
`

type RunStatus = 'idle' | 'loading' | 'running' | 'paused'

function appendMotorStop(command: Extract<SimulationCommand, { type: 'motorTimed' }>): SimulationCommand[] {
  return [
    { type: 'motor', port: command.port, speedDegS: command.speedDegS },
    { type: 'wait', durationMs: command.durationMs },
    { type: 'motor', port: command.port, speedDegS: 0 },
  ]
}

function prepareCommands(commands: SimulationCommand[]): SimulationCommand[] {
  return commands.flatMap((command) => command.type === 'motorTimed' ? appendMotorStop(command) : [command])
}

function RobotModel({ state, config, arena }: { state: RobotState; config: RobotConfig; arena: ArenaDefinition }) {
  const group = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!group.current) return
    group.current.position.set(state.x - arena.width / 2, 0.09, state.z - arena.depth / 2)
    group.current.rotation.y = state.heading
  })
  const wheelOffset = Math.max(0.065, Math.min(0.19, config.axleTrackMm / 2000))
  return (
    <group ref={group}>
      <mesh castShadow position={[0, 0.11, 0]}>
        <boxGeometry args={[config.chassisWidthMm / 1000, 0.16, config.chassisLengthMm / 1000]} />
        <meshStandardMaterial color="#e7edf4" roughness={0.48} />
      </mesh>
      <mesh castShadow position={[0, 0.205, -0.02]}>
        <boxGeometry args={[0.22, 0.055, 0.25]} />
        <meshStandardMaterial color="#1d2d40" />
      </mesh>
      <mesh position={[0, 0.24, -0.02]}>
        <boxGeometry args={[0.105, 0.025, 0.09]} />
        <meshStandardMaterial color="#41d9a5" emissive="#0d704e" emissiveIntensity={0.5} />
      </mesh>
      {([-1, 1] as const).map((side) => (
        <mesh key={side} castShadow position={[side * wheelOffset, 0.055, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.09, 0.09, 0.055, 24]} />
          <meshStandardMaterial color="#151b24" roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0, 0.075, 0.225]}>
        <boxGeometry args={[0.105, 0.07, 0.07]} />
        <meshStandardMaterial color="#e9ad48" />
      </mesh>
      <mesh position={[0, 0.16, config.chassisLengthMm / 2000 + 0.02]}>
        <sphereGeometry args={[0.028, 12, 12]} />
        <meshStandardMaterial color="#70c9f2" emissive="#28739a" emissiveIntensity={0.4} />
      </mesh>
      {config.sensorMounts.map((mount) => (
        <mesh key={mount.id} castShadow
          position={[mount.xMm / 1000, 0.19, mount.zMm / 1000]}
          rotation={[0, mount.rotationDeg * Math.PI / 180, 0]}>
          <boxGeometry args={[0.065, 0.045, 0.07]} />
          <meshStandardMaterial
            color={mount.kind === 'color' ? '#4fca91' : mount.kind === 'distance' ? '#65a9ee' : '#e8b45b'}
            emissive={mount.kind === 'color' ? '#174b32' : mount.kind === 'distance' ? '#173d60' : '#60451a'}
            emissiveIntensity={0.25}
          />
        </mesh>
      ))}
    </group>
  )
}

function ArenaScene({ state, config, arena }: { state: RobotState; config: RobotConfig; arena: ArenaDefinition }) {
  return (
    <>
      <color attach="background" args={['#101a26']} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[3, 6, 4]} intensity={1.7} castShadow shadow-mapSize={[1024, 1024]} />
      <PerspectiveCamera makeDefault position={[3.8, 4.1, 4.8]} fov={43} />
      <mesh receiveShadow position={[0, -0.035, 0]}>
        <boxGeometry args={[arena.width, 0.06, arena.depth]} />
        <meshStandardMaterial color="#1c3336" roughness={0.94} />
      </mesh>
      <Grid
        position={[0, 0.001, 0]}
        args={[arena.width, arena.depth]}
        cellSize={0.15}
        cellThickness={0.55}
        cellColor="#41645d"
        sectionSize={0.5}
        sectionColor="#6f9681"
        fadeDistance={7}
        infiniteGrid={false}
      />
      <mesh position={[0, 0.025, -arena.depth / 2]}>
        <boxGeometry args={[arena.width, 0.05, 0.035]} />
        <meshStandardMaterial color="#eee8d9" />
      </mesh>
      <mesh position={[0, 0.025, arena.depth / 2]}>
        <boxGeometry args={[arena.width, 0.05, 0.035]} />
        <meshStandardMaterial color="#eee8d9" />
      </mesh>
      <mesh position={[-arena.width / 2, 0.025, 0]}>
        <boxGeometry args={[0.035, 0.05, arena.depth]} />
        <meshStandardMaterial color="#eee8d9" />
      </mesh>
      <mesh position={[arena.width / 2, 0.025, 0]}>
        <boxGeometry args={[0.035, 0.05, arena.depth]} />
        <meshStandardMaterial color="#eee8d9" />
      </mesh>
      {arena.obstacles.map((obstacle) => (
        <mesh
          key={obstacle.id}
          castShadow
          receiveShadow
          position={[obstacle.x - arena.width / 2, obstacle.height / 2 + 0.01, obstacle.z - arena.depth / 2]}
        >
          <boxGeometry args={[obstacle.width, obstacle.height, obstacle.depth]} />
          <meshStandardMaterial color={obstacle.color} roughness={0.65} />
        </mesh>
      ))}
      {arena.targets.map((target) => (
        <group key={target.id} position={[target.x - arena.width / 2, 0.012, target.z - arena.depth / 2]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[target.radius, target.radius, 0.018, 32]} />
            <meshStandardMaterial color={target.color} transparent opacity={0.8} />
          </mesh>
          <mesh position={[0, 0.025, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.035, 20]} />
            <meshStandardMaterial color="#f1eee6" />
          </mesh>
        </group>
      ))}
      <RobotModel state={state} config={config} arena={arena} />
      <OrbitControls target={[0, 0, 0]} minDistance={2.7} maxDistance={7.5} maxPolarAngle={Math.PI / 2.05} />
    </>
  )
}

function formatClock(seconds: number): string {
  const total = Math.max(0, Math.ceil(seconds))
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function loadSavedCode(): string {
  try { return localStorage.getItem('robosim:code') || STARTER_CODE } catch { return STARTER_CODE }
}

function loadSavedArena(): string {
  try { return localStorage.getItem('robosim:arena') || practiceArena.id } catch { return practiceArena.id }
}

function loadSavedConfig(): RobotConfig {
  try {
    const raw = localStorage.getItem('robosim:robot')
    return raw ? RobotConfigSchema.parse(JSON.parse(raw)) : spikePrimePreset
  } catch {
    return spikePrimePreset
  }
}

export default function App() {
  const [code, setCode] = useState(loadSavedCode)
  const [robotConfig, setRobotConfig] = useState<RobotConfig>(loadSavedConfig)
  const [arenaId, setArenaId] = useState(loadSavedArena)
  const arena = arenaId === customArena.id ? customArena : practiceArena
  const [robotState, setRobotState] = useState<RobotState>(createInitialRobot)
  const [status, setStatus] = useState<RunStatus>('idle')
  const [remaining, setRemaining] = useState(150)
  const [missionScore, setMissionScore] = useState(0)
  const [completedMissions, setCompletedMissions] = useState<string[]>([])
  const [logs, setLogs] = useState<string[]>(['Runtime pronto. Carregue um programa para iniciar.'])
  const [showRobotSettings, setShowRobotSettings] = useState(false)
  const queueRef = useRef<SimulationCommand[]>([])
  const waitRemainingRef = useRef(0)
  const stateRef = useRef<RobotState>(createInitialRobot())
  const remainingRef = useRef(150)
  const completedRef = useRef<Set<string>>(new Set())
  const lastCollisionRef = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const runControllerRef = useRef<AbortController | null>(null)

  const addLog = useCallback((message: string) => {
    setLogs((current) => [...current.slice(-39), message])
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('robosim:code', code)
      localStorage.setItem('robosim:robot', JSON.stringify(robotConfig))
      localStorage.setItem('robosim:arena', arena.id)
    } catch {
      addLog('Não foi possível salvar automaticamente neste navegador.')
    }
  }, [code, robotConfig, arena, addLog])

  const advanceOneTick = useCallback((deltaSeconds: number) => {
    let next = stateRef.current
    const command = queueRef.current[0]
    if (command?.type === 'drive') {
      next = setDriveSpeeds(next, command.leftMmS, command.rightMmS, robotConfig)
      queueRef.current.shift()
    } else if (command?.type === 'motor') {
      const wheelSpeed = motorSpeedToLinearMmS(command.speedDegS, robotConfig.wheelDiameterMm)
      const left = command.port === robotConfig.leftMotorPort ? wheelSpeed : next.leftSpeedMmS
      const right = command.port === robotConfig.rightMotorPort ? wheelSpeed : next.rightSpeedMmS
      next = setDriveSpeeds(next, left, right, robotConfig)
      queueRef.current.shift()
    } else if (command?.type === 'wait') {
      if (waitRemainingRef.current <= 0) waitRemainingRef.current = Math.max(0, command.durationMs)
      waitRemainingRef.current -= deltaSeconds * 1000
      if (waitRemainingRef.current <= 0) {
        queueRef.current.shift()
        waitRemainingRef.current = 0
      }
    } else if (command?.type === 'stop') {
      next = stopRobot(next)
      queueRef.current.shift()
    } else if (command) {
      queueRef.current.shift()
    }

    next = stepRobot(next, robotConfig, arena, deltaSeconds)
    const events = collectMissionEvents(next, arena, completedRef.current)
    if (events.length) {
      for (const event of events) {
        completedRef.current.add(event.id)
        addLog(`Missão concluída: ${event.label} (+${event.points} pts)`)
      }
      setCompletedMissions(Array.from(completedRef.current))
      setMissionScore((value) => value + events.reduce((total, event) => total + event.points, 0))
    }
    if (next.collisionCount > lastCollisionRef.current) {
      lastCollisionRef.current = next.collisionCount
      addLog('Colisão detectada. Motores interrompidos por segurança.')
    }
    stateRef.current = next

    const nextRemaining = Math.max(0, remainingRef.current - deltaSeconds)
    if (Math.floor(nextRemaining) !== Math.floor(remainingRef.current)) setRemaining(nextRemaining)
    remainingRef.current = nextRemaining

    if (nextRemaining <= 0) {
      queueRef.current = []
      stateRef.current = stopRobot(stateRef.current)
      setStatus('idle')
      setRobotState(stateRef.current)
      addLog('Tempo de rodada encerrado: 2min30s.')
      return
    }
    if (queueRef.current.length === 0) {
      stateRef.current = stopRobot(stateRef.current)
      setStatus('idle')
      setRobotState(stateRef.current)
      addLog('Programa concluído. Motores parados.')
      return
    }
  }, [robotConfig, arena, addLog])

  useEffect(() => {
    if (status !== 'running') return
    let frame = 0
    let last = performance.now()
    let accumulator = 0
    let renderAccumulator = 0
    const tick = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.1)
      last = now
      accumulator += delta
      renderAccumulator += delta
      let steps = 0
      while (accumulator >= FIXED_STEP_SECONDS && steps < 6) {
        advanceOneTick(FIXED_STEP_SECONDS)
        accumulator -= FIXED_STEP_SECONDS
        steps += 1
      }
      if (renderAccumulator >= 1 / 24) {
        setRobotState(stateRef.current)
        renderAccumulator = 0
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [status, advanceOneTick])

  const sensorSnapshot = readSensorSnapshot(robotState, arena)
  const averageSpeed = Math.round((Math.abs(robotState.leftSpeedMmS) + Math.abs(robotState.rightSpeedMmS)) / 2)
  const heading = ((robotState.heading * 180 / Math.PI) % 360 + 360) % 360

  async function runProgram() {
    if (status === 'loading' || status === 'running') return
    setStatus('loading')
    addLog('Iniciando runtime Python...')
    const initial = createInitialRobot()
    stateRef.current = initial
    setRobotState(initial)
    remainingRef.current = 150
    setRemaining(150)
    completedRef.current = new Set()
    setCompletedMissions([])
    setMissionScore(0)
    lastCollisionRef.current = 0
    const controller = new AbortController()
    runControllerRef.current = controller
    try {
      const commands = await executePython(
        code,
        {
          ...readSensorSnapshot(initial, arena),
          motorPorts: { left: robotConfig.leftMotorPort, right: robotConfig.rightMotorPort },
          sensorMounts: robotConfig.sensorMounts,
        },
        addLog,
        30_000,
        controller.signal,
      )
      if (controller.signal.aborted) return
      const prepared = prepareCommands(commands)
      if (!prepared.length) {
        setStatus('idle')
        addLog('O programa terminou sem enviar comandos ao simulador.')
        return
      }
      queueRef.current = prepared
      waitRemainingRef.current = 0
      addLog(`Python executado. ${prepared.length} comandos enviados à simulação.`)
      setStatus('running')
    } catch (error) {
      if (controller.signal.aborted) return
      setStatus('idle')
      addLog(`Erro Python: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      if (runControllerRef.current === controller) runControllerRef.current = null
    }
  }

  function pauseProgram() {
    if (status !== 'running') return
    setStatus('paused')
    addLog('Simulação pausada.')
  }

  function continueProgram() {
    if (status !== 'paused') return
    setStatus('running')
    addLog('Simulação retomada.')
  }

  function stepProgram() {
    if (status !== 'paused') return
    advanceOneTick(FIXED_STEP_SECONDS)
    setRobotState(stateRef.current)
  }

  function stopProgram() {
    runControllerRef.current?.abort()
    runControllerRef.current = null
    queueRef.current = []
    waitRemainingRef.current = 0
    stateRef.current = stopRobot(stateRef.current)
    setRobotState(stateRef.current)
    setStatus('idle')
    addLog('Execução interrompida pelo usuário.')
  }

  function resetSimulation() {
    runControllerRef.current?.abort()
    runControllerRef.current = null
    queueRef.current = []
    waitRemainingRef.current = 0
    const initial = createInitialRobot()
    stateRef.current = initial
    setRobotState(initial)
    setStatus('idle')
    remainingRef.current = 150
    setRemaining(150)
    completedRef.current = new Set()
    setCompletedMissions([])
    setMissionScore(0)
    lastCollisionRef.current = 0
    addLog('Arena e robô reiniciados.')
  }

  function exportProject() {
    const project = createProject(code, robotConfig, arena.id)
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'robosim-project.json'
    anchor.click()
    URL.revokeObjectURL(url)
    addLog('Projeto exportado em JSON.')
  }

  async function importProject(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const project = parseProject(JSON.parse(await file.text()))
      setCode(project.code)
      setRobotConfig(project.robot)
      setArenaId(project.arenaId)
      addLog(`Projeto importado: ${project.name}`)
    } catch (error) {
      addLog(`Arquivo inválido: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      event.target.value = ''
    }
  }

  function updateConfig<K extends keyof RobotConfig>(key: K, value: RobotConfig[K]) {
    const updated = { ...robotConfig, [key]: value }
    const parsed = RobotConfigSchema.safeParse(updated)
    if (parsed.success) setRobotConfig(parsed.data)
    else addLog(parsed.error.issues[0]?.message || 'Configuração inválida.')
  }

  function addSensor(kind: SensorMount['kind']) {
    const occupied = new Set([
      robotConfig.leftMotorPort,
      robotConfig.rightMotorPort,
      ...robotConfig.sensorMounts.map((sensor) => sensor.port),
    ])
    const port = (['A', 'B', 'C', 'D', 'E', 'F'] as const).find((item) => !occupied.has(item))
    if (!port) {
      addLog('Todas as portas do hub já estão ocupadas.')
      return
    }
    const sensor: SensorMount = {
      id: 'sensor-' + kind + '-' + Date.now(),
      kind,
      port,
      xMm: 0,
      zMm: robotConfig.chassisLengthMm / 2 + 18,
      rotationDeg: 0,
    }
    updateConfig('sensorMounts', [...robotConfig.sensorMounts, sensor])
    addLog('Sensor ' + kind + ' adicionado na porta ' + port + '.')
  }

  function updateSensor(id: string, patch: Partial<SensorMount>) {
    updateConfig('sensorMounts', robotConfig.sensorMounts.map((sensor) =>
      sensor.id === id ? { ...sensor, ...patch } : sensor,
    ))
  }

  function removeSensor(id: string) {
    updateConfig('sensorMounts', robotConfig.sensorMounts.filter((sensor) => sensor.id !== id))
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Bot size={23} /></div>
          <div><strong>RoboSim <span>FLL</span></strong><small>ROBOTICS SIMULATION LAB</small></div>
        </div>
        <div className="top-status"><span className="live-dot" /> BROWSER SIMULATION <span className="version">V0.2.0</span></div>
        <div className="top-actions">
          <input ref={fileInputRef} type="file" accept="application/json,.json" hidden onChange={importProject} />
          <button className="icon-button" title="Importar projeto" onClick={() => fileInputRef.current?.click()}><Upload size={16} /></button>
          <button className="icon-button" title="Exportar projeto" onClick={exportProject}><Download size={16} /></button>
          <button className="icon-button" title="Reiniciar arena" onClick={resetSimulation}><RotateCcw size={16} /></button>
        </div>
      </header>

      <div className="workspace">
        <section className="left-column">
          <div className="sim-panel">
            <div className="panel-heading">
              <div><span className="eyebrow">AMBIENTE DE TESTE · NÃO OFICIAL</span><h1>{arena.name}</h1></div>
              <div className="heading-pills"><span><span className="live-dot" /> 3D ATIVO</span><select className="arena-select" aria-label="Selecionar arena" value={arena.id} onChange={(event) => setArenaId(event.target.value)}><option value="robosim-practice-v1">FLL treino</option><option value="robosim-custom-v1">Arena livre</option></select><span>{arena.width} × {arena.depth} M</span></div>
            </div>
            <div className="viewport">
              <Canvas shadows dpr={[1, 1.6]}>
                <ArenaScene state={robotState} config={robotConfig} arena={arena} />
              </Canvas>
              <div className="viewport-tag"><span className="live-dot" /> LIVE VIEW</div>
              <div className="axis-tag">X {robotState.x.toFixed(2)} · Z {robotState.z.toFixed(2)} · {heading.toFixed(0)}°</div>
            </div>
            <div className="sim-footer">
              <div className="metric"><Gauge size={16} /><div><small>VELOCIDADE MÉDIA</small><strong>{averageSpeed} <i>MM/S</i></strong></div></div>
              <div className="metric"><Timer size={16} /><div><small>TEMPO RESTANTE</small><strong>{formatClock(remaining)}</strong></div></div>
              <div className="metric"><Activity size={16} /><div><small>PONTUAÇÃO DEMO</small><strong>{missionScore} <i>PTS</i></strong></div></div>
            </div>
          </div>

          <section className="telemetry-panel">
            <div className="section-heading"><div><span className="eyebrow">TELEMETRIA</span><h2>Estado do robô</h2></div><span className="telemetry-live"><span className="live-dot" /> LIVE</span></div>
            <div className="telemetry-grid">
              <div><small>HEADING</small><strong>{sensorSnapshot.headingDeg.toFixed(1)}°</strong></div>
              <div><small>DISTÂNCIA</small><strong>{Math.round(sensorSnapshot.distanceMm)} mm</strong></div>
              <div><small>COR</small><strong>{sensorSnapshot.color}</strong></div>
              <div><small>REFLEXÃO</small><strong>{sensorSnapshot.reflection}%</strong></div>
              <div><small>MOTOR {robotConfig.leftMotorPort}</small><strong>{Math.round(robotState.leftSpeedMmS)} mm/s</strong></div>
              <div><small>MOTOR {robotConfig.rightMotorPort}</small><strong>{Math.round(robotState.rightSpeedMmS)} mm/s</strong></div>
            </div>
          </section>

          <section className="builder-panel">
            <button className="builder-toggle" onClick={() => setShowRobotSettings((visible) => !visible)}>
              <span><Cpu size={17} /> Configuração do robô <small>PRESET SPIKE PRIME</small></span>
              <ChevronDown size={17} className={showRobotSettings ? 'chevron open' : 'chevron'} />
            </button>
            {showRobotSettings && (
              <>
              <div className="builder-fields">
                <label>Largura do chassis (mm)<input type="number" min="80" max="400" value={robotConfig.chassisWidthMm} onChange={(event) => updateConfig('chassisWidthMm', Number(event.target.value))} /></label>
                <label>Comprimento do chassis (mm)<input type="number" min="80" max="500" value={robotConfig.chassisLengthMm} onChange={(event) => updateConfig('chassisLengthMm', Number(event.target.value))} /></label>
                <label>Diâmetro da roda (mm)<input type="number" min="20" max="200" value={robotConfig.wheelDiameterMm} onChange={(event) => updateConfig('wheelDiameterMm', Number(event.target.value))} /></label>
                <label>Distância entre rodas (mm)<input type="number" min="40" max="300" value={robotConfig.axleTrackMm} onChange={(event) => updateConfig('axleTrackMm', Number(event.target.value))} /></label>
                <label>Porta motor esquerdo<select value={robotConfig.leftMotorPort} onChange={(event) => updateConfig('leftMotorPort', event.target.value as RobotConfig['leftMotorPort'])}>{['A','B','C','D','E','F'].map((port) => <option key={port}>{port}</option>)}</select></label>
                <label>Porta motor direito<select value={robotConfig.rightMotorPort} onChange={(event) => updateConfig('rightMotorPort', event.target.value as RobotConfig['rightMotorPort'])}>{['A','B','C','D','E','F'].map((port) => <option key={port}>{port}</option>)}</select></label>
                <label>Velocidade máxima (mm/s)<input type="number" min="50" max="1500" value={robotConfig.maxSpeedMmS} onChange={(event) => updateConfig('maxSpeedMmS', Number(event.target.value))} /></label>
              </div>
              <div className="sensor-builder">
                <div className="sensor-builder-heading"><strong>Sensores montados</strong><span>{robotConfig.sensorMounts.length}/10</span></div>
                {robotConfig.sensorMounts.length === 0 && <p className="empty-missions">Nenhum sensor conectado.</p>}
                {robotConfig.sensorMounts.map((sensor) => (
                  <div className="sensor-row" key={sensor.id}>
                    <span className={'sensor-kind ' + sensor.kind} />
                    <strong>{sensor.kind === 'color' ? 'Cor' : sensor.kind === 'distance' ? 'Distância' : 'Força'}</strong>
                    <select aria-label={'Porta do sensor ' + sensor.id} value={sensor.port} onChange={(event) => updateSensor(sensor.id, { port: event.target.value as SensorMount['port'] })}>
                      {(['A','B','C','D','E','F'] as const).map((port) => <option key={port} value={port}>{port}</option>)}
                    </select>
                    <button className="remove-sensor" title="Remover sensor" onClick={() => removeSensor(sensor.id)}><Trash2 size={14} /></button>
                  </div>
                ))}
                <div className="sensor-add-actions">
                  <button onClick={() => addSensor('color')} disabled={robotConfig.sensorMounts.length >= 10}><Plus size={13} /> Cor</button>
                  <button onClick={() => addSensor('distance')} disabled={robotConfig.sensorMounts.length >= 10}><Plus size={13} /> Distância</button>
                  <button onClick={() => addSensor('force')} disabled={robotConfig.sensorMounts.length >= 10}><Plus size={13} /> Força</button>
                </div>
              </div>
              </>
            )}
          </section>

          <section className="missions-panel">
            <div className="section-heading"><div><span className="eyebrow">OBJETIVOS DA ARENA</span><h2>Missões de demonstração</h2></div><span className="demo-tag">DEMO</span></div>
            <div className="mission-list">
              {arena.targets.length === 0 ? <p className="empty-missions">Arena livre: sem missões ou pontuação automática.</p> : arena.targets.map((target) => {
                const done = completedMissions.includes(target.id)
                return <div className={done ? 'mission-item completed' : 'mission-item'} key={target.id}>
                  <span className="mission-color" style={{ background: target.color }} />
                  <span>{target.label}</span><strong>+{target.points} pts</strong>{done && <Check size={15} />}
                </div>
              })}
            </div>
          </section>
        </section>

        <aside className="code-panel">
          <div className="panel-heading code-heading">
            <div><span className="eyebrow">PROGRAMAÇÃO</span><h2><Code2 size={19} /> Editor Pybricks</h2></div>
            <span className="python-badge">PYTHON</span>
          </div>
          <div className="editor-toolbar"><span><span className="file-dot" /> main.py</span><span>PYODIDE · WEB WORKER</span></div>
          <div className="editor-wrap">
            <Editor
              height="100%"
              language="python"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value ?? '')}
              options={{
                fontSize: 12,
                lineHeight: 21,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: 'off',
                padding: { top: 14, bottom: 14 },
                fontFamily: 'DM Mono, Consolas, monospace',
                suggestOnTriggerCharacters: true,
              }}
            />
          </div>
          <div className="editor-note"><Wifi size={14} /> Python real via Pyodide. Compatibilidade Pybricks parcial.</div>
          <div className="action-row">
            {status === 'running' ? (
              <button className="pause-button" onClick={pauseProgram}><Pause size={15} fill="currentColor" /> Pausar</button>
            ) : status === 'paused' ? (
              <button className="run-button" onClick={continueProgram}><Play size={15} fill="currentColor" /> Continuar</button>
            ) : (
              <button className="run-button" onClick={runProgram} disabled={status === 'loading'}><Play size={15} fill="currentColor" /> {status === 'loading' ? 'Carregando Python...' : 'Executar código'}</button>
            )}
            <button className="step-button" onClick={stepProgram} disabled={status !== 'paused'} title="Avançar um passo de simulação"><StepForward size={15} /></button>
            <button className="stop-button" onClick={stopProgram} disabled={status === 'idle' && queueRef.current.length === 0}><Square size={13} /> Parar</button>
          </div>
          <div className="runtime-state"><span className={status === 'running' ? 'state-light running' : status === 'loading' ? 'state-light loading' : 'state-light'} />{status === 'running' ? 'SIMULAÇÃO EM EXECUÇÃO' : status === 'paused' ? 'SIMULAÇÃO PAUSADA' : status === 'loading' ? 'CARREGANDO RUNTIME' : 'AGUARDANDO EXECUÇÃO'}<span className="runtime-time">{formatClock(remaining)}</span></div>
          <div className="console">
            <div className="console-title"><span>CONSOLE DE EXECUÇÃO</span><span>● {status === 'running' ? 'RUNNING' : 'READY'}</span></div>
            <div className="console-output">{logs.slice(-7).map((line, index) => <p key={index}><span>›</span> {line}</p>)}</div>
          </div>
          <div className="compat-card">
            <div><Save size={15} /><strong>Salvamento local ativo</strong></div>
            <p>Seu código e a configuração dos motores ficam salvos neste navegador. Use Exportar para criar uma cópia do projeto.</p>
          </div>
        </aside>
      </div>
      <footer><span>ROBOSIM FLL <b>·</b> LABORATÓRIO VIRTUAL DE ROBÓTICA</span><span>V0.2.0 <b>·</b> PYODIDE RUNTIME <b>·</b> EXPERIMENTAL</span></footer>
    </main>
  )
}
