import * as Phaser from 'phaser'
import { outOfBounds, edgeCollideSetPosition, getStartingEdgePosition } from './wrappable'
import { Asteroid } from './asteroid'
import { Bullet } from './bullet'
import { gameSettings } from './consts'
import { aliens, bulletGroups, minerals } from './game-init'
import { Mineral } from './mineral'
import { Base } from './base'
import { Player } from './player'

export type IAlienType = 'satellite' | 'probe' | 'eye'
const alienSpawnTypes: IAlienType[] = ['satellite', 'probe', 'eye']

const alienTypeSettings: {
  [K in IAlienType]: {
    spriteNumber: number
    velocity: number
    vulnerable: boolean
    shoots: boolean
    shootTimeMin: number
    shootTimeMax: number
    targetPlayerChance: number
  }
} = {
  satellite: {
    spriteNumber: 0,
    velocity: 100,
    vulnerable: true,
    shoots: true,
    shootTimeMin: 1000,
    shootTimeMax: 3000,
    targetPlayerChance: 20
  },
  probe: {
    spriteNumber: 1,
    velocity: 150,
    vulnerable: false,
    shoots: false,
    shootTimeMin: 0,
    shootTimeMax: 0,
    targetPlayerChance: 0
  },
  eye: {
    spriteNumber: 2,
    velocity: 80,
    vulnerable: false,
    shoots: true,
    shootTimeMin: 250,
    shootTimeMax: 1500,
    targetPlayerChance: 25
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

  if (alienTypeSettings[alien.alienType].vulnerable) {
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

// TODO: Not sure why the params are reversed on this one.
// Maybe because the players are in an array rather than a Group?
export function alienCrashIntoPlayer(
  playerObj: Phaser.GameObjects.GameObject,
  alienObj: Phaser.GameObjects.GameObject
): boolean {
  const alien = alienObj as Alien
  const player = playerObj as Player

  player.died()
  if (alienTypeSettings[alien.alienType].vulnerable) {
    alien.done()
    return true
  }
  return false
}

export function alienHitByBullet(
  alienObj: Phaser.GameObjects.GameObject,
  bulletObj: Phaser.GameObjects.GameObject
): boolean {
  const bullet = bulletObj as Bullet
  const alien = alienObj as Alien

  if (bullet.playerNumber !== 4) {
    bullet.done()
    alien.done(true)
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
      alienTypeSettings[this.alienType].velocity
    )
    this.setVelocity(newVelocity.x, newVelocity.y)

    this.nextTurnTime = this.scene.time.now + Phaser.Math.RND.integerInRange(2000, 10000)
  }

  spawn() {
    this.alienType = Phaser.Math.RND.pick(alienSpawnTypes)
    this.setFrame(alienTypeSettings[this.alienType].spriteNumber)

    this.setAngle(Phaser.Math.RND.integerInRange(0, 360))

    const startingPosition = getStartingEdgePosition()

    this.setPosition(startingPosition.x, startingPosition.y)
    this.body.reset(startingPosition.x, startingPosition.y)
    this.setActive(true)
    this.setVisible(true)

    this.setAngle(Phaser.Math.RND.integerInRange(0, 360))
    this.turn()

    this.setAngularVelocity(Phaser.Math.RND.integerInRange(100, 300) * Phaser.Math.RND.pick([1, -1]))
  }

  shoot() {
    if (alienTypeSettings[this.alienType].shoots) {
      var bullet = bulletGroups[4].get(undefined, undefined, '4') as Bullet

      if (bullet) {
        bullet.fireAlien(this, alienTypeSettings[this.alienType].targetPlayerChance)
      }

      this.nextShootTime =
        this.scene.time.now +
        Phaser.Math.RND.integerInRange(
          alienTypeSettings[this.alienType].shootTimeMin,
          alienTypeSettings[this.alienType].shootTimeMax
        )
    }
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

  done(spawnMineral = false) {
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

    if (spawnMineral) {
      let mineral = minerals.get() as Mineral

      if (mineral) {
        mineral.spawn(this.x, this.y, 4)
      }
    }

    aliens.remove(this, true)
  }
}
