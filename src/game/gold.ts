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

    this.setAngle(Phaser.Math.RND.integerInRange(0, 360))
    this.setPosition(x, y)
    // this.body.mass = 1
    this.body.reset(x, y)

    const unitVelocity = this.scene.physics.velocityFromRotation(this.rotation, 1)

    this.body.velocity.x = unitVelocity.x * (25 + Phaser.Math.RND.integerInRange(0, 75))
    this.body.velocity.y = unitVelocity.y * (25 + Phaser.Math.RND.integerInRange(0, 75))

    this.setAngularVelocity(Phaser.Math.RND.integerInRange(0, 400) - 200)
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
