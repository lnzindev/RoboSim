# Compatibilidade Pybricks no RoboSim

O RoboSim usa Pyodide para executar Python no navegador e fornece módulos Python simulados com nomes conhecidos do Pybricks. Isso é uma camada de compatibilidade educacional, não o firmware Pybricks e não um clone completo da API.

## Implementado nesta versão

| API | Estado | Observação |
| --- | --- | --- |
| `pybricks.parameters.Port` | Parcial | Portas A-F. |
| `pybricks.parameters.Stop` | Parcial | COAST, BRAKE e HOLD aceitos como marcadores. |
| `pybricks.parameters.Direction` | Parcial | Direção aplicada a comandos de motor. |
| `pybricks.pupdevices.Motor` | Parcial | run, run_time, run_angle, run_target, dc, stop, brake, hold. |
| `pybricks.robotics.DriveBase` | Parcial | drive, straight, turn, stop, settings. |
| `pybricks.tools.wait` | Implementado no modelo de comandos | Adiciona uma espera à fila virtual. |
| `ColorSensor` | Leitura inicial | Cor/reflexão consultadas ao iniciar o programa. |
| `UltrasonicSensor` | Leitura inicial | Distância consultada ao iniciar o programa. |
| `ForceSensor` | Leitura inicial | Pressão baseada no contador de colisões. |
| `PrimeHub.imu.heading()` | Leitura inicial | Heading no início da execução. |
| `PrimeHub.display.text()` | Básico | Escreve no console virtual. |

## Modelo de execução

O Worker executa o programa Python até o fim e coleta os comandos emitidos. Depois, o motor de simulação reproduz esses comandos no tempo. Por isso, leituras de sensores feitas dentro do mesmo script usam o snapshot recebido no início da execução, e não uma leitura bloqueante atualizada entre cada movimento.

Chamadas `straight` e `turn` são convertidas em velocidade + espera + parada. O movimento é aproximado usando o diâmetro de roda e a distância entre rodas configurados no robô. A aceleração, o atrito, o backlash, a tensão da bateria e as tolerâncias mecânicas ainda não são modelados.

## Não implementado

- Threads, multitarefa e APIs de sincronização de Pybricks.
- Controle fechado e PID real da DriveBase.
- Precisão de encoder e posição angular real dos motores.
- Leitura bloqueante/intercalada de sensores durante a execução.
- Todos os dispositivos, classes e métodos do pacote Pybricks.
- Compatibilidade binária ou execução de firmware MicroPython original.

## Exemplo suportado

```python
from pybricks.pupdevices import Motor
from pybricks.robotics import DriveBase
from pybricks.parameters import Port

left = Motor(Port.B)
right = Motor(Port.C)
base = DriveBase(left, right, 56, 120)
base.settings(400, 600, 180, 360)
base.straight(500)
base.turn(90)
base.stop()
```

O Worker tem limite de tempo e pode ser encerrado pelo aplicativo. Módulos de acesso externo como `js`, `socket`, `urllib`, `subprocess` e `micropip` são bloqueados pela camada de importação. Isso é defesa em profundidade para o runtime de navegador, não uma sandbox de execução remota em servidor.
