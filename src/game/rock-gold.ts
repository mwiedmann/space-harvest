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

export class RockGold extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'rock-gold', Phaser.Math.RND.integerInRange(0, 3))

    this.rubbleParticleManager = this.scene.add.particles(`rubble`)
  }

  rubbleParticleManager: Phaser.GameObjects.Particles.ParticleEmitterManager

  spawn() {
    this.setActive(true)
    this.setVisible(true)

    this.setAngle(Phaser.Math.RND.integerInRange(0, 360))
    let x: number
    let y: number

    // Position just outside of the screen randomly
    if (Phaser.Math.RND.normal() < 0) {
      if (Phaser.Math.RND.normal() < 0) {
        x = 0
        y = Phaser.Math.RND.integerInRange(0, gameSettings.screenHeight)
      } else {
        x = Phaser.Math.RND.integerInRange(0, gameSettings.screenWidth)
        y = 0
      }
    } else {
      if (Phaser.Math.RND.normal() < 0) {
        x = gameSettings.screenWidth
        y = Phaser.Math.RND.integerInRange(0, gameSettings.screenHeight)
      } else {
        x = Phaser.Math.RND.integerInRange(0, gameSettings.screenWidth)
        y = gameSettings.screenHeight
      }
    }

    this.setPosition(x, y)
    // this.body.mass = 10
    this.body.reset(x, y)

    const unitVelocity = this.scene.physics.velocityFromRotation(this.rotation, 1)

    this.body.velocity.x = unitVelocity.x * (25 + Phaser.Math.RND.integerInRange(0, 75))
    this.body.velocity.y = unitVelocity.y * (25 + Phaser.Math.RND.integerInRange(0, 75))

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

    const nuggets = Math.ceil(Phaser.Math.RND.integerInRange(0, 5))

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
