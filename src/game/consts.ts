// Player physics defaults
export const shipSettings = {
  angularVelocity: 135,
  angularDrag: 500,
  acceleration: 40,
  maxVelocity: 200,
  drag: 130,
  fireRate: 400,
  keyboardTurnRate: 1,
  deadTime: 5000,
  bulletSpeed: 500,
  bulletLifetime: 1000
}

export const harvesterSettings = {
  angularVelocity: 135,
  angularDrag: 1000,
  acceleration: 60,
  maxVelocity: 100,
  drag: 200,
  deadTime: 10000,
  baseSpawnAdjustY: -48
}

export const gameSettings = {
  screenWidth: 1400,
  screenHeight: 1000,
  worldBoundEdgeSize: 32,
  playerStartingEnergy: 100,
  playerStartingShips: 3,
  shootEnergyPenalty: -5,
  alienSpawnMinTime: 5000,
  alientSpawnMaxTime: 15000,
  baseHitByBulletEnergyPenalty: -1,
  baseHitByAsteroidEnergyPenalty: -20,
  baseHitByAlienEnergyPenalty: -40,
  baseHitByPlayerEnergyPenalty: -10,
  timeAfterPlayerDestroyedToRejoin: 8000,
  pointsForBonus: 20000,
  energyBarWidth: 45,
  energyBarHeight: 9,
  asteroidSpawnTime: 4000,
  mineralSpawnMin: 1,
  mineralSpawnMax: 5,
  asteroidCount: 7
}

export const settingsHelpers = {
  screenWidthMid: gameSettings.screenWidth / 2,
  screenHeightMid: gameSettings.screenHeight / 2,
  worldBoundWidth: gameSettings.screenWidth + 2 * gameSettings.worldBoundEdgeSize,
  worldBoundHeight: gameSettings.screenHeight + 2 * gameSettings.worldBoundEdgeSize,
  playerStartingLocations: [
    { x: 400, y: 300 },
    { x: gameSettings.screenWidth - 400, y: gameSettings.screenHeight - 300 },
    { x: 400, y: gameSettings.screenHeight - 300 },
    { x: gameSettings.screenWidth - 400, y: 300 }
  ]
}

export interface ITurretPositions {
  startingAngle: number
  x: number
  y: number
}

export const turretSettings = {
  positions: [
    { startingAngle: -90, x: 0, y: -54 },
    { startingAngle: -18, x: 48, y: -17 },
    { startingAngle: 54, x: 29, y: 40 },
    { startingAngle: 126, x: -29, y: 40 },
    { startingAngle: -162, x: -48, y: -17 }
  ],
  fireRate: 1500,
  bulletLifetime: 500,
  angleRange: 60
}
