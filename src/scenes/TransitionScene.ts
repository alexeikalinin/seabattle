import Phaser from 'phaser';

/**
 * Always-active overlay scene that renders a brief fade-to-black flash
 * whenever the game phase changes. Runs in parallel with the phase
 * scenes (never stopped by BootScene's stop/start cycle) so the cut
 * between Lobby/Placement/Battle/Result reads as a cinematic dip
 * instead of an abrupt scene swap.
 */
export class TransitionScene extends Phaser.Scene {
  private veil!: Phaser.GameObjects.Rectangle;

  constructor() { super({ key: 'TransitionScene' }); }

  create(): void {
    const { width, height } = this.scale;
    this.veil = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setDepth(1000);

    this.game.events.on('phase-change', this.flash, this);
  }

  private flash(): void {
    this.veil.setAlpha(1);
    this.tweens.add({
      targets: this.veil,
      alpha: 0,
      duration: 320,
      ease: 'Cubic.easeOut',
    });
  }

  shutdown(): void {
    this.game.events.off('phase-change', this.flash, this);
  }
}
