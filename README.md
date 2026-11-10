# RoboSim FLL

**Laboratório virtual de robótica FLL:** construa um robô, programe em Python e teste movimentos em uma arena 3D.

> Projeto experimental e independente. Não é um produto oficial da LEGO ou da FIRST. A API disponível é uma camada de compatibilidade parcial inspirada no Pybricks; ela não substitui o firmware MicroPython instalado em um hub real.

## Requisitos

- Node.js 22.12 ou superior
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

- Três presets: arena de treino com alvos demonstrativos, arena livre redimensionável e referência de campo BIOGLOW 2026–2027.
- Robô diferencial virtual com chassis configurável, diâmetro de roda, distância entre rodas, motores e sensores montados por porta/posição/orientação.
- Física determinística em passo fixo, limites do campo e colisão simplificada com obstáculos.
- Editor Monaco com realce de sintaxe Python.
- Pyodide 0.29.5 em Web Worker, com timeout e cancelamento por encerramento do Worker.
- Camada de compatibilidade para `Motor`, `DriveBase`, `Port`, `Stop`, `wait`, hub e sensores básicos.
- Sensores virtuais de distância, cor/reflexão e força com leituras relativas à montagem; IMU com heading.
- Vista orbital 3D e vista superior para alinhamento de trajetórias.
- Catálogo de 15 missões BIOGLOW e malha de referência de 20 cm em um campo 2,0 × 1,2 m. Modelos 3D e pontuação oficial ainda não implementados.
- Console, telemetria, pausa, retomada, passo único, parar e reset.
- Cronômetro de 2min30s e pontos demonstrativos por alvos da arena.
- Arena livre com dimensões editáveis entre 1 e 8 metros, persistidas localmente e no arquivo do projeto.
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

O runtime implementa um subconjunto intencional. Chamadas de movimento são convertidas em comandos para o simulador; não existe sincronização de execução instrução-a-instrução com o ambiente real. Leituras de sensores usam snapshots do instante de início da execução do programa. Motores sem comando de parada podem continuar girando até colisão, fim da rodada ou interrupção manual. Consulte [docs/PYBRICKS_COMPATIBILITY.md](docs/PYBRICKS_COMPATIBILITY.md).

## Estrutura

- `src/sim`: física, arena, sensores e pontuação.
- `src/robot`: preset e schema de configuração/projeto.
- `src/runtime`: Worker Python e comunicação com Pyodide.
- `src/App.tsx`: interface e ciclo de execução.
- `src/sim/seasons`: presets versionados de temporadas e suas referências.
- `docs`: arquitetura, compatibilidade e plano de implementação.

## Segurança e limitações

O código Python é executado no Worker do navegador, não em um servidor privilegiado. O Worker pode ser encerrado pelo aplicativo quando o tempo limite é atingido. Isso reduz o impacto de um loop infinito, mas não transforma código Python arbitrário em código confiável. Não coloque segredos no programa. A camada de compatibilidade bloqueia alguns módulos de acesso externo, mas não deve ser tratada como sandbox de segurança de nível servidor.

A física é uma aproximação educacional. Dimensões, atrito, aceleração, sensores, geometria dos robôs e comportamento das missões ainda precisam ser calibrados contra o hardware e os tapetes reais. As missões atualmente carregadas são apenas demonstrações, não regras oficiais de uma temporada FLL.

## Ainda não concluído

1. Builder completo com catálogo de peças LEGO, conectores físicos e montagem modular com colisores por peça. O construtor atual cobre chassis, portas e sensores.
2. Leituras de sensores intercaladas com movimentos e APIs bloqueantes durante a mesma execução Python.
3. Modelos 3D de missões e motor de pontuação oficial BIOGLOW validado contra o Robot Game Rulebook e as atualizações FIRST.
4. Replay determinístico completo, gravação de telemetria e compartilhamento online.
5. Aceleração, atrito, inércia, encoder, PID e calibração de física contra robôs reais.
6. Runtime remoto isolado somente se houver necessidade real e sandbox dedicada.

## Estado de validação desta branch

A pipeline do GitHub Actions está configurada, mas o estado de build/teste desta branch ainda não pôde ser confirmado nesta sessão. Não considere os testes aprovados até conferir os checks da PR. A aplicação também precisa de validação visual em um navegador com WebGL 2.
