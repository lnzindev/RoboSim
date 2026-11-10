export type MissionState = { id: string; title: string; points: number; completed: boolean }
export const starterMissions: MissionState[] = [
  { id: 'mission-01', title: 'Alcançar a área de inspeção', points: 10, completed: false },
  { id: 'mission-02', title: 'Tocar o objeto azul', points: 15, completed: false },
]
export function calculateScore(missions: MissionState[]): number { return missions.reduce((total, mission) => total + (mission.completed ? mission.points : 0), 0) }
