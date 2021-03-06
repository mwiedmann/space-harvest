import * as Phaser from 'phaser'
import { asteroids, aliens, harvesters, bulletGroups, turrets } from './game-init'
import { players, Player } from './player'
import { Harvester } from './harvester'
import { turretSettings } from './consts'
import { Bullet } from './bullet'

export class Turret extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, `turret`)

    this.playerNumber = parseInt(texture)
    this.lastShotTime = scene.time.now
  }

  playerNumber: number
  startingAngle: number = 0
  lastShotTime: number

  setRangeOfMotion(startingAngleDegress: number) {
    this.startingAngle = startingAngleDegress
    this.setAngle(startingAngleDegress)
  }

  update(time: number, delta: number) {
    const allTargets = [
      ...aliens.children.getArray().filter(a => a.active),
      ...asteroids.children.getArray().filter(a => a.active),
      ...harvesters.children.getArray().filter(a => a.active && (a as Harvester).playerNumber !== this.playerNumber),
      ...players.filter(a => a.active && (a as Player).number !== this.playerNumber)
    ]
      .map(a => {
        const target = a as Phaser.GameObjects.Sprite | Phaser.GameObjects.Image
        const angle = Phaser.Math.Angle.Between(this.xAdj(), this.yAdj(), target.x, target.y)

        const newAngle = Phaser.Math.Angle.RotateTo(Phaser.Math.DegToRad(this.angle), angle, 180)

        return { target, newAngle }
      })
      .filter(a => {
        const angleDiff = Phaser.Math.Angle.ShortestBetween(this.startingAngle, Phaser.Math.RadToDeg(a.newAngle))
        return Math.abs(angleDiff) <= turretSettings.angleRange
      })

    if (allTargets.length) {
      const newTarget = allTargets.sort((a, b) => {
        const aDist = Phaser.Math.Distance.Between(this.xAdj(), this.yAdj(), a.target.x, a.target.y)
        const bDist = Phaser.Math.Distance.Between(this.xAdj(), this.yAdj(), b.target.x, b.target.y)

        return aDist - bDist
      })[0]

      const lerpedAngle = Phaser.Math.Angle.RotateTo(Phaser.Math.DegToRad(this.angle), newTarget.newAngle)
      this.setAngle(Phaser.Math.RadToDeg(lerpedAngle))

      if (time - this.lastShotTime >= turretSettings.fireRate) {
        var bullet = bulletGroups[this.playerNumber].get(undefined, undefined, this.playerNumber.toString()) as Bullet

        if (bullet) {
          bullet.fire(this.xAdj(), this.yAdj(), this.rotation, turretSettings.bulletLifetime)

          this.lastShotTime = time
        }
      }
    }
  }

  xAdj() {
    return this.parentContainer.x + this.x
  }

  yAdj() {
    return this.parentContainer.y + this.y
  }

  done() {
    turrets.remove(this, true)
  }
}
