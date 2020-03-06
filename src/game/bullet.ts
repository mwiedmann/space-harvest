import * as Phaser from 'phaser'
import { edgeCollideSetPosition, outOfBounds } from './wrappable'
import { players } from './player'
import { bulletGroups } from './game-init'
import { shipSettings } from './consts'

export class Bullet extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, 0, 0, `bullet${texture}`)

    this.playerNumber = parseInt(texture)
    this.particleManager = this.scene.add.particles(`bullet${this.playerNumber}`)
  }

  particleManager: Phaser.GameObjects.Particles.ParticleEmitterManager

  lifespan = 0
  playerNumber: number

  fire(x: number, y: number, rotation: number, lifespan: number) {
    this.setActive(true)
    this.setVisible(true)

    this.setAngle(rotation)
    this.setPosition(x, y)
    this.body.reset(x, y)

    const newVelocity = this.scene.physics.velocityFromRotation(rotation, shipSettings.bulletSpeed)
    this.setVelocity(newVelocity.x, newVelocity.y)

    this.lifespan = lifespan

    var emitter = this.particleManager.createEmitter({
      speed: 30,
      scale: { start: 1, end: 0 },
      blendMode: 'ADD',
      lifespan: 150
    })

    emitter.startFollow(this)
  }

  fireAlien(alien: Phaser.GameObjects.Sprite, targetPlayerChance: number) {
    this.setActive(true)
    this.setVisible(true)

    this.setAngle(Phaser.Math.RND.integerInRange(0, 360))
    this.setPosition(alien.x, alien.y)
    this.body.reset(alien.x, alien.y)

    let newVelocity: Phaser.Math.Vector2 | undefined = undefined

    if (Phaser.Math.RND.integerInRange(0, 100) <= targetPlayerChance) {
      // Target a player
      if (players.filter(p => !p.dead).length > 0) {
        const player = Phaser.Math.RND.pick(players)
        newVelocity = this.scene.physics.velocityFromAngle(
          Phaser.Math.RadToDeg(
            Phaser.Math.Angle.Reverse(Phaser.Math.Angle.Between(player.x, player.y, alien.x, alien.y))
          ),
          shipSettings.bulletSpeed
        )
      }
    }

    // If no target, fire randomly
    if (!newVelocity) {
      newVelocity = this.scene.physics.velocityFromRotation(this.rotation, shipSettings.bulletSpeed)
    }

    this.setVelocity(newVelocity.x, newVelocity.y)
    this.lifespan = shipSettings.bulletLifetime

    var emitter = this.particleManager.createEmitter({
      speed: 20,
      scale: { start: 1, end: 0 },
      blendMode: 'ADD',
      lifespan: 70
    })

    emitter.startFollow(this)
  }

  update(time: number, delta: number) {
    this.lifespan -= delta
    if (this.lifespan <= 0) {
      this.done()
    }

    if (outOfBounds(this.x, this.y)) {
      const { x: newX, y: newY } = edgeCollideSetPosition(this.x, this.y)
      this.setPosition(newX, newY)
    }
  }

  done() {
    this.particleManager.destroy()
    bulletGroups[this.playerNumber].remove(this, true)
  }
}
