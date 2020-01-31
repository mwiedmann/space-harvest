import { gameSettings } from './consts'

export const edgeCollideSetPosition = (x: number, y: number): { x: number; y: number } => {
  if (x > gameSettings.screenWidth) {
    return { x: 0, y }
  } else if (x < 0) {
    return { x: gameSettings.screenWidth, y }
  }

  if (y > gameSettings.screenHeight) {
    return { x, y: 0 }
  } else if (y < 0) {
    return { x, y: gameSettings.screenHeight }
  }

  return { x, y }
}

export const outOfBounds = (x: number, y: number): boolean =>
  x < 0 || x > gameSettings.screenWidth || y < 0 || y > gameSettings.screenHeight

export const getStartingEdgePosition = (): { x: number; y: number } => {
  let x
  let y

  if (Phaser.Math.RND.normal() < 0) {
    if (Phaser.Math.RND.normal() < 0) {
      x = 0
      y = Phaser.Math.RND.integerInRange(0, gameSettings.screenHeight)
    } else {
      x = Phaser.Math.RND.integerInRange(0, gameSettings.screenWidth)
      y = 0
    }
  } else {
    if (Phaser.Math.RND.normal() < 0) {
      x = gameSettings.screenWidth
      y = Phaser.Math.RND.integerInRange(0, gameSettings.screenHeight)
    } else {
      x = Phaser.Math.RND.integerInRange(0, gameSettings.screenWidth)
      y = gameSettings.screenHeight
    }
  }

  return { x, y }
}
