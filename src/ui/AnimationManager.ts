import Phaser from 'phaser';

export class AnimationManager {
  constructor(private readonly scene: Phaser.Scene) {}

  playExplosion(worldX: number, worldY: number): void {
    const emitter = this.scene.add.particles(worldX, worldY, 'particle-exp', {
      speed: { min: 60, max: 220 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      lifespan: 600,
      quantity: 18,
      tint: [0xff4444, 0xff8800, 0xffff00],
    });
    this.scene.time.delayedCall(700, () => emitter.destroy());
  }

  playWaterSplash(worldX: number, worldY: number): void {
    const emitter = this.scene.add.particles(worldX, worldY, 'particle-water', {
      speed: { min: 30, max: 110 },
      angle: { min: 230, max: 310 },
      scale: { start: 0.9, end: 0 },
      lifespan: 450,
      quantity: 10,
      tint: 0x00aaff,
    });
    this.scene.time.delayedCall(500, () => emitter.destroy());
  }

  playSunkEffect(worldX: number, worldY: number): void {
    const ring = this.scene.add.circle(worldX, worldY, 12, 0xff2200, 0.85);
    const ring2 = this.scene.add.circle(worldX, worldY, 6, 0xffff66, 0.7);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 8,
      scaleY: 8,
      alpha: 0,
      duration: 650,
      ease: 'Power2',
      onComplete: () => ring.destroy(),
    });
    this.scene.tweens.add({
      targets: ring2,
      scaleX: 12,
      scaleY: 12,
      alpha: 0,
      duration: 500,
      ease: 'Cubic.easeOut',
      onComplete: () => ring2.destroy(),
    });
  }

  showFloatingBanner(x: number, y: number, text: string): void {
    const banner = this.scene.add.text(x, y, text, {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffcc00',
      stroke: '#440000',
      strokeThickness: 5,
    }).setOrigin(0.5).setAlpha(0).setScale(0.6);

    this.scene.tweens.add({
      targets: banner,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 220,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: banner,
          alpha: 0,
          y: y - 28,
          duration: 900,
          delay: 520,
          onComplete: () => banner.destroy(),
        });
      },
    });
  }

  flashText(text: Phaser.GameObjects.Text): void {
    this.scene.tweens.add({
      targets: text,
      alpha: 0,
      duration: 300,
      yoyo: true,
      repeat: 2,
    });
  }
}
