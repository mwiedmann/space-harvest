import * as Phaser from 'phaser'
import { bases } from './game-init'
import { Bullet } from './bullet'
import { Asteroid } from './asteroid'
import { Mineral } from './mineral'
import { players } from './player'

export function baseHitByBullet(
  baseObj: Phaser.GameObjects.GameObject,
  bulletObj: Phaser.GameObjects.GameObject
): boolean {
  const bullet = bulletObj as Bullet
  const base = baseObj as Base

  if (bullet.playerNumber !== base.playerNumber) {
    bullet.done()
    return true
  }
  return false
}

export function baseHitByRock(baseObj: Phaser.GameObjects.GameObject, rockObj: Phaser.GameObjects.GameObject): void {
  const rock = rockObj as Asteroid

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

  playerNumber = 0

  spawn(x: number, y: number) {
    this.setActive(true)
    this.setVisible(true)
    this.body.reset(x, y)
  }

  done() {
    // this.setActive(false)
    // this.setVisible(false)
    // this.body.stop()
    bases.remove(this, true)
  }
}
