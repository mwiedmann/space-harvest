import * as Phaser from 'phaser'
import { outOfBounds, edgeCollideSetPosition, getStartingEdgePosition } from './wrappable'
import { Asteroid } from './asteroid'
import { Bullet } from './bullet'
import { gameSettings } from './consts'
import { aliens } from './game-init'

export const alienData = {
  nextAlienSpawn: 0
}

export function alienCrashIntoRock(
  alienObj: Phaser.GameObjects.GameObject,
  rockObj: Phaser.GameObjects.GameObject
): void {
  const rock = rockObj as Asteroid
  const alien = alienObj as Alien

  rock.breakApart()
  alien.done()
}

export function alienHitByBullet(
  alienObj: Phaser.GameObjects.GameObject,
  bulletObj: Phaser.GameObjects.GameObject
): boolean {
  const bullet = bulletObj as Bullet
  const alien = alienObj as Alien

  if (bullet.playerNumber !== 5) {
    bullet.done()
    alien.done()
    return true
  }
  return false
}

export class Alien extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'alien')

    this.fireParticleManager = this.scene.add.particles(`fire1`)
  }

  fireParticleManager: Phaser.GameObjects.Particles.ParticleEmitterManager
  nextTurnTime = 0

  turn() {
    const newVelocity = this.scene.physics.velocityFromRotation(this.rotation, 100)
    this.setVelocity(newVelocity.x, newVelocity.y)

    this.nextTurnTime = this.scene.time.now + Phaser.Math.RND.integerInRange(2000, 10000)
  }

  spawn() {
    this.setAngle(Phaser.Math.RND.integerInRange(0, 360))

    const startingPosition = getStartingEdgePosition()

    this.setPosition(startingPosition.x, startingPosition.y)
    this.body.reset(startingPosition.x, startingPosition.y)
    this.setActive(true)
    this.setVisible(true)

    this.setAngle(Phaser.Math.RND.integerInRange(0, 360))
    this.turn()

    this.setAngularVelocity(Phaser.Math.RND.integerInRange(0, 400) - 200)
  }

  update(time: number, delta: number) {
    if (outOfBounds(this.x, this.y)) {
      const { x: newX, y: newY } = edgeCollideSetPosition(this.x, this.y)
      this.setPosition(newX, newY)
    }

    if (time > this.nextTurnTime) {
      this.turn()
    }
  }

  done() {
    alienData.nextAlienSpawn =
      this.scene.time.now +
      Phaser.Math.RND.integerInRange(gameSettings.alienSpawnMinTime, gameSettings.alientSpawnMaxTime)

    this.fireParticleManager.createEmitter({
      speed: 50,
      blendMode: 'ADD',
      lifespan: 1000,
      maxParticles: 25,
      x: this.x,
      y: this.y
    })

    aliens.remove(this, true)
  }
}
