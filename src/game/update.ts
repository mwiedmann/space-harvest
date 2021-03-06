import { bulletGroups, aliens, controls, minerals, asteroids, titleScreen, bosses } from './game-init'
import { shipSettings, gameSettings } from './consts'
import { players, Player } from './player'
import { Bullet } from './bullet'
import { Alien, alienData } from './alien'
import { Asteroid } from './asteroid'
import { Boss } from './boss'

const stickSensitivity = 0.3

export const updateState = {
  nextJoinTime: 0
}

let ai0On = false
let ai1On = false
let ai2On = false
let ai3On = false
let gameStarted = false

export type IBossState = 'dormant' | 'entering' | 'set' | 'destroyed'
interface IWaveData {
  waveNumber: number
  bossState: IBossState
  bossPhaseTime: number
  alienCount: number
}

export let waveData: IWaveData = {
  waveNumber: 0,
  bossState: 'dormant',
  bossPhaseTime: 0,
  alienCount: 0
}

const startGame = (scene: Phaser.Scene) => {
  titleScreen.destroy()

  gameStarted = true
}

export function update(this: Phaser.Scene, time: number, delta: number) {
  // Grab the global cursor controls
  const cursors = controls.cursors!

  let newPlayer: Player

  // Spacebar will add player 0
  if (cursors.space?.isDown && !players.some(p => p.number === 0) && time >= updateState.nextJoinTime) {
    newPlayer = new Player(this, `Player-0`, 0)
    players.push(newPlayer)
    startGame(this)
  }

  // Check for gamepad players joining the game
  this.input.gamepad?.gamepads.forEach((gp, i) => {
    // Only allow 2 players for now.
    // Need to figure out some real-estate issues with 3-4 players
    if (i > 1) {
      return
    }
    if (gp.buttons.some(b => b.pressed)) {
      if (!players.some(p => p.number === i) && time >= updateState.nextJoinTime) {
        newPlayer = new Player(this, `Player-${i}`, i)
        players.push(newPlayer)
        startGame(this)
      }
    }
  })

  const key4 = controls.key4!
  const key3 = controls.key3!
  const key2 = controls.key2!
  const key1 = controls.key1!

  // Add AI players
  // TODO: These 4 sections are so similar they need to be refactored
  if (time >= updateState.nextJoinTime && (key1?.isDown || ai0On) && !players.some(p => p.number === 0)) {
    newPlayer = new Player(this, `Player-${0}`, 0)
    newPlayer.isAI = true
    players.push(newPlayer)
    ai0On = true
    startGame(this)
  }

  if (time >= updateState.nextJoinTime && (key2?.isDown || ai1On) && !players.some(p => p.number === 1)) {
    newPlayer = new Player(this, `Player-${1}`, 1)
    newPlayer.isAI = true
    players.push(newPlayer)
    ai1On = true
    startGame(this)
  }

  if (time >= updateState.nextJoinTime && (key3?.isDown || ai2On) && !players.some(p => p.number === 2)) {
    newPlayer = new Player(this, `Player-${2}`, 2)
    newPlayer.isAI = true
    players.push(newPlayer)
    ai2On = true
    startGame(this)
  }

  if (time >= updateState.nextJoinTime && (key4?.isDown || ai3On) && !players.some(p => p.number === 3)) {
    newPlayer = new Player(this, `Player-${3}`, 3)
    newPlayer.isAI = true
    players.push(newPlayer)
    ai3On = true
    startGame(this)
  }

  // Everything after this is checking for wave events, player actions, and spawning new objects.
  // Skip it if the game hasn't started yet.
  if (!gameStarted) {
    return
  }

  // If the boss is dormant, check if we need to advance to the next wave
  if (
    waveData.bossState === 'dormant' &&
    asteroids.countActive() === 0 &&
    minerals.countActive() === 0 &&
    aliens.countActive() === 0
  ) {
    // Go to the next wave
    waveData.waveNumber++

    // Every 5 waves, we have a boss level
    if (waveData.waveNumber % 5 === 0) {
      waveData.bossPhaseTime = time
      waveData.bossState = 'entering'
      let boss = bosses.get() as Boss
      boss.spawn()
    } else {
      // This is a standard wave
      // Reset the alien count and spawn asteroids
      waveData.alienCount = 0
      for (let i = 0; i < gameSettings.asteroidCount; i++) {
        let rock = asteroids.get() as Asteroid

        if (rock) {
          rock.spawn()
        }
      }
    }
  }

  // Check boss status
  if (waveData.bossState === 'entering' && time - waveData.bossPhaseTime >= 5000) {
    waveData.bossState = 'set'
  } else if (waveData.bossState === 'destroyed' && time - waveData.bossPhaseTime >= 5000) {
    waveData.bossState = 'dormant'
  }

  // Set the time for the 1st alien spawn
  if (!alienData.nextAlienSpawn) {
    alienData.nextAlienSpawn =
      this.time.now + Phaser.Math.RND.integerInRange(gameSettings.alienSpawnMinTime, gameSettings.alientSpawnMaxTime)
  }

  // Check if the alien needs to be respawned
  if (alienData.nextAlienSpawn <= this.time.now) {
    alienData.nextAlienSpawn =
      this.time.now + Phaser.Math.RND.integerInRange(gameSettings.alienSpawnMinTime, gameSettings.alientSpawnMaxTime)

    // Don't spawn aliens during a boss phase
    if (waveData.bossState !== 'dormant' || waveData.alienCount >= gameSettings.aliensPerWave) {
      return
    }

    const alien = aliens.get() as Alien

    if (alien) {
      waveData.alienCount++
      alien.spawn()
    }
  }

  // Loop through the players and check their controls
  players.forEach((player: Player) => {
    player.update(time, delta)

    // Destroy the player's base if they run out of energy
    if (player.energy <= 0 || player.ships <= 0) {
      player.destroyed()
    }

    // Don't control dead players
    if (player.dead) {
      return
    }

    // Beginning of some basic AI.
    // He just flies in a circle for now.
    if (player.isAI) {
      player.aiMove(time, delta)
    }

    const horizStick = this.input.gamepad?.gamepads[player.number]?.leftStick.x
    const vertStick = this.input.gamepad?.gamepads[player.number]?.leftStick.y

    if (Math.abs(horizStick) > stickSensitivity) {
      player.setAngularVelocity(shipSettings.angularVelocity * horizStick)
    }

    if ((player.number === 0 && cursors.left?.isDown) || this.input.gamepad?.gamepads[player.number]?.left) {
      player.setAngularVelocity(-shipSettings.angularVelocity * shipSettings.keyboardTurnRate)
    }

    if ((player.number === 0 && cursors.right?.isDown) || this.input.gamepad?.gamepads[player.number]?.right) {
      player.setAngularVelocity(+shipSettings.angularVelocity * shipSettings.keyboardTurnRate)
    }

    const thrustButtonPressed = this.input.gamepad?.gamepads[player.number]?.buttons.some(
      b => b.pressed && (b.index === 6 || b.index === 7)
    )

    // Do we want up/down to thrust as well?
    // Math.abs(vertStick) > stickSensitivity

    if ((player.number === 0 && cursors.up?.isDown) || thrustButtonPressed) {
      const amount =
        Math.abs(vertStick) > stickSensitivity
          ? Math.abs(vertStick)
          : (player.number === 0 && cursors.up?.isDown) || thrustButtonPressed
          ? 0.5
          : 0
      const unitVelocity = this.physics.velocityFromRotation(player.rotation, amount)
      player.setAcceleration(unitVelocity.x * shipSettings.acceleration, unitVelocity.y * shipSettings.acceleration)
      player.thrustEffect()
    } else {
      player.setAcceleration(0, 0)
    }

    const fireButtonPressed =
      this.input.gamepad?.gamepads[player.number]?.buttons.some(b => b.pressed && b.index !== 6 && b.index !== 7) ||
      player.isAI // TODO: Need to move the fire timer and AI check out of here

    if (((player.number === 0 && cursors.space?.isDown) || fireButtonPressed) && this.time.now > player.lastFired) {
      var bullet = bulletGroups[player.number].get(undefined, undefined, player.number.toString()) as Bullet

      if (bullet) {
        bullet.fire(player.x, player.y, player.rotation, shipSettings.bulletLifetime)

        player.lastFired = this.time.now + shipSettings.fireRate
      }
    }
  })
}
