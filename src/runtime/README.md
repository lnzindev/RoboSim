# Runtime Python e compatibilidade Pybricks

O runtime usa Pyodide no navegador, executado em um Web Worker. O Worker mantém a thread de interface livre e pode ser encerrado pelo botão Parar ou pelo limite de 150 segundos da rodada. Os assets do Pyodide são carregados do CDN jsDelivr na primeira execução.

## Imports e API implementados

```python
from pybricks.hubs import PrimeHub
from pybricks.parameters import Port, Stop, Direction
from pybricks.pupdevices import Motor, UltrasonicSensor, ColorSensor
from pybricks.robotics import DriveBase
from pybricks.tools import wait
```

- `Motor(Port.X)`: instancia um motor virtual.
- `Motor.run(speed)`, `dc(duty)`, `stop()`, `brake()`, `hold()`.
- `Motor.run_time(speed, duration, then, wait)` e `run_angle(...)` com aproximação temporal.
- `DriveBase(left, right, wheel_diameter, axle_track)`.
- `DriveBase.drive(speed, turn_rate)`, `straight(distance)`, `turn(angle)`, `stop()`.
- `wait(milliseconds)`.
- `UltrasonicSensor.distance()` retorna distância em mm.
- `ColorSensor.color()`, `reflection()` e `rgb()` leem o piso/objetos da arena.
- `PrimeHub.imu.heading()` retorna heading em graus.
- Portas selecionáveis A-F no configurador. Motores associados ao DriveBase controlam o lado esquerdo/direito configurado.

## Unidades e aproximações

- DriveBase usa velocidade em mm/s, taxa de giro em graus/s, diâmetro e distância entre eixos em mm.
- Motor.run recebe graus/s e converte para velocidade linear usando o diâmetro de roda informado ao DriveBase.
- O motor de simulação converte velocidades em percentuais e usa um modelo diferencial simplificado.
- Ângulos de motor, distância e heading do DriveBase são estimativas integradas pelo modelo cinemático, não leituras de encoder do hardware.
- PrimeHub oferece apenas um subconjunto: IMU virtual de heading, sem aceleração/giroscópio real.
- Sensores de distância, cor e heading também estão disponíveis no Python. A leitura é calculada por um modelo interno simplificado, sincronizado pelo tempo e pelos comandos do robô. As colisões e leituras não substituem o hardware real.

## Exemplo

```python
from pybricks.pupdevices import Motor
from pybricks.robotics import DriveBase
from pybricks.parameters import Port
from pybricks.tools import wait

left = Motor(Port.B)
right = Motor(Port.C)
robot = DriveBase(left, right, 56, 120)

robot.drive(150, 0)
wait(1200)
robot.stop()

# Sensores virtuais disponíveis na arena
from pybricks.pupdevices import UltrasonicSensor, ColorSensor
from pybricks.hubs import PrimeHub
sonar = UltrasonicSensor(Port.A)
color = ColorSensor(Port.D)
hub = PrimeHub()
print(sonar.distance())
print(color.color())
print(hub.imu.heading())
```

## Segurança e limitações

O Worker isola a execução da thread visual, mas não é um sandbox de segurança para executar programas de terceiros não confiáveis. O código Python pode consumir recursos do Worker até ser interrompido; existe limite de tamanho de 50.000 caracteres e timeout de rodada de 150 segundos. Não existe execução remota em servidor.

Esta camada não é o firmware Pybricks e não substitui um hub LEGO real. A API suportada é parcial e deve ser expandida com testes antes de se declarar compatibilidade com programas reais.
