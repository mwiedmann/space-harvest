// Player physics defaults
export const shipSettings = {
  angularVelocity: 170,
  angularDrag: 500,
  acceleration: 20,
  maxVelocity: 200,
  drag: 130,
  fireRate: 250,
  keyboardTurnRate: 0.6,
  deadTime: 5000,
  bulletSpeed: 500,
  bulletLifetime: 1000
}

export const gameSettings = {
  screenWidth: 1800,
  screenHeight: 900,
  worldBoundEdgeSize: 32,
  deathScorePenalty: -1000,
  shootScorePenalty: -5
}

export const settingsHelpers = {
  screenWidthMid: gameSettings.screenWidth / 2,
  screenHeightMid: gameSettings.screenHeight / 2,
  worldBoundWidth: gameSettings.screenWidth + 2 * gameSettings.worldBoundEdgeSize,
  worldBoundHeight: gameSettings.screenHeight + 2 * gameSettings.worldBoundEdgeSize,
  playerStartingLocations: [
    { x: 400, y: 200 },
    { x: gameSettings.screenWidth - 400, y: gameSettings.screenHeight - 200 },
    { x: 400, y: gameSettings.screenHeight - 200 },
    { x: gameSettings.screenWidth - 400, y: 200 }
  ]
}
