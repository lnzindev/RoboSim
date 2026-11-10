# RoboSim FLL

Laboratório virtual para testar ideias de robótica FLL em uma arena 3D.

## V0.1.0 - Foundation

- Arena 3D inicial com limites e elementos de missão demonstrativos.
- Robô diferencial virtual com chassis, rodas e indicador de posição.
- Câmera orbital para observar a arena.
- Editor Python no navegador.
- Interpretador experimental de comandos de movimento: `drive(left, right)`, `wait(ms)` e `stop()`.
- Cronômetro de rodada e console de execução.

> **Importante:** nesta versão, o editor ainda não executa Python real nem implementa o runtime oficial Pybricks. O interpretador reconhece somente os comandos listados. A compatibilidade real com Pybricks, sensores, física de colisão e construtor LEGO fazem parte das próximas etapas.

## Executar localmente

Requer Node.js 20+.

```bash
npm install
npm run dev
```

Para validar o build:

```bash
npm run build
```

## Stack

- React + TypeScript + Vite
- Three.js + React Three Fiber + Drei
- Lucide React

## Próximas etapas

1. Runtime Python real em Web Worker (Pyodide) com camada de compatibilidade Pybricks.
2. Física de colisão e interação com objetos de missão.
3. Sensores virtuais e portas do hub.
4. Construtor modular de robôs LEGO.
5. Arenas oficiais por temporada e sistema de pontuação FLL.
