import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() { super({ key: 'PreloadScene' }); }

  preload(): void {
    const { width, height } = this.scale;

    const bar = this.add.graphics();
    const bg = this.add.graphics();
    bg.fillStyle(0x111827).fillRect(width * 0.2, height * 0.5 - 12, width * 0.6, 24);

    this.load.on('progress', (value: number) => {
      bar.clear()
        .fillStyle(0x00e5ff)
        .fillRect(width * 0.2, height * 0.5 - 12, width * 0.6 * value, 24);
    });

    this.add.text(width / 2, height * 0.5 - 40, 'Loading...', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#00e5ff',
    }).setOrigin(0.5);
  }

  create(): void {
    this.generateTextures();
    this.scene.start('LobbyScene');
  }

  private generateTextures(): void {
    // Grid cell
    const cellGfx = this.add.graphics();
    cellGfx.fillStyle(0x0d2137).fillRect(0, 0, 48, 48);
    cellGfx.lineStyle(1, 0x00e5ff, 0.4).strokeRect(0, 0, 48, 48);
    cellGfx.generateTexture('grid-cell', 48, 48);
    cellGfx.destroy();

    // Ship segment
    const shipGfx = this.add.graphics();
    shipGfx.fillStyle(0x1a5276).fillRect(2, 2, 44, 44);
    shipGfx.lineStyle(2, 0x00e5ff, 0.8).strokeRect(2, 2, 44, 44);
    shipGfx.generateTexture('ship-segment', 48, 48);
    shipGfx.destroy();

    // Hit marker
    const hitGfx = this.add.graphics();
    hitGfx.fillStyle(0xff4444).fillRect(0, 0, 48, 48);
    hitGfx.fillStyle(0xff0000).fillCircle(24, 24, 16);
    hitGfx.generateTexture('cell-hit', 48, 48);
    hitGfx.destroy();

    // Miss marker
    const missGfx = this.add.graphics();
    missGfx.fillStyle(0x1a2a3a).fillRect(0, 0, 48, 48);
    missGfx.fillStyle(0x334455).fillCircle(24, 24, 10);
    missGfx.generateTexture('cell-miss', 48, 48);
    missGfx.destroy();

    // Explosion particle
    const expGfx = this.add.graphics();
    expGfx.fillStyle(0xff8800).fillCircle(8, 8, 8);
    expGfx.generateTexture('particle-exp', 16, 16);
    expGfx.destroy();

    // Water particle
    const waterGfx = this.add.graphics();
    waterGfx.fillStyle(0x00aaff).fillCircle(6, 6, 6);
    waterGfx.generateTexture('particle-water', 12, 12);
    waterGfx.destroy();
  }
}
