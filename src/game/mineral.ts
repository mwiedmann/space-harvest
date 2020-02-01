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

const mineralValues: { value: number; particles?: number }[] = [
  { value: 100 },
  { value: 250 },
  { value: 500, particles: 250 },
  { value: 1000, particles: 100 },
  { value: 5000, particles: 50 }
]

export class Mineral extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'mineral', randomMineral())
    this.sparkleParticleManager = this.scene.add.particles('mineral', 0)
  }

  sparkleParticleManager: Phaser.GameObjects.Particles.ParticleEmitterManager

  value = 0

  spawn(x: number, y: number, mineralType?: 0 | 1 | 2 | 3 | 4) {
    mineralType = mineralType || randomMineral()
    this.value = mineralValues[mineralType].value
    this.setFrame(mineralType)

    if (mineralValues[mineralType].particles) {
      this.sparkleParticleManager = this.scene.add.particles('mineral', mineralType)
      const emitter = this.sparkleParticleManager.createEmitter({
        speed: 100,
        blendMode: 'ADD',
        lifespan: 250,
        frequency: mineralValues[mineralType].particles,
        scale: { start: 0.5, end: 0 }
      })
      emitter.startFollow(this)
    }

    this.setActive(true)
    this.setVisible(true)

    this.setAngle(Phaser.Math.RND.integerInRange(0, 360))
    this.setPosition(x, y)
    // this.body.mass = 1
    this.body.reset(x, y)

    const newVelocity = this.scene.physics.velocityFromRotation(
      this.rotation,
      25 + Phaser.Math.RND.integerInRange(0, 75)
    )
    this.setVelocity(newVelocity.x, newVelocity.y)

    this.setAngularVelocity(Phaser.Math.RND.integerInRange(0, 400) - 200)
  }

  update(time: number, delta: number) {
    if (outOfBounds(this.x, this.y)) {
      const { x: newX, y: newY } = edgeCollideSetPosition(this.x, this.y)
      this.setPosition(newX, newY)
    }
  }

  done() {
    this.sparkleParticleManager.destroy()
    minerals.remove(this, true)
  }
}
