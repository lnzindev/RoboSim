export type WheelSpeeds = { leftMmS: number; rightMmS: number }

export function calculateDriveSpeeds(speedMmS: number, turnRateDegS: number, axleTrackMm: number): WheelSpeeds {
  const angularRate = turnRateDegS * Math.PI / 180
  const halfTrack = Math.max(0, axleTrackMm) / 2
  return {
    leftMmS: speedMmS - angularRate * halfTrack,
    rightMmS: speedMmS + angularRate * halfTrack,
  }
}

export function calculateStraightDurationMs(distanceMm: number, speedMmS: number): number {
  if (speedMmS === 0) return 0
  return Math.abs(distanceMm / speedMmS * 1000)
}

export function calculateTurnDurationMs(angleDeg: number, turnRateDegS: number): number {
  if (turnRateDegS === 0) return 0
  return Math.abs(angleDeg / turnRateDegS * 1000)
}

export function motorSpeedToLinearMmS(speedDegS: number, wheelDiameterMm: number): number {
  return speedDegS * Math.PI * wheelDiameterMm / 360
}
