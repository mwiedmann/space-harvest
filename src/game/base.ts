import * as Phaser from 'phaser'
import { bases } from './game-init'
import { Bullet } from './bullet'
import { RockGold } from './rock-gold'
import { Gold } from './gold'
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
  const rock = rockObj as RockGold

  rock.breakApart()
}

export function baseCollectGold(baseObj: Phaser.GameObjects.GameObject, goldObj: Phaser.GameObjects.GameObject): void {
  const gold = goldObj as Gold
  const base = baseObj as Base

  players.find(p => p.number === base.playerNumber)?.scoreUpdate(gold.value)

  gold.done()
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
