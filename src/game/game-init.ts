import * as Phaser from 'phaser'
import { Bullet } from './bullet'
import { update } from './update'
import { Mineral } from './mineral'
import { settingsHelpers, gameSettings } from './consts'
import { Asteroid, asteroidHitByBullet } from './asteroid'
import { players, playerCrashIntoRock, playerHitByBullet, playerCrashIntoBase } from './player'
import { Base, baseHitByBullet, baseHitByRock, baseCollectMineral } from './base'
import {
  alienCrashIntoRock,
  alienHitByBullet,
  Alien,
  alienCollectMineral,
  alienCrashIntoBase,
  alienCrashIntoPlayer
} from './alien'
import {
  Harvester,
  harvesterCrashIntoRock,
  harvesterCrashIntoBase,
  harvesterHitByBullet,
  harvesterCollectMineral
} from './harvester'
import { Turret } from './turret'
import { Boss, bossHitByBullet, bossCrashIntoPlayer } from './boss'

export let bulletGroups: Phaser.Physics.Arcade.Group[] = []
export let minerals: Phaser.Physics.Arcade.Group
export let asteroids: Phaser.Physics.Arcade.Group
export let aliens: Phaser.Physics.Arcade.Group
export let harvesters: Phaser.Physics.Arcade.Group
export let bases: Phaser.Physics.Arcade.StaticGroup
export let bosses: Phaser.Physics.Arcade.StaticGroup
export let turrets: Phaser.Physics.Arcade.StaticGroup

export let globalFireParticleManager: Phaser.GameObjects.Particles.ParticleEmitterManager
export let globalRubbleParticleManager: Phaser.GameObjects.Particles.ParticleEmitterManager

export const controls: {
  cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  key1?: Phaser.Input.Keyboard.Key
  key2?: Phaser.Input.Keyboard.Key
  key3?: Phaser.Input.Keyboard.Key
  key4?: Phaser.Input.Keyboard.Key
} = {}

export let titleScreen: Phaser.GameObjects.Image

/** Load all the images we need and assign them names */
function preload(this: Phaser.Scene) {
  this.load.image('background', 'images/background.jpg')
  this.load.image('title', 'images/title-screen.png')
  this.load.image('ship0', 'images/ship0.png')
  this.load.image('ship1', 'images/ship1.png')
  this.load.image('ship2', 'images/ship2.png')
  this.load.image('ship3', 'images/ship3.png')
  this.load.image('bullet0', 'images/bullet0.png')
  this.load.image('bullet1', 'images/bullet1.png')
  this.load.image('bullet2', 'images/bullet2.png')
  this.load.image('bullet3', 'images/bullet3.png')
  this.load.image('bullet4', 'images/bullet4.png')
  this.load.spritesheet('mineral', 'images/mineral-sprite.png', { frameWidth: 16, frameHeight: 16 })
  this.load.spritesheet('asteroid', 'images/asteroid-sprite.png', { frameWidth: 64, frameHeight: 64 })
  this.load.spritesheet('harvester', 'images/harvester-sprite.png', { frameWidth: 24, frameHeight: 24 })
  this.load.image('base', 'images/base.png')
  this.load.image('fire1', 'images/fire1.png')
  this.load.image('rubble', 'images/rubble.png')
  this.load.image('turret', 'images/turret.png')
  this.load.spritesheet('alien', 'images/alien.png', { frameWidth: 32, frameHeight: 32 })
  this.load.spritesheet('boss', 'images/boss.png', { frameWidth: 128, frameHeight: 128 })
}

/** Create all the physics groups we need and setup colliders between the ones we want to interact. */
function create(this: Phaser.Scene) {
  // Create some keyboard controls
  controls.cursors = this.input.keyboard.createCursorKeys()
  controls.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE)
  controls.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO)
  controls.key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE)
  controls.key4 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR)

  this.add.image(settingsHelpers.screenWidthMid, settingsHelpers.screenHeightMid, 'background')
  titleScreen = this.add.image(settingsHelpers.screenWidthMid, settingsHelpers.screenHeightMid, 'title')

  // Global particle managers
  // Need these for particles that will exist after something is destroyed
  globalFireParticleManager = this.add.particles(`fire1`)
  globalRubbleParticleManager = this.add.particles(`rubble`)

  // We create 5 bullet groups.
  // 0-3 are for actual human players
  // 4 is a group for all AI bullets.
  // This makes for a few extra collision setup calls, but the overhead is minimal
  // and it allows each player to have their own bullet group.
  for (let b = 0; b < 5; b++) {
    bulletGroups.push(
      this.physics.add.group({
        classType: Bullet,
        maxSize: 50,
        runChildUpdate: true
      })
    )
  }

  minerals = this.physics.add.group({
    classType: Mineral,
    maxSize: 75,
    runChildUpdate: true
  })

  asteroids = this.physics.add.group({
    classType: Asteroid,
    maxSize: 10,
    runChildUpdate: true
  })

  bases = this.physics.add.staticGroup({
    classType: Base,
    maxSize: 4,
    runChildUpdate: true
  })

  turrets = this.physics.add.staticGroup({
    classType: Turret,
    maxSize: 10,
    runChildUpdate: true
  })

  aliens = this.physics.add.group({
    classType: Alien,
    maxSize: 2,
    runChildUpdate: true
  })

  bosses = this.physics.add.staticGroup({
    classType: Boss,
    maxSize: 1,
    runChildUpdate: true
  })

  harvesters = this.physics.add.group({
    classType: Harvester,
    maxSize: 12,
    runChildUpdate: true
  })

  this.physics.world.setBounds(
    -gameSettings.worldBoundEdgeSize,
    -gameSettings.worldBoundEdgeSize,
    settingsHelpers.worldBoundWidth,
    settingsHelpers.worldBoundHeight
  )
  this.physics.world.setBoundsCollision(true, true, true, true)

  this.physics.world.on('worldbounds', function(body: any) {
    if (body.gameObject.edgeCollide) {
      body.gameObject.edgeCollide()
    }
  })

  this.physics.add.collider(asteroids, bulletGroups[0], asteroidHitByBullet)
  this.physics.add.collider(asteroids, bulletGroups[1], asteroidHitByBullet)
  this.physics.add.collider(asteroids, bulletGroups[2], asteroidHitByBullet)
  this.physics.add.collider(asteroids, bulletGroups[3], asteroidHitByBullet)
  this.physics.add.collider(asteroids, bulletGroups[4], asteroidHitByBullet)

  this.physics.add.collider(players, asteroids, playerCrashIntoRock)
  this.physics.add.collider(harvesters, asteroids, undefined, harvesterCrashIntoRock)

  this.physics.add.collider(players, bases, undefined, playerCrashIntoBase)
  this.physics.add.collider(harvesters, bases, undefined, harvesterCrashIntoBase)

  this.physics.add.collider(players, bulletGroups[0], undefined, playerHitByBullet)
  this.physics.add.collider(players, bulletGroups[1], undefined, playerHitByBullet)
  this.physics.add.collider(players, bulletGroups[2], undefined, playerHitByBullet)
  this.physics.add.collider(players, bulletGroups[3], undefined, playerHitByBullet)
  this.physics.add.collider(players, bulletGroups[4], undefined, playerHitByBullet)

  this.physics.add.collider(harvesters, bulletGroups[0], undefined, harvesterHitByBullet)
  this.physics.add.collider(harvesters, bulletGroups[1], undefined, harvesterHitByBullet)
  this.physics.add.collider(harvesters, bulletGroups[2], undefined, harvesterHitByBullet)
  this.physics.add.collider(harvesters, bulletGroups[3], undefined, harvesterHitByBullet)
  this.physics.add.collider(harvesters, bulletGroups[4], undefined, harvesterHitByBullet)
  this.physics.add.collider(harvesters, minerals, undefined, harvesterCollectMineral)

  this.physics.add.collider(bases, bulletGroups[0], undefined, baseHitByBullet)
  this.physics.add.collider(bases, bulletGroups[1], undefined, baseHitByBullet)
  this.physics.add.collider(bases, bulletGroups[2], undefined, baseHitByBullet)
  this.physics.add.collider(bases, bulletGroups[3], undefined, baseHitByBullet)
  this.physics.add.collider(bases, bulletGroups[4], undefined, baseHitByBullet)
  this.physics.add.collider(bases, asteroids, baseHitByRock)
  this.physics.add.collider(bases, minerals, baseCollectMineral)

  this.physics.add.collider(aliens, asteroids, undefined, alienCrashIntoRock)
  this.physics.add.collider(aliens, bulletGroups[0], undefined, alienHitByBullet)
  this.physics.add.collider(aliens, bulletGroups[1], undefined, alienHitByBullet)
  this.physics.add.collider(aliens, bulletGroups[2], undefined, alienHitByBullet)
  this.physics.add.collider(aliens, bulletGroups[3], undefined, alienHitByBullet)
  this.physics.add.collider(aliens, minerals, undefined, alienCollectMineral)
  this.physics.add.collider(aliens, bases, alienCrashIntoBase)
  this.physics.add.collider(aliens, players, undefined, alienCrashIntoPlayer)

  this.physics.add.collider(bosses, bulletGroups[0], undefined, bossHitByBullet)
  this.physics.add.collider(bosses, bulletGroups[1], undefined, bossHitByBullet)
  this.physics.add.collider(bosses, bulletGroups[2], undefined, bossHitByBullet)
  this.physics.add.collider(bosses, bulletGroups[3], undefined, bossHitByBullet)
  this.physics.add.collider(bosses, players, undefined, bossCrashIntoPlayer)
}

export const startGame = () => {
  new Phaser.Game({
    type: Phaser.AUTO,
    width: gameSettings.screenWidth,
    height: gameSettings.screenHeight,
    scale: {
      mode: Phaser.Scale.ScaleModes.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
      default: 'arcade',
      arcade: {
        debug: false
      }
    },
    scene: {
      preload: preload,
      create: create,
      update: update
    },
    input: {
      gamepad: true
    },
    parent: 'root'
  })
}
