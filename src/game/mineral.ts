import * as Phaser from 'phaser'
import { minerals } from './game-init'
import { edgeCollideSetPosition, outOfBounds } from './wrappable'

const randomMineral = () => {
  const r = Phaser.Math.RND.integerInRange(0, 100)

  if (r < 10) {
    return 3
  } else if (r < 30) {
    return 2
  } else if (r < 60) {
    return 1
  } else {
    return 0
  }
}

const mineralValue = [100, 250, 500, 1000]

export class Mineral extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'mineral', randomMineral())
  }

  value = 0

  spawn(x: number, y: number) {
    const mineralType = randomMineral()
    this.value = mineralValue[mineralType]
    this.setFrame(mineralType)

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
    minerals.remove(this, true)
  }
}
