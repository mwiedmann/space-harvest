import * as Phaser from 'phaser'
import { Bullet } from './bullet'
import { update } from './update'
import { Mineral } from './mineral'
import { settingsHelpers, gameSettings } from './consts'
import { Asteroid, shootRock } from './asteroid'
import { players, playerCrashIntoRock, playerHitByBullet, playerCrashIntoBase } from './player'
import { Base, baseHitByBullet, baseHitByRock, baseCollectMineral } from './base'
import { alienCrashIntoRock, alienHitByBullet, Alien } from './alien'

export let bulletGroups: Phaser.Physics.Arcade.Group[] = []
export let minerals: Phaser.Physics.Arcade.Group
export let asteroids: Phaser.Physics.Arcade.Group
export let aliens: Phaser.Physics.Arcade.Group
export let bases: Phaser.Physics.Arcade.StaticGroup

function preload(this: Phaser.Scene) {
  this.load.image('background', 'images/background.jpg')
  this.load.image('ship0', 'images/ship0.png')
  this.load.image('ship1', 'images/ship1.png')
  this.load.image('bullet0', 'images/bullet0.png')
  this.load.image('bullet1', 'images/bullet1.png')
  this.load.image('bullet5', 'images/bullet5.png')
  this.load.spritesheet('mineral', 'images/mineral-sprite.png', { frameWidth: 16, frameHeight: 16 })
  this.load.spritesheet('asteroid', 'images/asteroid-sprite.png', { frameWidth: 64, frameHeight: 64 })
  this.load.image('base', 'images/base.png')
  this.load.image('fire1', 'images/fire1.png')
  this.load.image('rubble', 'images/rubble.png')
  this.load.image('alien', 'images/alien.png')
}

function create(this: Phaser.Scene) {
  this.add.image(settingsHelpers.screenWidthMid, settingsHelpers.screenHeightMid, 'background')

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
    runChildUpdate: false
  })

  aliens = this.physics.add.group({
    classType: Alien,
    maxSize: 2,
    runChildUpdate: true
  })

  this.time.addEvent({
    delay: 2000,
    loop: true,
    callback: () => {
      if (minerals.countActive() === 25) {
        return
      }

      let rock = asteroids.get() as Asteroid

      if (rock) {
        rock.spawn()
      }
    }
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

  this.physics.add.collider(asteroids, bulletGroups[0], shootRock)
  this.physics.add.collider(asteroids, bulletGroups[1], shootRock)
  this.physics.add.collider(players, asteroids, playerCrashIntoRock)
  this.physics.add.collider(players, bases, undefined, playerCrashIntoBase)
  this.physics.add.collider(players, bulletGroups[0], undefined, playerHitByBullet)
  this.physics.add.collider(players, bulletGroups[1], undefined, playerHitByBullet)
  this.physics.add.collider(bases, bulletGroups[0], undefined, baseHitByBullet)
  this.physics.add.collider(bases, bulletGroups[1], undefined, baseHitByBullet)
  this.physics.add.collider(bases, asteroids, baseHitByRock)
  this.physics.add.collider(bases, minerals, baseCollectMineral)
  this.physics.add.collider(aliens, asteroids, alienCrashIntoRock)
  this.physics.add.collider(aliens, bulletGroups[0], undefined, alienHitByBullet)
  this.physics.add.collider(aliens, bulletGroups[1], undefined, alienHitByBullet)
}

export const startGame = () => {
  new Phaser.Game({
    type: Phaser.AUTO,
    width: gameSettings.screenWidth,
    height: gameSettings.screenHeight,
    physics: {
      default: 'arcade',
      arcade: {
        // gravity: { y: 300 },
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
    }
  })
}
