import * as Phaser from 'phaser'
import { minerals, asteroids } from './game-init'
import { Bullet } from './bullet'
import { Mineral } from './mineral'
import { edgeCollideSetPosition, outOfBounds, getStartingEdgePosition } from './wrappable'

export function shootRock(rockObj: Phaser.GameObjects.GameObject, bulletObj: Phaser.GameObjects.GameObject): void {
  const rock = rockObj as Asteroid
  const bullet = bulletObj as Bullet

  bullet.done()
  rock.breakApart()
}

export class Asteroid extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'asteroid', Phaser.Math.RND.integerInRange(0, 3))

    this.rubbleParticleManager = this.scene.add.particles(`rubble`)
  }

  rubbleParticleManager: Phaser.GameObjects.Particles.ParticleEmitterManager

  spawn() {
    this.setActive(true)
    this.setVisible(true)

    this.setAngle(Phaser.Math.RND.integerInRange(0, 360))
    const startingPosition = getStartingEdgePosition()

    this.setPosition(startingPosition.x, startingPosition.y)
    // this.body.mass = 10
    this.body.reset(startingPosition.x, startingPosition.y)

    const newVelocity = this.scene.physics.velocityFromRotation(
      this.rotation,
      25 + Phaser.Math.RND.integerInRange(0, 75)
    )
    this.setVelocity(newVelocity.x, newVelocity.y)

    this.setAngularVelocity(Phaser.Math.RND.integerInRange(0, 400) - 200)
  }

  breakApart() {
    this.rubbleParticleManager.createEmitter({
      speed: 50,
      blendMode: 'ADD',
      lifespan: 700,
      maxParticles: 25,
      // quantity: 25,
      scale: { start: 1, end: 0.25 },
      x: this.x,
      y: this.y
    })

    const nuggets = Math.ceil(Phaser.Math.RND.integerInRange(1, 5))

    for (let i = 0; i < nuggets; i++) {
      let mineral = minerals.get() as Mineral

      if (mineral) {
        mineral.spawn(this.x, this.y)
      }
    }
    this.done()
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
    asteroids.remove(this, true)
  }
}
