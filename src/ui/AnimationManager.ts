import Phaser from 'phaser';

export class AnimationManager {
  constructor(private readonly scene: Phaser.Scene) {}

  // ── Hit explosion — multi-burst with glow ───────────────────────────
  playExplosion(worldX: number, worldY: number): void {
    // Core burst
    const burst = this.scene.add.particles(worldX, worldY, 'particle-exp', {
      speed: { min: 80, max: 280 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.4, end: 0 },
      lifespan: 700,
      quantity: 28,
      tint: [0xff3300, 0xff8800, 0xffdd00],
    });

    // Secondary glow emitter slightly delayed
    this.scene.time.delayedCall(80, () => {
      const glow = this.scene.add.particles(worldX, worldY, 'particle-exp', {
        speed: { min: 20, max: 90 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.9, end: 0 },
        lifespan: 500,
        quantity: 14,
        tint: [0xffffff, 0xffee88],
      });
      this.scene.time.delayedCall(550, () => glow.destroy());
    });

    this.scene.time.delayedCall(750, () => burst.destroy());
  }

  // ── Shield deflect for miss — angular spark starburst, no rings ─────
  playShieldDeflect(worldX: number, worldY: number): void {
    // Spark burst scattering outward in all directions
    const sparks = this.scene.add.particles(worldX, worldY, 'particle-water', {
      speed: { min: 60, max: 160 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.7, end: 0 },
      lifespan: 420,
      quantity: 10,
      tint: 0x44ccff,
    });
    this.scene.time.delayedCall(470, () => sparks.destroy());

    // Angular energy streaks radiating from the impact point
    const streakCount = 7;
    for (let i = 0; i < streakCount; i++) {
      const angle = (Math.PI * 2 * i) / streakCount + Math.random() * 0.3;
      const len = 20 + Math.random() * 12;
      const x2 = worldX + Math.cos(angle) * len;
      const y2 = worldY + Math.sin(angle) * len;
      const streak = this.scene.add.line(0, 0, worldX, worldY, x2, y2, 0x66ddff, 0.9)
        .setLineWidth(2)
        .setOrigin(0, 0);
      this.scene.tweens.add({
        targets: streak,
        alpha: 0,
        duration: 240,
        ease: 'Cubic.easeOut',
        onComplete: () => streak.destroy(),
      });
    }

    // Bright impact flash — quick pop, no expanding ring
    const flash = this.scene.add.circle(worldX, worldY, 6, 0xffffff, 0.9);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2.2,
      scaleY: 2.2,
      duration: 160,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy(),
    });
  }

  // ── Sunk ship effect — big shockwave rings + debris ─────────────────
  playSunkEffect(worldX: number, worldY: number): void {
    // Shockwave rings
    const ringColors = [0xff2200, 0xff8800, 0xffff44];
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 80, () => {
        const ring = this.scene.add.circle(worldX, worldY, 10, 0x000000, 0);
        ring.setStrokeStyle(3 - i, ringColors[i], 0.85 - i * 0.2);
        this.scene.tweens.add({
          targets: ring,
          scaleX: 10 + i * 3,
          scaleY: 10 + i * 3,
          alpha: 0,
          duration: 700 - i * 60,
          ease: 'Power2',
          onComplete: () => ring.destroy(),
        });
      });
    }

    // Inner flash
    const flash = this.scene.add.circle(worldX, worldY, 18, 0xffffff, 0.9);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 3,
      scaleY: 3,
      duration: 220,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy(),
    });

    // Debris particles
    const debris = this.scene.add.particles(worldX, worldY, 'particle-exp', {
      speed: { min: 60, max: 180 },
      angle: { min: 200, max: 340 },
      scale: { start: 0.8, end: 0 },
      lifespan: 900,
      quantity: 20,
      gravityY: 120,
      tint: [0xff4400, 0xff9900, 0xaaaaaa],
    });
    this.scene.time.delayedCall(950, () => debris.destroy());
  }

  // ── Full-screen flash (hit feedback) ────────────────────────────────
  playHitFlash(color: number = 0xff4400, alpha: number = 0.18): void {
    const { width, height } = this.scene.scale;
    const flash = this.scene.add.rectangle(width / 2, height / 2, width, height, color, alpha)
      .setDepth(50);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 280,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy(),
    });
  }

  // ── Floating banner with pop-in animation ───────────────────────────
  showFloatingBanner(x: number, y: number, text: string, color: string = '#ffcc00'): void {
    // Background pill
    const bg = this.scene.add.rectangle(x, y, 1, 60, 0x000000, 0.72)
      .setDepth(48);

    const banner = this.scene.add.text(x, y, text, {
      fontFamily: 'monospace',
      fontSize: '34px',
      color,
      stroke: '#000011',
      strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0).setScale(0.5).setDepth(49);

    // Expand bg to text width
    bg.setSize(banner.width + 48, 64);

    this.scene.tweens.add({
      targets: [banner, bg],
      alpha: { from: 0, to: 1 },
      scaleX: 1,
      scaleY: 1,
      duration: 240,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: [banner, bg],
          alpha: 0,
          y: y - 40,
          duration: 800,
          delay: 600,
          ease: 'Cubic.easeIn',
          onComplete: () => { banner.destroy(); bg.destroy(); },
        });
      },
    });
  }

  // ── Turn label slide-in animation ────────────────────────────────────
  animateTurnLabel(text: Phaser.GameObjects.Text): void {
    const targetX = text.x;
    text.setX(targetX + 120).setAlpha(0);
    this.scene.tweens.add({
      targets: text,
      x: targetX,
      alpha: 1,
      duration: 280,
      ease: 'Back.easeOut',
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
