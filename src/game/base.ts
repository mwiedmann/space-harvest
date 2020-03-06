import * as Phaser from 'phaser'
import { bases, globalFireParticleManager } from './game-init'
import { Bullet } from './bullet'
import { Asteroid } from './asteroid'
import { Mineral } from './mineral'
import { players } from './player'
import { gameSettings, IBaseLocation } from './consts'
import { waveData } from './update'

export function baseHitByBullet(
  baseObj: Phaser.GameObjects.GameObject,
  bulletObj: Phaser.GameObjects.GameObject
): boolean {
  const bullet = bulletObj as Bullet
  const base = baseObj as Base

  if (bullet.playerNumber !== base.playerNumber) {
    bullet.done()
    base.hitByBullet()
    return true
  }
  return false
}

export function baseHitByRock(baseObj: Phaser.GameObjects.GameObject, rockObj: Phaser.GameObjects.GameObject): void {
  const rock = rockObj as Asteroid
  const base = baseObj as Base

  base.hitByAsteroid()
  rock.breakApart()
}

export function baseCollectMineral(
  baseObj: Phaser.GameObjects.GameObject,
  mineralObj: Phaser.GameObjects.GameObject
): void {
  const mineral = mineralObj as Mineral
  const base = baseObj as Base

  players.find(p => p.number === base.playerNumber)?.scoreUpdate(mineral.value)
  mineral.done()
}

export class Base extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'base')
  }

  baseContainer!: Phaser.GameObjects.Container
  baseLocation!: IBaseLocation

  playerNumber = 0

  move(x: number, y: number) {
    this.body.reset(x, y)
    this.baseContainer.setPosition(x, y)
  }

  spawn() {
    this.setActive(true)
    this.setVisible(true)
    this.baseContainer = this.scene.add.container(0, 0)
  }

  hitByBullet() {
    players.find(p => p.number === this.playerNumber)?.energyUpdate(gameSettings.baseHitByBulletEnergyPenalty)

    // TODO: Spawn a little explosion?
  }

  hitByAsteroid() {
    players.find(p => p.number === this.playerNumber)?.energyUpdate(gameSettings.baseHitByAsteroidEnergyPenalty)
  }

  hitByAlien() {
    players.find(p => p.number === this.playerNumber)?.energyUpdate(gameSettings.baseHitByAlienEnergyPenalty)
  }

  hitByPlayer() {
    players.find(p => p.number === this.playerNumber)?.energyUpdate(gameSettings.baseHitByPlayerEnergyPenalty)
  }

  update() {
    // TODO: Refactor this to use proper direction calc
    if (waveData.bossState === 'entering') {
      const xd = this.x === this.baseLocation.retreatX ? 0 : this.x > this.baseLocation.retreatX ? -2 : 2
      const yd = this.y === this.baseLocation.retreatY ? 0 : this.y > this.baseLocation.retreatY ? -2 : 2

      this.move(this.x + xd, this.y + yd)
    } else if (waveData.bossState === 'destroyed') {
      const xd = this.x === this.baseLocation.x ? 0 : this.x < this.baseLocation.x ? 2 : -2
      const yd = this.y === this.baseLocation.y ? 0 : this.y < this.baseLocation.y ? 2 : -2

      this.move(this.x + xd, this.y + yd)
    }
  }

  done() {
    globalFireParticleManager.createEmitter({
      speed: 75,
      blendMode: 'ADD',
      lifespan: 2000,
      maxParticles: 100,
      x: this.x,
      y: this.y
    })

    bases.remove(this, true)
    this.baseContainer.destroy()
  }
}
