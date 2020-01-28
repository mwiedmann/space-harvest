import { bulletGroups } from './game-init'
import { shipSettings } from './consts'
import { players, Player } from './player'
import { Bullet } from './bullet'

const stickSensitivity = 0.3

export function update(this: Phaser.Scene, time: number, delta: number) {
  const cursors = this.input.keyboard.createCursorKeys()
  let newPlayer: Player

  // Spacebar will add player 0
  if (cursors.space?.isDown && !players.some(p => p.number === 0)) {
    newPlayer = new Player(this, `Player-0`, 0)
    players.push(newPlayer)
  }

  // Check for gamepad players joining the game
  this.input.gamepad?.gamepads.forEach((gp, i) => {
    if (gp.buttons.some(b => b.pressed)) {
      if (!players.some(p => p.number === i)) {
        newPlayer = new Player(this, `Player-${i}`, i)
        players.push(newPlayer)
      }
    }
  })

  players.forEach(player => {
    player.update(time, delta)

    // Don't control dead players
    if (player.dead) {
      return
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
          ? 1
          : 0
      const unitVelocity = this.physics.velocityFromRotation(player.rotation, amount)
      player.setVelocity(
        player.body.velocity.x + unitVelocity.x * shipSettings.acceleration,
        player.body.velocity.y + unitVelocity.y * shipSettings.acceleration
      )
    }

    const fireButtonPressed = this.input.gamepad?.gamepads[player.number]?.buttons.some(
      b => b.pressed && b.index !== 6 && b.index !== 7
    )

    if (((player.number === 0 && cursors.space?.isDown) || fireButtonPressed) && this.time.now > player.lastFired) {
      var bullet = bulletGroups[player.number].get(undefined, undefined, player.number.toString()) as Bullet

      if (bullet) {
        bullet.fire(player)

        player.lastFired = this.time.now + shipSettings.fireRate
      }
    }
  })
}
