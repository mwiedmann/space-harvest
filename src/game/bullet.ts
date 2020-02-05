import * as Phaser from 'phaser'
import { edgeCollideSetPosition, outOfBounds } from './wrappable'
import { Player, players } from './player'
import { bulletGroups } from './game-init'
import { shipSettings } from './consts'
import { Alien } from './alien'

export class Bullet extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, 0, 0, `bullet${texture}`)

    this.playerNumber = parseInt(texture)
    this.particleManager = this.scene.add.particles(`bullet${this.playerNumber}`)
  }

  particleManager: Phaser.GameObjects.Particles.ParticleEmitterManager

  lifespan = 0
  playerNumber: number

  fire(ship: Player) {
    this.setActive(true)
    this.setVisible(true)

    this.setAngle(ship.rotation)
    this.setPosition(ship.x, ship.y)
    this.body.reset(ship.x, ship.y)

    const newVelocity = this.scene.physics.velocityFromRotation(ship.rotation, shipSettings.bulletSpeed)
    this.setVelocity(newVelocity.x, newVelocity.y)

    this.lifespan = shipSettings.bulletLifetime

    var emitter = this.particleManager.createEmitter({
      speed: 30,
      scale: { start: 1, end: 0 },
      blendMode: 'ADD',
      lifespan: 150
    })

    emitter.startFollow(this)
  }

  fireAlien(alien: Alien, targetPlayerChance: number) {
    this.setActive(true)
    this.setVisible(true)

    this.setAngle(Phaser.Math.RND.integerInRange(0, 360))
    this.setPosition(alien.x, alien.y)
    this.body.reset(alien.x, alien.y)

    let newVelocity: Phaser.Math.Vector2 | undefined = undefined

    if (Phaser.Math.RND.integerInRange(0, 100) <= targetPlayerChance) {
      // Target a player
      if (players.length > 0) {
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

    // Destroy any old particle managers
    if (this.particleManager) {
      this.particleManager.destroy()
    }

    this.particleManager = this.scene.add.particles(`bullet${this.playerNumber}`)
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
    // this.setActive(false)
    // this.setVisible(false)
    // this.body.stop()
    bulletGroups[this.playerNumber].remove(this, true)
    this.particleManager?.destroy()
  }
}
