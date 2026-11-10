# RoboSim FLL

Laboratório virtual para construir, programar e testar robôs LEGO em uma arena 3D inspirada na FIRST LEGO League.

## Estado atual - V0.2 em desenvolvimento

- Arena 3D de treino com limites e objetos demonstrativos.
- Robô diferencial virtual com modelo de chassis, rodas e hub; diâmetro de roda e distância entre eixos alteram o modelo 3D.
- Configurador de tração para portas dos motores, portas dos sensores, diâmetro das rodas e distância entre eixos.
- Modelo de montagem LEGO com validação de portas, hub e referências entre componentes.
- Física Rapier na cena para corpos e detecção de contato.
- Execução de Python via Pyodide em Web Worker.
- Camada de compatibilidade inicial para imports Pybricks: `Motor`, `DriveBase`, `UltrasonicSensor`, `ColorSensor`, `Port`, `Color`, `Stop`, `Direction`, `PrimeHub` e `wait`.
- Controle diferencial por DriveBase com portas de motor configuráveis A-F.
- Sensores virtuais de distância, cor, heading e giroscópio na telemetria e sensores de distância/cor/IMU inicial acessíveis no Python.
- Cronômetro regressivo de 2min30s, console e reset.
- Testes unitários para movimento, sensores, pontuação e montagem LEGO.
- Smoke tests CPython e integração Pyodide real para a camada Pybricks, sensores, portas de motor, colisões e erros de programa.

## Importante: compatibilidade

O runtime é uma camada de compatibilidade educacional, não o firmware Pybricks e não uma emulação perfeita do hub físico. Os métodos de encoder, IMU, sensores conectados e comportamento elétrico ainda não têm equivalência real. A API suportada está documentada em [src/runtime/README.md](src/runtime/README.md). O runtime carrega os assets Pyodide do CDN oficial, então a primeira execução exige conexão com a internet.

## Requisitos e execução

Requer Node.js 20+.

```bash
npm install
npm run dev
```

Verificações:

```bash
python scripts/test_python_shim.py
node scripts/test_pyodide_runtime.mjs
npm run typecheck
npm test
npm run build
```

## Stack

- React 19 + TypeScript + Vite
- Three.js + React Three Fiber + Drei
- Rapier via @react-three/rapier
- Pyodide em Web Worker
- Vitest

## Arquitetura inicial

- `src/App.tsx`: interface e composição da simulação.
- `src/runtime/`: protocolo de mensagens, Worker Pyodide e camada Pybricks.
- `src/sim/`: movimento, sensores, pontuação e testes.
- `src/robot/`: modelo de montagem e validação de componentes LEGO.
- `docs/IMPLEMENTATION_PLAN.md`: escopo e checklist de evolução.

## Próximas etapas

1. Expandir a API de sensores/IMU e validar fidelidade em programas de referência Pybricks.
2. Refinar colisões, dinâmica de motores, aceleração e parâmetros físicos.
3. Construtor de robôs com portas e componentes configuráveis.
4. Arenas e missões por temporada, com regras e pontuação versionadas.
5. Replay determinístico, debugger e telemetria ampliada.
6. Validação de build e testes em CI, corrigindo cada falha encontrada.
