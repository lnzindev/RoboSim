# RoboSim FLL

**Laboratório virtual de robótica FLL:** construa um robô, programe em Python e teste movimentos em uma arena 3D.

> Projeto experimental e independente. Não é um produto oficial da LEGO ou da FIRST. A API disponível é uma camada de compatibilidade parcial inspirada no Pybricks; ela não substitui o firmware MicroPython instalado em um hub real.

## Requisitos

- Node.js 20 ou superior
- npm 10 ou superior
- Navegador moderno com WebGL 2 e Web Workers
- Conexão com a internet na primeira execução do runtime para carregar o pacote Pyodide do CDN

## Desenvolvimento

```bash
npm install
npm run dev
```

Acesse o endereço mostrado pelo Vite. A execução Python acontece no navegador, em um Web Worker separado da interface.

## Verificações

```bash
npm run typecheck
npm test
npm run build
```

## Funcionalidades desta versão

- Arena 3D de treino com dimensões configuráveis, bordas, obstáculos e alvos demonstrativos.
- Robô diferencial virtual com configuração de diâmetro de roda, distância entre rodas e portas dos motores.
- Física determinística em passo fixo, limites do campo e colisão simplificada com obstáculos.
- Editor Monaco com realce de sintaxe Python.
- Pyodide em Web Worker, com timeout e cancelamento por encerramento do Worker.
- Camada de compatibilidade para `Motor`, `DriveBase`, `Port`, `Stop`, `wait`, hub e sensores básicos.
- Sensores virtuais de distância, cor/reflexão e força com leituras relativas à montagem; IMU com heading.
- Console, telemetria, pausa, retomada, passo único, parar e reset.
- Cronômetro de 2min30s e pontos demonstrativos por alvos da arena.
- Duas arenas demonstrativas selecionáveis, com dimensões editáveis no modo livre.
- Exportação/importação de projetos JSON e salvamento local.

## Exemplo

```python
from pybricks.pupdevices import Motor
from pybricks.robotics import DriveBase
from pybricks.parameters import Port

left = Motor(Port.B)
right = Motor(Port.C)
robot = DriveBase(left, right, 56, 120)

robot.settings(400, 600, 180, 360)
robot.straight(500)
robot.turn(90)
robot.straight(300)
robot.stop()
```

O runtime implementa um subconjunto intencional. Chamadas de movimento são convertidas em comandos para o simulador; não existe sincronização de execução instrução-a-instrução com o ambiente real. Leituras de sensores usam o estado enviado ao iniciar a execução do programa. Consulte [docs/PYBRICKS_COMPATIBILITY.md](docs/PYBRICKS_COMPATIBILITY.md).

## Estrutura

- `src/sim`: física, arena, sensores e pontuação.
- `src/robot`: preset e schema de configuração/projeto.
- `src/runtime`: Worker Python e comunicação com Pyodide.
- `src/App.tsx`: interface e ciclo de execução.
- `data/arenas`: arenas demonstrativas em JSON.
- `docs`: arquitetura, compatibilidade e plano de implementação.

## Segurança e limitações

O código Python é executado no Worker do navegador, não em um servidor privilegiado. O Worker pode ser encerrado pelo aplicativo quando o tempo limite é atingido. Isso reduz o impacto de um loop infinito, mas não transforma código Python arbitrário em código confiável. Não coloque segredos no programa. A camada de compatibilidade bloqueia alguns módulos de acesso externo, mas não deve ser tratada como sandbox de segurança de nível servidor.

A física é uma aproximação educacional. Dimensões, atrito, aceleração, sensores, geometria dos robôs e comportamento das missões ainda precisam ser calibrados contra o hardware e os tapetes reais. As missões atualmente carregadas são apenas demonstrações, não regras oficiais de uma temporada FLL.

## Próximos passos

1. Builder visual completo com conectores e peças LEGO.
2. Sensores com leitura em tempo de simulação e chamadas bloqueantes.
3. Importação de arenas por temporada com validação oficial de dimensões/regras.
4. Replay detalhado e compartilhamento online.
5. Runtime remoto isolado somente se houver necessidade real e sandbox dedicada.
