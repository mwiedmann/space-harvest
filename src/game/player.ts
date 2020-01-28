import * as Phaser from 'phaser'
import { shipSettings, settingsHelpers } from './consts'
import { goldNuggets, bases } from './game-init'
import { Gold } from './gold'
import { RockGold } from './rock-gold'
import { Base } from './base'
import { edgeCollideSetPosition, outOfBounds } from './wrappable'
import { Bullet } from './bullet'

export const players: Player[] = []

function collectGold(playerObj: Phaser.GameObjects.GameObject, goldObj: Phaser.GameObjects.GameObject): void {
  const gold = goldObj as Gold
  const player = playerObj as Player

  player.score += gold.value

  gold.done()
}

export function crashIntoRock(playerObj: Phaser.GameObjects.GameObject, rockObj: Phaser.GameObjects.GameObject): void {
  const rock = rockObj as RockGold
  const player = playerObj as Player

  rock.breakApart()
  player.died()
}

export function hitBuyBullet(playerObj: Phaser.GameObjects.GameObject, bulletObj: Phaser.GameObjects.GameObject): void {
  const bullet = bulletObj as Bullet
  const player = playerObj as Player

  if (bullet.playerNumber !== player.number) {
    bullet.done()
    player.died()
  }
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, public name: string, public number: number) {
    super(scene, 0, 0, `ship${number}`)

    const baseLocation = settingsHelpers.playerStartingLocations[number]
    this.baseX = baseLocation.x
    this.baseY = baseLocation.y
    const base = bases.get() as Base
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
    scene.physics.add.overlap(this, goldNuggets, collectGold, undefined, scene)

    // Player starts "dead" and can't move/fire for a few moments
    this.diedTime = this.scene.time.now - (shipSettings.deadTime - 1000)

    this.fireParticleManager = this.scene.add.particles(`fire1`)
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

  fireParticleManager: Phaser.GameObjects.Particles.ParticleEmitterManager
  spawnParticleManager: Phaser.GameObjects.Particles.ParticleEmitterManager

  score = 0
  lastFired = 0

  baseX: number
  baseY: number

  diedTime: number
  dead = true

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
