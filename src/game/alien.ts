import * as Phaser from 'phaser'
import { outOfBounds, edgeCollideSetPosition, getStartingEdgePosition } from './wrappable'
import { Asteroid } from './asteroid'
import { Bullet } from './bullet'
import { gameSettings } from './consts'
import { aliens, bulletGroups } from './game-init'
import { Mineral } from './mineral'
import { Base } from './base'

export type IAlienType = 'satellite' | 'probe'
const alienSpawnTypes: IAlienType[] = ['satellite', 'probe']

const alientTypeSettings: {
  [K in IAlienType]: { spriteNumber: number; velocity: number; vulnerable: boolean; shoots: boolean }
} = {
  satellite: {
    spriteNumber: 0,
    velocity: 100,
    vulnerable: true,
    shoots: true
  },
  probe: {
    spriteNumber: 1,
    velocity: 150,
    vulnerable: false,
    shoots: false
  }
}

export const alienData = {
  nextAlienSpawn: 0
}

export function alienCrashIntoRock(
  alienObj: Phaser.GameObjects.GameObject,
  rockObj: Phaser.GameObjects.GameObject
): boolean {
  const rock = rockObj as Asteroid
  const alien = alienObj as Alien

  rock.breakApart()

  if (alientTypeSettings[alien.alienType].vulnerable) {
    alien.done()
    return true
  }
  return false
}

export function alienCrashIntoBase(
  alienObj: Phaser.GameObjects.GameObject,
  baseObj: Phaser.GameObjects.GameObject
): void {
  const base = baseObj as Base
  const alien = alienObj as Alien

  base.hitByAlien()
  alien.done()
}

export function alienHitByBullet(
  alienObj: Phaser.GameObjects.GameObject,
  bulletObj: Phaser.GameObjects.GameObject
): boolean {
  const bullet = bulletObj as Bullet
  const alien = alienObj as Alien

  if (bullet.playerNumber !== 4) {
    bullet.done()
    alien.done()
    return true
  }
  return false
}

export function alienCollectMineral(
  alienObj: Phaser.GameObjects.GameObject,
  mineralObj: Phaser.GameObjects.GameObject
): boolean {
  const mineral = mineralObj as Mineral
  mineral.done()
  return false
}

export class Alien extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'alien', 0)

    this.fireParticleManager = this.scene.add.particles(`fire1`)
  }

  fireParticleManager: Phaser.GameObjects.Particles.ParticleEmitterManager
  nextTurnTime = 0
  nextShootTime = 0
  alienType: IAlienType = 'satellite'

  turn() {
    const newVelocity = this.scene.physics.velocityFromRotation(
      this.rotation,
      alientTypeSettings[this.alienType].velocity
    )
    this.setVelocity(newVelocity.x, newVelocity.y)

    this.nextTurnTime = this.scene.time.now + Phaser.Math.RND.integerInRange(2000, 10000)
  }

  spawn() {
    this.alienType = Phaser.Math.RND.pick(alienSpawnTypes)
    this.setFrame(alientTypeSettings[this.alienType].spriteNumber)

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

  shoot() {
    if (alientTypeSettings[this.alienType].shoots) {
      var bullet = bulletGroups[4].get(undefined, undefined, '4') as Bullet

      if (bullet) {
        bullet.fireAlien(this)
      }
    }
    this.nextShootTime = this.scene.time.now + Phaser.Math.RND.integerInRange(1000, 3000)
  }

  update(time: number, delta: number) {
    if (outOfBounds(this.x, this.y)) {
      const { x: newX, y: newY } = edgeCollideSetPosition(this.x, this.y)
      this.setPosition(newX, newY)
    }

    if (time > this.nextTurnTime) {
      this.turn()
    }

    if (time > this.nextShootTime) {
      this.shoot()
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
