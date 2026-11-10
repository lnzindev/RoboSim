import type { RobotConfig } from '../sim/types'

export const spikePrimePreset: RobotConfig = {
  chassisWidthMm: 160,
  chassisLengthMm: 180,
  sensorMounts: [
    { id: 'sensor-color-a', kind: 'color', port: 'A', xMm: 0, zMm: 112, rotationDeg: 0 },
    { id: 'sensor-distance-d', kind: 'distance', port: 'D', xMm: 0, zMm: 125, rotationDeg: 0 },
  ],
  wheelDiameterMm: 56,
  axleTrackMm: 120,
  maxSpeedMmS: 500,
  leftMotorPort: 'B',
  rightMotorPort: 'C',
}