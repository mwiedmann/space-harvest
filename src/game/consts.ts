// Player physics defaults
export const shipSettings = {
  angularVelocity: 135,
  angularDrag: 500,
  acceleration: 20,
  maxVelocity: 200,
  drag: 130,
  fireRate: 250,
  keyboardTurnRate: 1,
  deadTime: 5000,
  bulletSpeed: 500,
  bulletLifetime: 1000
}

export const gameSettings = {
  screenWidth: 1400,
  screenHeight: 800,
  worldBoundEdgeSize: 32,
  playerStartingEnergy: 100,
  playerStartingShips: 3,
  shootEnergyPenalty: -5,
  alienSpawnMinTime: 5000,
  alientSpawnMaxTime: 15000,
  baseHitByBulletEnergyPenalty: -1,
  baseHitByAsteroidEnergyPenalty: -25,
  baseHitByAlienEnergyPenalty: -50,
  timeAfterPlayerDestroyedToRejoin: 8000,
  pointsForBonus: 20000,
  energyBarWidth: 45,
  energyBarHeight: 9
}

export const settingsHelpers = {
  screenWidthMid: gameSettings.screenWidth / 2,
  screenHeightMid: gameSettings.screenHeight / 2,
  worldBoundWidth: gameSettings.screenWidth + 2 * gameSettings.worldBoundEdgeSize,
  worldBoundHeight: gameSettings.screenHeight + 2 * gameSettings.worldBoundEdgeSize,
  playerStartingLocations: [
    { x: 400, y: 300 },
    { x: gameSettings.screenWidth - 400, y: gameSettings.screenHeight - 300 },
    { x: 400, y: gameSettings.screenHeight - 200 },
    { x: gameSettings.screenWidth - 400, y: 200 }
  ]
}
