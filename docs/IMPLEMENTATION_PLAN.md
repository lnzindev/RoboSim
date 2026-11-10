# RoboSim FLL V0.2 - Plano de implementação e validação

Este arquivo é a fonte de verdade do escopo. Uma tarefa só é marcada como concluída quando foi implementada; critérios que dependem de execução real continuam pendentes até serem testados.

## 1. Fundação e qualidade
- [x] Separar módulos iniciais de simulação, sensores, pontuação e runtime.
- [x] Corrigir eixo de movimento, limites, temporização e encerramento do Worker.
- [x] Adicionar testes unitários iniciais para movimento, colisões, sensores e pontuação.
- [x] Configurar GitHub Actions para instalação, typecheck, testes e build.
- [x] Documentar instalação, arquitetura, limitações e API suportada.
- [ ] Executar CI e corrigir todas as falhas encontradas.

## 2. Runtime Python e compatibilidade Pybricks
- [x] Executar Python via Pyodide em Web Worker.
- [x] Criar camada inicial de compatibilidade Pybricks.
- [x] Implementar imports e subset inicial: Motor, DriveBase, Port, Stop, Direction, PrimeHub e wait.
- [x] Traduzir comandos de DriveBase e motores em eventos de movimento.
- [x] Implementar parada por encerramento do Worker, limite de rodada, console e erros.
- [x] Documentar diferenças em relação ao firmware/hardware real.
- [x] Odometria cinemática aproximada, ângulo de motor e distância/ângulo estimados do DriveBase.
- [ ] Melhorar fidelidade dos encoders e validar equivalência com Pybricks.
- [x] Integrar sensores virtuais de distância/cor e heading ao código Python (modelo aproximado).
- [ ] Expandir API com testes de compatibilidade.

## 3. Robô e construtor
- [x] Modelo visual inicial de robô diferencial inspirado no SPIKE Prime.
- [x] Criar modelo de montagem LEGO com tipos de peças e validação de estrutura.
- [x] Configurar portas de motor esquerdo/direito e portas dos sensores virtuais.
- [x] Sincronizar as portas dos sensores configuradas com o exemplo Python.
- [x] Configurar diâmetro de roda e distância entre rodas, aplicando ao exemplo Python.
- [x] Validar portas duplicadas e limites básicos das dimensões.
- [x] Mostrar componentes instalados e permitir adicionar/remover uma viga estrutural opcional.
- [ ] Criar editor visual completo de peças LEGO com seleção, portas, encaixes e anexos.
- [ ] Validar grafo de montagem, peças incompatíveis e colisões entre componentes.
- [x] Refletir diâmetro de roda e distância entre eixos na geometria 3D.
- [ ] Renderizar toda a montagem a partir do grafo de peças e permitir adicionar/remover componentes.

## 4. Física e arena 3D
- [x] Integrar Rapier para corpos físicos e detecção de contato.
- [x] Implementar movimento diferencial com parâmetros de eixo e limites.
- [x] Implementar detecção determinística inicial de colisão com objetos.
- [x] Criar arena de treino 3x3m com paredes e dois objetos de missão demonstrativos.
- [x] Associar contato com objetos às missões demonstrativas.
- [ ] Criar editor de arena e posicionamento customizado de missões.
- [ ] Adicionar arenas oficiais por temporada, com medidas e regras versionadas.
- [ ] Implementar pausa/continuação e replay determinístico.

## 5. Sensores e hub
- [x] Sensor virtual de distância com obstáculos e alcance configurável na telemetria.
- [x] Sensor virtual de cor baseado na superfície sob o sensor frontal.
- [x] Leitura de heading na telemetria.
- [x] Heading e velocidade angular (giroscópio) virtuais na telemetria.
- [x] Heading da IMU virtual acessível por PrimeHub.imu.heading() no Python.
- [ ] Aceleração linear e IMU completa.
- [ ] Simular hub, bateria e estado das portas.
- [x] Disponibilizar distância, cor e heading virtual no Python (modelo aproximado).

## 6. Ferramentas de treino
- [x] Cronômetro regressivo com rodada padrão de 2min30s.
- [x] Console, logs e mensagens de erro.
- [x] Exibir posição, heading, velocidade e sensores.
- [x] Pontuação demonstrativa por colisão com objetos de missão.
- [ ] Configurar duração da rodada, regras e pontuação por temporada.
- [ ] Registrar e reproduzir eventos de execução.

## 7. Interface e acessibilidade
- [x] Layout responsivo inicial para desktop e celular.
- [x] Estados visíveis de execução, erro e conclusão.
- [x] Configurador inicial de portas e geometria de tração.
- [ ] Editor com realce de sintaxe e numeração sincronizada.
- [ ] Controles de teclado e revisão de acessibilidade.

## 8. Segurança e limites
- [x] Executar Python fora da thread visual em Worker.
- [x] Limitar tamanho do programa a 50.000 caracteres.
- [x] Encerrar o Worker ao atingir o limite de 150 segundos ou ao parar.
- [x] Não executar código Python em servidor nesta etapa.
- [ ] Avaliar limites de memória e endurecer o isolamento para programas não confiáveis.

> O Worker protege a responsividade da interface, mas não é um sandbox de segurança para executar código de terceiros. Não execute programas desconhecidos.

## Critérios de aceite
- [x] Instalação limpa via npm install.
- [x] npm run typecheck sem erros.
- [x] npm test passando.
- [x] npm run build sem erros.
- [x] Integração Pyodide real executada em Node com sensores, motores, odometria e colisões.
- [ ] Programa Python de exemplo executado no browser e movimento confirmado visualmente.
- [ ] Programa inválido mostra erro sem travar a interface.
- [ ] Parar/reset interrompe o Worker e zera os motores.
- [ ] Colisões e sensores validados em execução.
- [ ] Interface responsiva validada em desktop e celular.

## Fora do escopo desta entrega
- Emulação perfeita do firmware Pybricks ou hardware LEGO.
- Compatibilidade com toda a API Pybricks.
- Todas as missões e regras oficiais de todas as temporadas FLL.
- Multiplayer, ranking online e backend remoto.
- Execução Python arbitrária em servidor compartilhado.

## Progresso atual
- [x] PR e plano de trabalho criados antes da implementação.
- [x] Runtime Python, compatibilidade inicial e comunicação com a simulação implementados.
- [x] Arena, robô diferencial, colisões e objetos de missão implementados.
- [x] Sensores de telemetria, cronômetro e pontuação demonstrativa implementados.
- [x] Configuração de portas dos motores/sensores e dimensões de tração implementada.
- [x] Testes unitários e workflow de CI adicionados.
- [x] Validação automatizada de build/testes concluída com sucesso no GitHub Actions.

## Registro de validação parcial
- [x] TypeScript em modo strict para os módulos puros de movimento, sensores e montagem compilou localmente.
- [x] Testes manuais dos módulos puros confirmaram colisão, leitura de cor, conversão diferencial, giro e montagem padrão.
- [x] Sintaxe do Worker TypeScript validada com declaração de tipos isolada para Pyodide.
- [x] Sintaxe do shim Python e smoke test de DriveBase/stop executados localmente.
- [x] Smoke test local dos sensores Python: distância, cor, IMU e integração de deslocamento.
- [x] Integração Pyodide real validou sensores, motores, colisões e erro de programa inválido com recuperação do runtime.
- [x] Build completo React/Vite passou no GitHub Actions.
- [ ] Execução visual no navegador ainda precisa de validação manual.
- [x] GitHub Actions CI passou integralmente no commit `2f7477fed101be5afa42cd0597438e9662ee4995` (smoke Python, Pyodide real, typecheck, Vitest e build).
