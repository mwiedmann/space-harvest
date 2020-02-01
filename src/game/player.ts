import * as Phaser from 'phaser'
import { shipSettings, settingsHelpers, gameSettings } from './consts'
import { minerals, bases, fireParticleManager } from './game-init'
import { Mineral } from './mineral'
import { Asteroid } from './asteroid'
import { Base } from './base'
import { edgeCollideSetPosition, outOfBounds } from './wrappable'
import { Bullet } from './bullet'
import { updateState } from './update'

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

    this.createBase(number)

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setPosition(this.baseX, this.baseY)
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

    this.spawnParticleManager = this.scene.add.particles(`bullet${number}`)

    // Start not active. After a few moments the ship will spawn
    this.setActive(false)
    this.setVisible(false)
    this.body.stop()

    // this.setCollideWorldBounds(true)
    // // Typing error? Doesn't work without this but says is readoly
    // const db: any = this.body
    // db.onWorldBounds = true
  }

  base: Base | undefined

  spawnParticleManager: Phaser.GameObjects.Particles.ParticleEmitterManager

  scoreText!: Phaser.GameObjects.Text

  private score = gameSettings.playerStartingScore

  lastFired = 0

  baseX: number = 0
  baseY: number = 0

  diedTime: number
  dead = true

  createBase(playerNumber: number) {
    const baseLocation = settingsHelpers.playerStartingLocations[playerNumber]
    this.baseX = baseLocation.x
    this.baseY = baseLocation.y
    this.base = bases.get() as Base
    this.base.playerNumber = playerNumber
    this.base.spawn(baseLocation.x, baseLocation.y)

    this.scoreText = this.scene.add.text(this.baseX - 32, this.baseY - 32, this.score.toString(), {
      color: 'yellow'
    })
  }

  scoreUpdate(points: number, showFloatText?: boolean, playerDied?: boolean) {
    this.score += points
    if (this.score < 0) {
      this.score = 0
    }
    this.scoreText.text = this.score.toString()

    if (showFloatText) {
      const pointText = this.scene.add.text(this.x, this.y, points.toString(), { color: points > 0 ? '#4F4' : '#F44' })
      const startTime = this.scene.time.now

      // Get a closure on `scene` because if the player gets destroyed, this event still needs a ref to the scene
      // TODO: Is there a better way to do this besides an an update event?
      const scene = this.scene
      const event = (time: number, delta: number) => {
        if (time - startTime > 2000) {
          pointText.destroy()
          scene.events.off('update', event)
        }
      }
      scene.events.on('update', event)
    }

    // Destroy the player's base if they run out of energy
    if (this.score === 0) {
      this.destroyed(playerDied)
    }
  }

  /**
   * Call when a player is out of energy and its game over
   * @param playerDied Did this happen during a player death? Need to know so we don't replay the death effects
   */
  destroyed(playerDied?: boolean) {
    this.base?.done()
    this.base = undefined
    this.scoreText.destroy()
    this.spawnParticleManager.destroy()

    // If they haven't just died, then kill them
    if (!playerDied) {
      this.deathEffects()
    }

    // Make players wait for a few seconds to join after someone is destroyed.
    // Keeps a player from instantly joining the game after they die.
    updateState.nextJoinTime = this.scene.time.now + gameSettings.timeAfterPlayerDestroyedToRejoin

    players.splice(players.indexOf(this), 1)
    this.destroy()
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

    fireParticleManager.createEmitter({
      blendMode: 'ADD',
      lifespan: 500,
      maxParticles: 1,
      alpha: 0.5,
      scale: { start: 0.7, end: 0 },
      x: this.x - directionVector.x,
      y: this.y - directionVector.y
    })
  }

  /** Play the respawn effects */
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

  /** Respawn a player at their base */
  respawn() {
    this.respawnEffect()

    this.dead = false
    this.diedTime = 0
    this.setActive(true)
    this.setVisible(true)
  }

  /** Call when a player dies */
  died() {
    this.deathEffects()
    this.scoreUpdate(gameSettings.playerDeathScorePenalty, true, true)
  }

  /** Play the death explosion, reset the player, and update some death settings/timers */
  deathEffects() {
    fireParticleManager.createEmitter({
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
