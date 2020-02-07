import { bulletGroups, aliens, controls } from './game-init'
import { shipSettings, gameSettings } from './consts'
import { players, Player } from './player'
import { Bullet } from './bullet'
import { Alien, alienData } from './alien'

const stickSensitivity = 0.3

export const updateState = {
  nextJoinTime: 0
}

let ai0On = false
let ai1On = false

export function update(this: Phaser.Scene, time: number, delta: number) {
  // Set the time for the 1st alien spawn
  if (!alienData.nextAlienSpawn) {
    alienData.nextAlienSpawn =
      this.time.now + Phaser.Math.RND.integerInRange(gameSettings.alienSpawnMinTime, gameSettings.alientSpawnMaxTime)
  }

  // Check if the alien needs to be respawned
  if (alienData.nextAlienSpawn <= this.time.now) {
    alienData.nextAlienSpawn =
      this.time.now + Phaser.Math.RND.integerInRange(gameSettings.alienSpawnMinTime, gameSettings.alientSpawnMaxTime)
    const alien = aliens.get() as Alien

    if (alien) {
      alien.spawn()
    }
  }

  // Grab the global cursor controls
  const cursors = controls.cursors!

  let newPlayer: Player

  // Spacebar will add player 0
  if (cursors.space?.isDown && !players.some(p => p.number === 0) && time >= updateState.nextJoinTime) {
    newPlayer = new Player(this, `Player-0`, 0)
    players.push(newPlayer)
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
      }
    }
  })

  const key2 = controls.key2!
  const key1 = controls.key1!

  // Add AI players
  if (time >= updateState.nextJoinTime && (key1?.isDown || ai0On) && !players.some(p => p.number === 0)) {
    newPlayer = new Player(this, `Player-${0}`, 0)
    newPlayer.isAI = true
    players.push(newPlayer)
    ai0On = true
  }

  if (time >= updateState.nextJoinTime && (key2?.isDown || ai1On) && !players.some(p => p.number === 1)) {
    newPlayer = new Player(this, `Player-${1}`, 1)
    newPlayer.isAI = true
    players.push(newPlayer)
    ai1On = true
  }

  players.forEach(player => {
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
      player.setVelocity(
        player.body.velocity.x + unitVelocity.x * shipSettings.acceleration,
        player.body.velocity.y + unitVelocity.y * shipSettings.acceleration
      )
      player.thrustEffect()
    }

    const fireButtonPressed =
      this.input.gamepad?.gamepads[player.number]?.buttons.some(b => b.pressed && b.index !== 6 && b.index !== 7) ||
      player.isAI // TODO: Need to move the fire timer and AI check out of here

    if (((player.number === 0 && cursors.space?.isDown) || fireButtonPressed) && this.time.now > player.lastFired) {
      var bullet = bulletGroups[player.number].get(undefined, undefined, player.number.toString()) as Bullet

      if (bullet) {
        bullet.fire(player)

        player.lastFired = this.time.now + shipSettings.fireRate
      }
    }
  })
}
