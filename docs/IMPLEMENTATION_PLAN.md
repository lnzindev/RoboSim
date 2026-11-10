# RoboSim FLL — Plano de implementação e critérios de aceite

> Documento mestre desta PR. Esta branch evolui o protótipo inicial para um simulador FLL utilizável. Recursos que dependam de fidelidade física ou compatibilidade de hardware ainda não validada serão identificados como experimentais.

## Progresso desta PR

Legenda: **[x] concluído nesta branch**, **[~] parcial**, **[ ] pendente**. A existência de testes não significa que eles já foram executados.

### Entregue nesta branch
- [x] Fundação React + TypeScript + Vite e scripts de desenvolvimento, typecheck, teste e build.
- [x] Separação inicial entre UI, simulação, dispositivos, dados de arena, projetos e runtime.
- [x] Pipeline GitHub Actions para instalação, typecheck, Vitest e build (com disparo manual habilitado; execução ainda sem confirmação).
- [x] Campo 3D com câmera orbital e vista superior.
- [x] Arena de treino com obstáculos/alvos demonstrativos e arena livre redimensionável.
- [x] Preset de referência BIOGLOW 2026–2027 com malha de 20 cm, dimensões 2,0 × 1,2 m, duas zonas visuais de lançamento e catálogo das 15 missões.
- [x] Movimento diferencial com passo fixo, limites do campo e detecção simplificada de obstáculos.
- [x] Controles de iniciar, pausar, continuar, passo único, parar, reset e relógio de 2min30s.
- [x] Configuração inicial de robô, dimensões de chassis, motores e portas.
- [x] Montagem configurável de sensores de cor, distância e força, incluindo porta, posição e rotação.
- [x] Validação de configuração/projeto com Zod e proteção contra conflito de portas.
- [x] Editor Monaco com syntax highlighting Python.
- [x] Pyodide em Worker com captura de saída, limite de tempo, cancelamento e limite de comandos.
- [x] Subconjunto documentado da API Pybricks: Motor, DriveBase, portas, parâmetros, hub e sensores.
- [x] Leituras de sensores por snapshot inicial, considerando a pose configurada do sensor.
- [x] Exportação/importação JSON e salvamento local.
- [x] 19 casos de teste unitário escritos para física, DriveBase, sensores, geometria de arena, pontuação demonstrativa e schema de projetos.
- [x] Teste E2E Playwright para abrir a aplicação em Chromium, validar arena/editor/builder, redimensionar arena livre e executar o programa Python inicial.

### Parcial
- [~] Compatibilidade Pybricks: API parcial; não é firmware MicroPython e não tem semântica completa de bloqueio, encoder ou PID.
- [~] Física: movimento e colisões simplificados; sem aceleração, atrito calibrado, inércia, geometria detalhada ou colisão por peça.
- [~] Construtor: chassis, motores e sensores configuráveis; ainda não existe catálogo completo de peças LEGO nem montagem por conectores.
- [~] Sensores: leituras determinísticas a partir do snapshot do início do programa; não são atualizadas dinamicamente entre instruções Python.
- [~] BIOGLOW: campo e missões são referência visual/informativa; modelos de missão, condições de arbitragem e pontuação oficial ainda não estão implementados.
- [~] Segurança: Worker com timeout/cancelamento e módulos externos bloqueados, mas isso não equivale a uma sandbox forte para execução de código hostil.
- [~] CI: workflow criado; execução e resultado precisam ser confirmados nos checks da PR.

### Pendente
- [ ] Execução Python intercalada com o tempo de simulação, com leituras bloqueantes de sensores.
- [ ] Motores com encoder/ângulo/velocidade e comportamento de parada realista.
- [ ] Aceleração, atrito, inércia e calibração da física contra robô real.
- [ ] Builder com catálogo de peças, conectores, acessórios e montagem modular.
- [ ] Modelos 3D das missões BIOGLOW e pontuação validada pelas regras/updates oficiais.
- [ ] Replay completo, timeline de eventos e telemetria exportável.
- [~] Smoke test automatizado em Chromium adicionado; a primeira execução desta suíte ainda precisa ser acompanhada. Revisão visual ampla e acessibilidade continuam pendentes.
- [x] Typecheck, 19 testes unitários e build de produção aprovados pelo GitHub Actions (run 165).
- [ ] Executar e aprovar o E2E Playwright com timeout de inicialização ampliado; o run 179 passou após uma repetição, mas foi classificado como flaky e precisa de nova execução limpa.

### Verificação
Na sessão de implementação, a integração GitHub retornou a branch adiantada em relação a `main`, mas não retornou workflow runs nem status checks para o commit consultado. O ambiente de execução desta sessão não conseguiu obter o repositório por rede para rodar npm localmente. Portanto, **typecheck, testes, build e navegador permanecem não verificados** até que a CI da PR seja executada e seus resultados sejam inspecionados.

## Objetivo
Construir uma aplicação web em que equipes possam montar robôs LEGO virtuais, escrever Python com uma camada compatível com Pybricks, executar programas na arena 3D e observar motores, sensores, colisões, telemetria e resultados de missões.

## Escopo

### 1. Fundação e qualidade
- [ ] Padronizar a estrutura React + TypeScript + Vite.
- [ ] Separar UI, núcleo de simulação, robô, arena, sensores, runtime e dados de temporada.
- [ ] Adicionar typecheck, lint/testes automatizados e build de produção.
- [ ] Documentar instalação, scripts, arquitetura, limitações e como adicionar arenas.
- [ ] Configurar GitHub Actions para instalar dependências, validar tipos, executar testes e gerar build.

### 2. Arena 3D
- [ ] Campo configurável com dimensões, bordas, grade e zonas de missão.
- [ ] Dois modos: arena personalizada e arenas FLL por temporada.
- [ ] Objetos de missão com posição, dimensão, material, colisão e estado.
- [ ] Câmera orbital, vista superior e enquadramento do robô.
- [ ] Coordenadas, estado de execução e limites do campo.

### 3. Motor de simulação
- [ ] Passos fixos para estabilidade e reprodutibilidade.
- [ ] Movimento diferencial, aceleração, velocidade máxima, rotação e inércia simplificada.
- [ ] Colisões entre robô, paredes e objetos de missão.
- [ ] Núcleo testável independente do React.
- [ ] Pause, continuar, passo único, reset e limite de duração.
- [ ] Não apresentar aproximações como medições reais de SPIKE Prime.

### 4. Robô e construtor
- [ ] Preset inicial SPIKE Prime.
- [ ] Componentes: hub, motores, rodas, sensores, chassis e acessórios.
- [ ] Configuração de portas, posição, orientação, massa aproximada e dimensões.
- [ ] Validação de portas e conexões.
- [ ] Configuração serializável e salvar/carregar localmente.
- [ ] Visualização dos componentes na arena.

### 5. Motores e API
- [ ] Modelos de motor com alvo de velocidade, ângulo, stop e estado.
- [ ] DriveBase diferencial com controle de distância e ângulo.
- [ ] Mapeamento de portas e dispositivos.
- [ ] Camada de compatibilidade Pybricks documentada.
- [ ] Separar APIs implementadas, parciais e não suportadas.
- [ ] Exemplos executáveis e testes para motores e DriveBase.

### 6. Runtime Python
- [ ] Pyodide em Web Worker para não bloquear a interface.
- [ ] Bindings Python para a API virtual de dispositivos.
- [ ] Mensagens tipadas do runtime para o núcleo de simulação.
- [ ] Cancelamento, timeout, stdout/stderr e tratamento de erros.
- [ ] Não usar eval Python em JavaScript; execução isolada no Worker.
- [ ] Preparar contrato para runtime remoto futuro, sem executar código arbitrário no servidor nesta fase.
- [ ] Documentar diferenças para MicroPython/Pybricks no hub real.

### 7. Sensores virtuais
- [ ] Sensor de distância contra objetos e paredes.
- [ ] Sensor de cor para cor/reflexão da superfície.
- [ ] IMU com heading e aceleração simplificada.
- [ ] Sensor de força quando houver componente correspondente.
- [ ] Leituras determinísticas e configuração de posição/orientação.

### 8. Experiência de programação
- [ ] Editor Python com realce de sintaxe e numeração de linhas.
- [ ] Exemplos e documentação inline da API suportada.
- [ ] Console, erros, logs e estado dos dispositivos.
- [ ] Iniciar, pausar, continuar, passo único e parar.
- [ ] Telemetria de posição, heading, velocidade, sensores e portas.
- [ ] Layout responsivo.

### 9. Missões, cronômetro e pontuação
- [ ] Arenas e missões em arquivos versionáveis.
- [ ] Motor de pontuação independente da UI.
- [ ] Rodada de 2min30s configurável.
- [ ] Eventos, pontuação provisória e penalidades configuradas.
- [ ] Regras validadas por temporada com testes.
- [ ] Arenas demonstrativas identificadas como não oficiais até validação.

### 10. Projetos e replay
- [ ] Exportar/importar projeto JSON com schema validado.
- [ ] Salvar código e robô localmente.
- [ ] Registrar eventos para replay básico.
- [ ] Compartilhar projeto por arquivo sem exigir conta.
- [ ] Interfaces futuras para nuvem sem tornar Supabase obrigatório.

### 11. Segurança e confiabilidade
- [ ] Nenhum secret no frontend.
- [ ] Nenhum Python arbitrário em processo privilegiado/servidor compartilhado.
- [ ] Limites de tempo e cancelamento do runtime.
- [ ] Validar projetos importados e mensagens do Worker.
- [ ] Tratar erros de WebGL, Worker e dependências.
- [ ] Não alegar compatibilidade oficial sem validação.

## Arquitetura alvo
- Frontend: React, TypeScript e Vite.
- Renderização: Three.js, React Three Fiber e Drei.
- Física: núcleo determinístico independente; Rapier onde agregar colisão sem prejudicar testes.
- Editor: editor web com suporte Python.
- Runtime: Pyodide em Web Worker e camada de compatibilidade Pybricks explícita.
- Protocolos: mensagens tipadas de comando, telemetria, estado e erro.
- Dados: JSON versionado para robôs, arenas e temporadas.
- CI: GitHub Actions com typecheck, testes e build.

## Critérios de aceite
1. `npm install` instala as dependências listadas no `package.json`. Um lockfile precisa ser adicionado antes de exigir `npm ci`.
2. `npm run typecheck` termina sem erros.
3. `npm test` termina sem falhas.
4. `npm run build` gera a aplicação de produção.
5. A arena renderiza o robô sem erro fatal.
6. Um exemplo Python suportado executa e move o robô.
7. Pausar, continuar, passo único, parar e reset funcionam.
8. Motores/DriveBase e sensores têm testes unitários.
9. Projetos são exportados/importados com validação.
10. Limitações de Pybricks e fidelidade física aparecem na documentação e interface.

## Ordem de execução
1. Estrutura e CI.
2. Núcleo de simulação independente e testável.
3. Dispositivos, robô e arena.
4. Runtime Python em Worker e API compatível.
5. Sensores e telemetria.
6. Builder, dados de arena e pontuação.
7. Exportação, replay e documentação.
8. Validação, correção e revisão integral do diff.

## Fora do escopo
- Equivalência perfeita com firmware, sensores ou física LEGO real.
- Execução remota arbitrária sem sandbox dedicada.
- Pontuação oficial sem validar medidas, missões e regras oficiais.
- Contas multiusuário, ranking online e backend de competição.

## Estado de validação
Os checks serão atualizados somente após execução real. Criar um arquivo de configuração não conta como teste aprovado. Existem 19 casos unitários e um E2E escritos. O GitHub Actions run 179 aprovou typecheck, os 19 testes unitários e o build de produção. O E2E passou na repetição, mas a primeira tentativa falhou no cold start do Pyodide; a janela de inicialização foi ampliada e precisa de nova execução para confirmar estabilidade.