import * as Phaser from 'phaser'
import { bases } from './game-init'

export class Base extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'base')
  }

  spawn(x: number, y: number) {
    this.setActive(true)
    this.setVisible(true)
    this.body.reset(x, y)
  }

  done() {
    // this.setActive(false)
    // this.setVisible(false)
    // this.body.stop()
    bases.remove(this, true)
  }
}
