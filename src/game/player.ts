import * as Phaser from 'phaser'
import { shipSettings, settingsHelpers, gameSettings, turretSettings, ITurretPositions } from './consts'
import { minerals, bases, asteroids, aliens, globalFireParticleManager, harvesters, turrets } from './game-init'
import { Mineral } from './mineral'
import { Asteroid } from './asteroid'
import { Base } from './base'
import { edgeCollideSetPosition, outOfBounds } from './wrappable'
import { Bullet } from './bullet'
import { updateState } from './update'
import { Harvester } from './harvester'
import { Turret } from './turret'

export const players: Player[] = []

function playerCollectMineral(
  playerObj: Phaser.GameObjects.GameObject,
  mineralObj: Phaser.GameObjects.GameObject
): boolean {
  const mineral = mineralObj as Mineral
  const player = playerObj as Player

  player.scoreUpdate(mineral.value, true)
  mineral.done()

  return false
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
    base.hitByPlayer()
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

    this.fireParticleManager = scene.add.particles(`fire1`)

    // Get a random list of turret positions to give as bonuses
    this.bonusTurretPositions = Phaser.Math.RND.shuffle(turretSettings.positions)
  }

  bonusTurretPositions: ITurretPositions[]
  harvester: Harvester | undefined
  base: Base | undefined
  turrets: Turret[] = []
  level = 0

  spawnParticleManager: Phaser.GameObjects.Particles.ParticleEmitterManager
  fireParticleManager: Phaser.GameObjects.Particles.ParticleEmitterManager

  scoreText!: Phaser.GameObjects.Text
  shipsText!: Phaser.GameObjects.Text
  energyRect!: Phaser.GameObjects.Rectangle

  score = 0
  energy = gameSettings.playerStartingEnergy
  ships = gameSettings.playerStartingShips
  pointsUntilNextBonus = 0

  lastFired = 0

  baseX: number = 0
  baseY: number = 0

  diedTime: number
  dead = true
  isAI = false

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
    this.shipsText = this.scene.add.text(this.baseX - 33, this.baseY + 20, '', {
      color: 'yellow'
    })
    this.shipsUpate(0) // Just to update UI
    this.energyRect = this.scene.add.rectangle(
      this.baseX + 11,
      this.baseY + 27,
      gameSettings.energyBarWidth,
      gameSettings.energyBarHeight,
      0 // Doesn't let me change color later if I dont' specify something here
    )
    this.energyUpdate(0) // Just to update UI
  }

  giveBonus() {
    // Bonus sets the base back to full energy
    this.energy = gameSettings.playerStartingEnergy
    this.energyUpdate(0) // Just to update the UI
    this.shipsUpate(1)

    this.level++

    if (this.level === 3) {
      this.harvester = harvesters.get(this.baseX, this.baseY, this.number.toString())
    } else {
      const turretPosition = this.bonusTurretPositions.pop()

      if (turretPosition) {
        const turret = turrets.get(
          this.baseX + turretPosition.x,
          this.baseY + turretPosition.y,
          this.number.toString()
        ) as Turret
        turret.setRangeOfMotion(turretPosition.startingAngle)
        this.turrets.push(turret)
      }
    }
  }

  shipsUpate(change: number) {
    this.ships += change
    this.shipsText.text = `${this.ships < 10 ? '0' : ''}${this.ships}`
  }

  energyUpdate(change: number) {
    this.energy += change
    this.energyRect.fillColor = this.energy <= 25 ? 0xff0000 : this.energy <= 50 ? 0xffd800 : 0x00ff00
    this.energyRect.width = gameSettings.energyBarWidth * (this.energy / gameSettings.playerStartingEnergy)

    // TODO: Should you lose upgrades as you take damage?
    // if (this.energy <= 50 && this.harvester) {
    //   this.harvester.destroyed()
    //   this.harvester = undefined
    // }
  }

  scoreUpdate(points: number, showFloatText?: boolean, playerDied?: boolean) {
    this.score += points

    this.pointsUntilNextBonus += points
    if (this.pointsUntilNextBonus >= gameSettings.pointsForBonus) {
      this.giveBonus()
      this.pointsUntilNextBonus -= gameSettings.pointsForBonus
    }

    this.scoreText.text = this.score.toString()

    if (showFloatText) {
      const pointText = this.scene.add.text(this.x, this.y, points.toString(), {
        color: points > 0 ? '#4F4' : '#F44',
        fontSize:
          points < 0 ? '18px' : points <= 250 ? '14px' : points <= 500 ? '16px' : points <= 1000 ? '18px' : '20px',
        fontStyle: 'bold',
        fontFamily: 'Verdana'
      })
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
  }

  /**
   * Call when a player is out of energy and its game over
   * @param playerDied Did this happen during a player death? Need to know so we don't replay the death effects
   */
  destroyed() {
    this.base?.done()
    this.harvester?.destroyed()

    this.turrets.forEach(t => {
      t.done()
    })
    this.turrets = []

    this.base = undefined
    this.scoreText.destroy()
    this.shipsText.destroy()
    this.energyRect.destroy()
    this.spawnParticleManager.destroy()
    this.fireParticleManager.destroy()

    // If they haven't just died, then kill them
    if (!this.dead) {
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

    if (this.harvester?.dead) {
      this.harvester.update(time, delta)
    }
  }

  objectCloseEnoughForAI(obj: Phaser.GameObjects.GameObject) {
    const sprite = obj as Phaser.GameObjects.Sprite

    return (
      (this.number === 0 && sprite.x <= gameSettings.screenWidth / 2) ||
      (this.number === 1 && sprite.x >= gameSettings.screenWidth / 2)
    )
  }

  aiMove(time: number, delta: number) {
    const allTargets = [
      ...aliens.children.getArray().filter(a => a.active),
      ...asteroids.children.getArray().filter(a => a.active),
      ...minerals.children.getArray().filter(a => a.active),
      ...harvesters.children.getArray().filter(a => a.active && (a as Harvester).playerNumber !== this.number),
      ...players.filter(a => a.active && (a as Player).number !== this.number)
    ]

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
      target = this.base!
    }

    let turnAmount: number
    let angle: number

    // If AI is nearing another base, turn around and don't crash into it
    // This overrides any target
    const otherPlayer = players.find(p => p.number === (this.number === 0 ? 1 : 0))
    if (otherPlayer && Phaser.Math.Distance.Between(this.x, this.y, otherPlayer.baseX, otherPlayer.baseY) < 250) {
      const angleToBase = Phaser.Math.Angle.Between(this.x, this.y, otherPlayer.baseX, otherPlayer.baseY)
      angle = Phaser.Math.Angle.Reverse(angleToBase)
      turnAmount = 0.04
    } else {
      // As the AI nears its target, we allow it to turn a bit more or it may fly by
      turnAmount = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y) < 200 ? 0.06 : 0.04

      angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y)
    }

    const newAngle = Phaser.Math.Angle.RotateTo(Phaser.Math.DegToRad(this.angle), angle, turnAmount)
    this.setAngle(Phaser.Math.RadToDeg(newAngle))

    // Normal speed for AI is a little slower or they are too chaotic.
    const speedRatio = 0.25

    // Slow the AI down a tad, not full throttle
    const unitVelocity = this.scene.physics.velocityFromRotation(this.rotation, speedRatio)
    this.setVelocity(
      this.body.velocity.x + unitVelocity.x * shipSettings.acceleration,
      this.body.velocity.y + unitVelocity.y * shipSettings.acceleration
    )
    this.thrustEffect()
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
    this.shipsUpate(-1)
    this.deathEffects()
  }

  /** Play the death explosion, reset the player, and update some death settings/timers */
  deathEffects() {
    globalFireParticleManager.createEmitter({
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
