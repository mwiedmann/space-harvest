import * as Phaser from 'phaser'
import { gameSettings, harvesterSettings } from './consts'
import { minerals, globalFireParticleManager, asteroids } from './game-init'
import { Mineral } from './mineral'
import { Base } from './base'
import { edgeCollideSetPosition, outOfBounds } from './wrappable'
import { Bullet } from './bullet'
import { players } from './player'

export function harvesterCollectMineral(
  harvesterObj: Phaser.GameObjects.GameObject,
  mineralObj: Phaser.GameObjects.GameObject
): boolean {
  const mineral = mineralObj as Mineral
  const harvester = harvesterObj as Harvester

  harvester.collectMineral(mineral.value)
  mineral.done()

  return false
}

export function harvesterCrashIntoRock(
  harvesterObj: Phaser.GameObjects.GameObject,
  rockObj: Phaser.GameObjects.GameObject
): boolean {
  const harvester = harvesterObj as Harvester

  harvester.died()
  return false
}

export function harvesterCrashIntoBase(
  harvesterObj: Phaser.GameObjects.GameObject,
  baseObj: Phaser.GameObjects.GameObject
): boolean {
  const base = baseObj as Base
  const harvester = harvesterObj as Harvester

  if (base.playerNumber !== harvester.playerNumber) {
    harvester.died()
    base.hitByPlayer()
    return true
  }
  return false
}

export function harvesterHitByBullet(
  harvesterObj: Phaser.GameObjects.GameObject,
  bulletObj: Phaser.GameObjects.GameObject
): boolean {
  const bullet = bulletObj as Bullet
  const harvester = harvesterObj as Harvester

  if (bullet.playerNumber !== harvester.playerNumber) {
    bullet.done()
    harvester.died()
    return true
  }
  return false
}

export class Harvester extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y + harvesterSettings.baseSpawnAdjustY, `harvester`, texture)

    scene.physics.add.existing(this)

    this.playerNumber = parseInt(texture)

    this.setAngularDrag(harvesterSettings.angularDrag)
    this.setDrag(harvesterSettings.drag)
    this.setMaxVelocity(harvesterSettings.maxVelocity, harvesterSettings.maxVelocity)
    this.setBounce(0.2)

    const pb = this.body as Phaser.Physics.Arcade.Body
    pb.setGravity(0, 0)

    // Harvester starts "dead" and can't move/fire for a few moments
    this.diedTime = this.scene.time.now - (harvesterSettings.deadTime - 1000)

    this.particleManager = this.scene.add.particles(`bullet${texture}`)

    // Start not active. After a few moments the ship will spawn
    this.setActive(false)
    this.setVisible(false)
    this.body.stop()
  }

  particleManager: Phaser.GameObjects.Particles.ParticleEmitterManager

  playerNumber: number
  diedTime: number
  dead = true

  collectMineral(value: number) {
    players.find(p => p.number === this.playerNumber)?.scoreUpdate(value, false)
    // TODO: Show float text
  }

  update(time: number, delta: number) {
    if (this.dead) {
      this.setVisible(false)
      if (this.diedTime + harvesterSettings.deadTime <= time) {
        this.respawn()
      }
      return
    } else if (outOfBounds(this.x, this.y)) {
      const { x: newX, y: newY } = edgeCollideSetPosition(this.x, this.y)
      this.setPosition(newX, newY)
    }

    this.aiMove(time, delta)
  }

  objectCloseEnoughForAI(obj: Phaser.GameObjects.GameObject) {
    const sprite = obj as Phaser.GameObjects.Sprite

    return (
      (this.playerNumber === 0 && sprite.x <= gameSettings.screenWidth / 2) ||
      (this.playerNumber === 1 && sprite.x >= gameSettings.screenWidth / 2)
    )
  }

  aiMove(time: number, delta: number) {
    const allTargets = minerals.children.getArray().filter(a => a.active)

    let target: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image

    if (allTargets.length) {
      target = allTargets.sort((a, b) => {
        const aObj = a as Phaser.GameObjects.Sprite
        const bObj = b as Phaser.GameObjects.Sprite
        const aDist = Phaser.Math.Distance.Between(this.x, this.y, aObj.x, aObj.y)
        const bDist = Phaser.Math.Distance.Between(this.x, this.y, bObj.x, bObj.y)

        return aDist - bDist
      })[0] as Phaser.GameObjects.Sprite
    } else {
      // No targets, just fly back to base
      target = players.find(p => p.number === this.playerNumber)?.base!
    }

    let turnAmount: number
    let angle: number

    // If AI is nearing another base or hazard, turn around and don't crash into it
    // This overrides any target
    const otherPlayerBases = players.filter(p => p.number !== this.playerNumber).map(p => p.base)

    const objectsToAvoid = [...otherPlayerBases, ...asteroids.children.getArray().filter(a => a.active)]
      .map(o => o as Phaser.GameObjects.Sprite)
      .filter(o => o && Phaser.Math.Distance.Between(this.x, this.y, o.x, o.y) < 150)

    if (objectsToAvoid.length) {
      const avoid = objectsToAvoid.sort((a, b) => {
        const aObj = a as Phaser.GameObjects.Sprite
        const bObj = b as Phaser.GameObjects.Sprite
        const aDist = Phaser.Math.Distance.Between(this.x, this.y, aObj.x, aObj.y)
        const bDist = Phaser.Math.Distance.Between(this.x, this.y, bObj.x, bObj.y)

        return aDist - bDist
      })[0] as Phaser.GameObjects.Sprite

      const angleToBase = Phaser.Math.Angle.Between(this.x, this.y, avoid.x, avoid.y)
      angle = Phaser.Math.Angle.Reverse(angleToBase)
      turnAmount = 0.07
    } else {
      // As the AI nears its target, we allow it to turn a bit more or it may fly by
      // TODO: Don't know why the harvester can't turn as well as the AI Player.
      // I had to set the turnAmounts much higher here. Something with Physics?
      turnAmount = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y) < 200 ? 0.1 : 0.07

      angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y)
    }

    const newAngle = Phaser.Math.Angle.RotateTo(Phaser.Math.DegToRad(this.angle), angle, turnAmount)
    this.setAngle(Phaser.Math.RadToDeg(newAngle))

    // Normal speed for AI is a little slower or they are too chaotic.
    const speedRatio = 0.25

    // Slow the AI down a tad, not full throttle
    const unitVelocity = this.scene.physics.velocityFromRotation(this.rotation, speedRatio)
    this.setVelocity(
      this.body.velocity.x + unitVelocity.x * harvesterSettings.acceleration,
      this.body.velocity.y + unitVelocity.y * harvesterSettings.acceleration
    )
    this.thrustEffect()
  }

  thrustEffect() {
    const directionVector = this.scene.physics.velocityFromRotation(this.rotation, 12)

    this.particleManager.createEmitter({
      blendMode: 'ADD',
      lifespan: 100,
      maxParticles: 1,
      alpha: 0.2,
      scale: { start: 2, end: 1 },
      x: this.x - directionVector.x,
      y: this.y - directionVector.y
    })
  }

  /** Play the respawn effects */
  respawnEffect() {
    this.particleManager.createEmitter({
      speed: 150,
      blendMode: 'ADD',
      lifespan: 1000,
      maxParticles: 20,
      scale: { start: 0.7, end: 0 },
      x: this.x,
      y: this.y
    })
  }

  /** Respawn a harvester at their base */
  respawn() {
    this.respawnEffect()

    this.dead = false
    this.diedTime = 0
    this.setActive(true)
    this.setVisible(true)
  }

  /** Call when a harvester dies */
  died() {
    this.deathEffects()
  }

  destroyed() {
    this.particleManager.destroy()

    // If they haven't just died, then kill them
    if (!this.dead) {
      this.deathEffects()
    }
    this.destroy()
  }

  /** Play the death explosion, reset the harvester, and update some death settings/timers */
  deathEffects() {
    globalFireParticleManager.createEmitter({
      speed: 50,
      blendMode: 'ADD',
      lifespan: 700,
      maxParticles: 15,
      scale: 0.7,
      x: this.x,
      y: this.y
    })

    const player = players.find(p => p.number === this.playerNumber)!

    // TODO: Bug where body is null here sometimes
    this.body?.reset(player.baseX, player.baseY + harvesterSettings.baseSpawnAdjustY)
    this.setActive(false)
    this.setVisible(false)
    this.body.stop()

    this.dead = true
    this.diedTime = this.scene.time.now
  }
}
