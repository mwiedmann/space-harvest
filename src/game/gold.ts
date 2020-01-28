import * as Phaser from 'phaser'
import { goldNuggets } from './game-init'
import { edgeCollideSetPosition, outOfBounds } from './wrappable'

export class Gold extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'gold')
  }

  value = 100

  spawn(x: number, y: number) {
    this.setActive(true)
    this.setVisible(true)

    this.setAngle(Math.random() * 360)
    this.setPosition(x, y)
    // this.body.mass = 1
    this.body.reset(x, y)

    const unitVelocity = this.scene.physics.velocityFromRotation(this.rotation, 1)

    this.body.velocity.x = unitVelocity.x * (25 + Math.random() * 75)
    this.body.velocity.y = unitVelocity.y * (25 + Math.random() * 75)

    this.setAngularVelocity(Math.random() * 400 - 200)
  }

  update(time: number, delta: number) {
    if (outOfBounds(this.x, this.y)) {
      const { x: newX, y: newY } = edgeCollideSetPosition(this.x, this.y)
      this.setPosition(newX, newY)
    }
  }

  done() {
    // this.setActive(false)
    // this.setVisible(false)
    // this.body.stop()
    goldNuggets.remove(this, true)
  }
}
