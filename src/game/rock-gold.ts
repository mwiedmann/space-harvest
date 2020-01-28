import * as Phaser from 'phaser'
import { gameSettings } from './consts'
import { goldNuggets, rockGoldBoulders } from './game-init'
import { Bullet } from './bullet'
import { Gold } from './gold'
import { edgeCollideSetPosition, outOfBounds } from './wrappable'

export function shootRock(rockObj: Phaser.GameObjects.GameObject, bulletObj: Phaser.GameObjects.GameObject): void {
  // if (!rockObj.active || !bulletObj.active) {
  //   return
  // }
  const rock = rockObj as RockGold
  const bullet = bulletObj as Bullet

  bullet.done()
  rock.breakApart()
}

export class RockGold extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'rock-gold')

    this.rubbleParticleManager = this.scene.add.particles(`rubble`)
  }

  rubbleParticleManager: Phaser.GameObjects.Particles.ParticleEmitterManager

  spawn() {
    this.setActive(true)
    this.setVisible(true)

    this.setAngle(Math.random() * 360)
    let x: number
    let y: number

    // Position just outside of the screen randomly
    if (Math.random() < 0.5) {
      if (Math.random() < 0.5) {
        x = 0
        y = Math.random() * gameSettings.screenHeight
      } else {
        x = Math.random() * gameSettings.screenWidth
        y = 0
      }
    } else {
      if (Math.random() < 0.5) {
        x = gameSettings.screenWidth
        y = Math.random() * gameSettings.screenHeight
      } else {
        x = Math.random() * gameSettings.screenWidth
        y = gameSettings.screenHeight
      }
    }

    this.setPosition(x, y)
    // this.body.mass = 10
    this.body.reset(x, y)

    const unitVelocity = this.scene.physics.velocityFromRotation(this.rotation, 1)

    this.body.velocity.x = unitVelocity.x * (25 + Math.random() * 75)
    this.body.velocity.y = unitVelocity.y * (25 + Math.random() * 75)

    this.setAngularVelocity(Math.random() * 400 - 200)
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

    const nuggets = Math.ceil(Math.random() * 5)

    for (let i = 0; i < nuggets; i++) {
      let gold = goldNuggets.get() as Gold

      if (gold) {
        gold.spawn(this.x, this.y)
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
    rockGoldBoulders.remove(this, true)
  }
}
