import * as Phaser from 'phaser'
import { shipSettings, settingsHelpers, gameSettings } from './consts'
import { minerals, bases } from './game-init'
import { Mineral } from './mineral'
import { Asteroid } from './asteroid'
import { Base } from './base'
import { edgeCollideSetPosition, outOfBounds } from './wrappable'
import { Bullet } from './bullet'

export const players: Player[] = []

function playerCollectMineral(
  playerObj: Phaser.GameObjects.GameObject,
  mineralObj: Phaser.GameObjects.GameObject
): void {
  const mineral = mineralObj as Mineral
  const player = playerObj as Player

  player.scoreUpdate(mineral.value, true)

  mineral.done()
}

export function playerCrashIntoRock(
  playerObj: Phaser.GameObjects.GameObject,
  rockObj: Phaser.GameObjects.GameObject
): void {
  const rock = rockObj as Asteroid
  const player = playerObj as Player

  rock.breakApart()
  player.died()
}

export function playerCrashIntoBase(
  playerObj: Phaser.GameObjects.GameObject,
  baseObj: Phaser.GameObjects.GameObject
): boolean {
  const base = baseObj as Base
  const player = playerObj as Player

  if (base.playerNumber !== player.number) {
    player.died()
    return true
  }
  return false
}

export function playerHitByBullet(
  playerObj: Phaser.GameObjects.GameObject,
  bulletObj: Phaser.GameObjects.GameObject
): boolean {
  const bullet = bulletObj as Bullet
  const player = playerObj as Player

  if (bullet.playerNumber !== player.number) {
    bullet.done()
    player.died()
    return true
  }
  return false
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, public name: string, public number: number) {
    super(scene, 0, 0, `ship${number}`)

    const baseLocation = settingsHelpers.playerStartingLocations[number]
    this.baseX = baseLocation.x
    this.baseY = baseLocation.y
    const base = bases.get() as Base
    base.playerNumber = number
    base.spawn(baseLocation.x, baseLocation.y)

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setPosition(baseLocation.x, baseLocation.y)
    this.setAngularDrag(shipSettings.angularDrag)
    this.setDrag(shipSettings.drag)
    this.setMaxVelocity(shipSettings.maxVelocity, shipSettings.maxVelocity)
    this.setBounce(0.2)
    const pb = this.body as Phaser.Physics.Arcade.Body
    pb.setGravity(0, 0)

    // this.body.mass = 4
    scene.physics.add.overlap(this, minerals, playerCollectMineral, undefined, scene)

    // Player starts "dead" and can't move/fire for a few moments
    this.diedTime = this.scene.time.now - (shipSettings.deadTime - 1000)

    this.fireParticleManager = this.scene.add.particles(`fire1`)
    this.spawnParticleManager = this.scene.add.particles(`bullet${number}`)

    // Start not active. After a few moments the ship will spawn
    this.setActive(false)
    this.setVisible(false)
    this.body.stop()

    this.scoreText = scene.add.text(baseLocation.x - 32, baseLocation.y - 32, this.score.toString(), {
      color: 'yellow'
    })

    // this.setCollideWorldBounds(true)
    // // Typing error? Doesn't work without this but says is readoly
    // const db: any = this.body
    // db.onWorldBounds = true
  }

  fireParticleManager: Phaser.GameObjects.Particles.ParticleEmitterManager
  spawnParticleManager: Phaser.GameObjects.Particles.ParticleEmitterManager

  scoreText: Phaser.GameObjects.Text

  private score = 0

  lastFired = 0

  baseX: number
  baseY: number

  diedTime: number
  dead = true

  scoreUpdate(points: number, showFloatText?: boolean) {
    this.score += points
    if (this.score < 0) {
      this.score = 0
    }
    this.scoreText.text = this.score.toString()

    if (showFloatText) {
      const pointText = this.scene.add.text(this.x, this.y, points.toString(), { color: '#7F7' })
      const startTime = this.scene.time.now
      const event = (time: number, delta: number) => {
        if (time - startTime > 2000) {
          pointText.destroy()
          this.scene.events.off('update', event)
        }
      }
      this.scene.events.on('update', event)
    }
  }

  update(time: number, delta: number) {
    if (this.dead) {
      if (this.diedTime + shipSettings.deadTime <= time) {
        this.respawn()
      }
    } else if (outOfBounds(this.x, this.y)) {
      const { x: newX, y: newY } = edgeCollideSetPosition(this.x, this.y)
      this.setPosition(newX, newY)
    }
  }

  thrustEffect() {
    const directionVector = this.scene.physics.velocityFromRotation(this.rotation, 12)

    this.fireParticleManager.createEmitter({
      blendMode: 'ADD',
      lifespan: 500,
      maxParticles: 1,
      alpha: 0.5,
      scale: { start: 0.7, end: 0 },
      x: this.x - directionVector.x,
      y: this.y - directionVector.y
    })
  }

  respawnEffect() {
    this.spawnParticleManager.createEmitter({
      speed: 150,
      blendMode: 'ADD',
      lifespan: 1500,
      maxParticles: 25,
      scale: { start: 1, end: 0 },
      x: this.x,
      y: this.y
    })
  }

  respawn() {
    this.respawnEffect()

    this.dead = false
    this.diedTime = 0
    this.setActive(true)
    this.setVisible(true)
  }

  died() {
    this.scoreUpdate(gameSettings.deathScorePenalty)
    this.fireParticleManager.createEmitter({
      speed: 50,
      blendMode: 'ADD',
      lifespan: 1000,
      maxParticles: 25,
      x: this.x,
      y: this.y
    })

    this.body.reset(this.baseX, this.baseY)
    this.setActive(false)
    this.setVisible(false)
    this.body.stop()

    this.dead = true
    this.diedTime = this.scene.time.now
  }
}
