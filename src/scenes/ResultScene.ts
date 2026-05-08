import Phaser from 'phaser';
import type { PlayerSlot } from '@/types/GameTypes';
import type { GameManager } from '@/game/GameManager';
import { ProceduralAudio } from '@/ui/ProceduralAudio';

export class ResultScene extends Phaser.Scene {
  constructor() { super({ key: 'ResultScene' }); }

  create(): void {
    const { width, height } = this.scale;
    const gameManager = this.registry.get('gameManager') as GameManager;
    const audio = this.registry.get('audio') as ProceduralAudio | undefined;
    const winner = gameManager.getWinner();

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x05080f);
    this.drawStars();

    // Play victory/defeat sound after short delay (let scene render first)
    this.time.delayedCall(200, () => audio?.playVictory());

    // Winner announcement
    const winnerSlot: PlayerSlot = winner ?? 0;
    const winnerName = winnerSlot === 0 ? 'PLAYER 1' : 'PLAYER 2';
    const winnerColor = winnerSlot === 0 ? '#00e5ff' : '#ff6eb4';

    const victoryText = this.add.text(width / 2, -100, 'VICTORY!', {
      fontFamily: 'monospace',
      fontSize: '100px',
      color: winnerColor,
      stroke: '#000022',
      strokeThickness: 8,
    }).setOrigin(0.5).setShadow(0, 0, winnerColor, 30, true, true);

    this.tweens.add({
      targets: victoryText,
      y: height * 0.35,
      duration: 800,
      ease: 'Back.out',
    });

    const nameText = this.add.text(width / 2, height * 0.52, `${winnerName} WINS!`, {
      fontFamily: 'monospace',
      fontSize: '56px',
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: nameText,
      alpha: 1,
      duration: 600,
      delay: 500,
    });

    // Restart hint
    const restartText = this.add.text(width / 2, height * 0.75, 'Press RESTART on your controller to play again', {
      fontFamily: 'monospace',
      fontSize: '26px',
      color: '#446680',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: restartText,
      alpha: 1,
      duration: 600,
      delay: 1200,
    });

    // Pulsing restart hint
    this.time.delayedCall(1800, () => {
      this.tweens.add({
        targets: restartText,
        alpha: 0.4,
        duration: 800,
        yoyo: true,
        repeat: -1,
      });
    });

    // Particle celebration
    this.time.delayedCall(600, () => this.spawnCelebration(width, height, winnerColor));
  }

  private drawStars(): void {
    const { width, height } = this.scale;
    const gfx = this.add.graphics();
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = Math.random() * 2;
      const alpha = 0.2 + Math.random() * 0.6;
      gfx.fillStyle(0xffffff, alpha).fillCircle(x, y, r);
    }
  }

  private spawnCelebration(width: number, height: number, _color: string): void {
    const tints = [0x00e5ff, 0xff6eb4, 0xffff00, 0x00ff88, 0xff8800];
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 150, () => {
        const x = Math.random() * width;
        const emitter = this.add.particles(x, height * 0.5, 'particle-exp', {
          speed: { min: 100, max: 300 },
          angle: { min: 220, max: 320 },
          scale: { start: 1, end: 0 },
          lifespan: 900,
          quantity: 25,
          tint: tints,
        });
        this.time.delayedCall(1000, () => emitter.destroy());
      });
    }
  }
}
