import * as Phaser from 'phaser'
import { Bullet } from './bullet'
import { update } from './update'
import { Gold } from './gold'
import { settingsHelpers, gameSettings } from './consts'
import { RockGold, shootRock } from './rock-gold'
import { players, crashIntoRock, hitBuyBullet } from './player'
import { Base } from './base'

export let bulletGroups: Phaser.Physics.Arcade.Group[] = []
export let goldNuggets: Phaser.Physics.Arcade.Group
export let rockGoldBoulders: Phaser.Physics.Arcade.Group
export let bases: Phaser.Physics.Arcade.StaticGroup

function preload(this: Phaser.Scene) {
  this.load.image('background', 'images/background.jpg')
  this.load.image('ship0', 'images/ship0.png')
  this.load.image('ship1', 'images/ship1.png')
  this.load.image('bullet0', 'images/bullet0.png')
  this.load.image('bullet1', 'images/bullet1.png')
  this.load.image('gold', 'images/gold.png')
  this.load.image('rock-gold', 'images/rock-gold.png')
  this.load.image('base', 'images/base.png')
  this.load.image('fire1', 'images/fire1.png')
  this.load.image('rubble', 'images/rubble.png')
}

function create(this: Phaser.Scene) {
  this.add.image(settingsHelpers.screenWidthMid, settingsHelpers.screenHeightMid, 'background')

  for (let b = 0; b < 2; b++) {
    bulletGroups.push(
      this.physics.add.group({
        classType: Bullet,
        maxSize: 50,
        runChildUpdate: true
      })
    )
  }

  goldNuggets = this.physics.add.group({
    classType: Gold,
    maxSize: 75,
    runChildUpdate: true
  })

  rockGoldBoulders = this.physics.add.group({
    classType: RockGold,
    maxSize: 10,
    runChildUpdate: true
  })

  bases = this.physics.add.staticGroup({
    classType: Base,
    maxSize: 4,
    runChildUpdate: false
  })

  this.time.addEvent({
    delay: 2000,
    loop: true,
    callback: () => {
      if (goldNuggets.countActive() === 25) {
        return
      }

      let rock = rockGoldBoulders.get() as RockGold

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

  // this.physics.add.collider(goldNuggets, goldNuggets)
  // this.physics.add.collider(rockGoldBoulders, rockGoldBoulders)
  // this.physics.add.collider(goldNuggets, rockGoldBoulders)

  this.physics.add.collider(rockGoldBoulders, bulletGroups[0], shootRock)
  this.physics.add.collider(rockGoldBoulders, bulletGroups[1], shootRock)
  this.physics.add.collider(players, rockGoldBoulders, crashIntoRock)
  this.physics.add.collider(players, bulletGroups[0], hitBuyBullet)
  this.physics.add.collider(players, bulletGroups[1], hitBuyBullet)
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
