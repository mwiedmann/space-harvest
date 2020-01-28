import * as Phaser from 'phaser'
import { edgeCollideSetPosition, outOfBounds } from './wrappable'
import { Player } from './player'
import { bulletGroups } from './game-init'
import { shipSettings } from './consts'

export class Bullet extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, 0, 0, `bullet${texture}`)

    this.playerNumber = parseInt(texture)
  }

  particleManager: Phaser.GameObjects.Particles.ParticleEmitterManager | undefined

  lifespan = 0
  playerNumber: number

  fire(ship: Player) {
    this.setActive(true)
    this.setVisible(true)

    this.setAngle(ship.rotation)
    this.setPosition(ship.x, ship.y)
    this.body.reset(ship.x, ship.y)

    const unitVelocity = this.scene.physics.velocityFromRotation(ship.rotation, 1)

    this.body.velocity.x = ship.body.velocity.x + unitVelocity.x * shipSettings.bulletSpeed
    this.body.velocity.y = ship.body.velocity.y + unitVelocity.y * shipSettings.bulletSpeed

    this.lifespan = shipSettings.bulletLifetime

    this.particleManager = this.scene.add.particles(`bullet${this.playerNumber}`)
    var emitter = this.particleManager.createEmitter({
      speed: 30,
      scale: { start: 1, end: 0 },
      blendMode: 'ADD',
      lifespan: 150
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
    // this.setActive(false)
    // this.setVisible(false)
    // this.body.stop()
    bulletGroups[this.playerNumber].remove(this, true)
    this.particleManager?.destroy()
  }
}
