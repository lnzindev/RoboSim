import type { ArenaDefinition } from '../types'

/**
 * Season reference: FIRST LEGO League Challenge BIOGLOW Founders Edition 2026-27.
 *
 * The published wireframe uses a 10 x 6 grid with 20 cm cells (2.0 x 1.2 m).
 * Mission model geometry and scoring are deliberately not fabricated here.
 * This preset is a field/layout reference until each mission model is calibrated
 * against the official build instructions and the current Robot Game Rulebook.
 */
export const bioglowFounders2026: ArenaDefinition = {
  id: 'bioglow-founders-2026-27',
  name: 'BIOGLOW · Founders Edition',
  width: 2,
  depth: 1.2,
  official: false,
  seasonLabel: 'FIRST LEGO League Challenge · 2026–2027',
  layoutNote: 'Dimensões e malha de referência oficial; modelos e pontuação ainda não calibrados.',
  cellSize: 0.2,
  launchZones: [
    { id: 'launch-left', x: 0, z: 0, radius: 0.46, startAngle: 0, color: '#d95755' },
    { id: 'launch-right', x: 2, z: 0, radius: 0.46, startAngle: Math.PI / 2, color: '#548fd2' },
  ],
  missions: [
    { id: 'm01', name: 'Mapeamento com drone', description: 'Lançar o drone para mapear a floresta e completar o escaneamento do mapa.' },
    { id: 'm02', name: 'Sementes explosivas', description: 'Espalhar as sementes lançadas pelas árvores para representar a dispersão natural.' },
    { id: 'm03', name: 'Vire a rocha', description: 'Levantar a rocha para revelar a vida sob ela e devolvê-la à posição original.' },
    { id: 'm04', name: 'Folhas da sorte', description: 'Retirar folhas sem deslocar o inseto camuflado; a posição inicial é aleatória.' },
    { id: 'm05', name: 'Raízes que se estendem', description: 'Estender as raízes parcial ou completamente para representar conexões naturais.' },
    { id: 'm06', name: 'Correria das formigas-cortadeiras', description: 'Conduzir as formigas ao ninho transportando os fragmentos de folhas.' },
    { id: 'm07', name: 'Fungo gigante', description: 'Expandir o micélio; existe uma bonificação de cooperação prevista na missão.' },
    { id: 'm08', name: 'Emaranhado', description: 'Desenredar as trepadeiras até que encostem no tapete.' },
    { id: 'm09', name: 'Plataforma de pesquisa', description: 'Elevar a plataforma, posicionar a armadilha fotográfica e remover uma semente.' },
    { id: 'm10', name: 'Micro-habitats frágeis', description: 'Navegar preservando os habitats de pequenos animais.' },
    { id: 'm11', name: 'Janela para o passado', description: 'Abrir a janela subterrânea para revelar os registros do passado.' },
    { id: 'm12', name: 'Ancião da floresta', description: 'Instalar o suporte e posicionar corretamente a braçadeira de estabilização.' },
    { id: 'm13', name: 'Espécie-chave', description: 'Construir e entregar uma espécie-chave à plataforma de recuperação.' },
    { id: 'm14', name: 'Sementes da renovação', description: 'Levar as sementes coletadas até a estação de reflorestamento.' },
    { id: 'm15', name: 'Arquitetura biocêntrica', description: 'Adaptar uma construção para favorecer a biodiversidade.' },
  ],
  obstacles: [],
  targets: [],
}
