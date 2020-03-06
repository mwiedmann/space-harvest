import * as Phaser from 'phaser'
import { Bullet } from './bullet'
import { bulletGroups, minerals, globalFireParticleManager, bosses } from './game-init'
import { Mineral } from './mineral'
import { Player } from './player'
import { settingsHelpers, gameSettings } from './consts'
import { waveData } from './update'

// TODO: Not sure why the params are reversed on this one.
// Maybe because the players are in an array rather than a Group?
export function bossCrashIntoPlayer(
  playerObj: Phaser.GameObjects.GameObject,
  bossObj: Phaser.GameObjects.GameObject
): boolean {
  const player = playerObj as Player

  player.died()
  return false
}

export function bossHitByBullet(
  bossObj: Phaser.GameObjects.GameObject,
  bulletObj: Phaser.GameObjects.GameObject
): boolean {
  const bullet = bulletObj as Bullet
  const boss = bossObj as Boss

  if (bullet.playerNumber !== 4) {
    bullet.done()
    boss.takeDamage(1)
    return true
  }
  return false
}

export class Boss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'boss', 0)
  }

  health = 0

  nextShootTime = 0

  spawn() {
    const startingPosition = { x: settingsHelpers.screenWidthMid, y: -64 }

    this.move(startingPosition.x, startingPosition.y)
    this.setActive(true)
    this.setVisible(true)

    this.health = gameSettings.bossHealth
  }

  move(x: number, y: number) {
    this.setPosition(x, y)
    this.body.reset(x, y)
  }

  shoot() {
    var bullet = bulletGroups[4].get(undefined, undefined, '4') as Bullet

    if (bullet) {
      bullet.fireAlien(this, 50, 1.25)
    }

    this.nextShootTime = this.scene.time.now + Phaser.Math.RND.integerInRange(250, 1000)
  }

  update(time: number, delta: number) {
    if (waveData.bossState === 'set') {
      if (time > this.nextShootTime) {
        this.shoot()
      }
    }

    // Move the boss down to the center
    const yd = this.y < settingsHelpers.screenHeightMid ? 2 : 0
    this.move(this.x, this.y + yd)
  }

  takeDamage(damage: number) {
    this.health -= damage

    if (this.health <= 0) {
      this.done()
    }
  }

  done() {
    globalFireParticleManager.createEmitter({
      speed: 50,
      blendMode: 'ADD',
      lifespan: 1000,
      maxParticles: 25,
      x: this.x,
      y: this.y
    })

    const nuggets = Math.ceil(
      Phaser.Math.RND.integerInRange(gameSettings.bossMineralSpawnMin, gameSettings.bossMineralSpawnMax)
    )

    for (let i = 0; i < nuggets; i++) {
      let mineral = minerals.get() as Mineral

      if (mineral) {
        mineral.spawn(this.x, this.y)
      }
    }

    bosses.remove(this, true)
    waveData.bossState = 'destroyed'
    waveData.bossPhaseTime = this.scene.time.now
  }
}
