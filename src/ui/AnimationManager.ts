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
    const ring = this.scene.add.circle(worldX, worldY, 10, 0xff4444, 0.8);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 6, scaleY: 6,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => ring.destroy(),
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
