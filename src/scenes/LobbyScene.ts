import Phaser from 'phaser';
import type { GameManager } from '@/game/GameManager';
import type { PlayerManager } from '@/state/PlayerManager';

const TEXT_STYLE_TITLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'monospace',
  fontSize: '72px',
  color: '#00e5ff',
  stroke: '#003344',
  strokeThickness: 6,
};

const TEXT_STYLE_LABEL: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'monospace',
  fontSize: '28px',
  color: '#7ecfe0',
};

const TEXT_STYLE_STATUS: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'monospace',
  fontSize: '32px',
  color: '#ffffff',
};

export class LobbyScene extends Phaser.Scene {
  private playerTexts: [Phaser.GameObjects.Text | null, Phaser.GameObjects.Text | null] = [null, null];
  private statusText!: Phaser.GameObjects.Text;
  private bgGraphics!: Phaser.GameObjects.Graphics;
  private waveTime = 0;

  constructor() { super({ key: 'LobbyScene' }); }

  create(): void {
    const { width, height } = this.scale;

    this.bgGraphics = this.add.graphics();
    this.drawBackground();

    // Title
    this.add.text(width / 2, 120, '⚓ BATTLESHIP DUEL', TEXT_STYLE_TITLE)
      .setOrigin(0.5)
      .setShadow(0, 0, '#00e5ff', 20, true, true);

    this.add.text(width / 2, 200, 'CONNECT YOUR SMARTPHONES TO PLAY', TEXT_STYLE_LABEL)
      .setOrigin(0.5)
      .setAlpha(0.7);

    // Player slots
    this.createPlayerSlot(0, width * 0.3, height / 2);
    this.createPlayerSlot(1, width * 0.7, height / 2);

    this.statusText = this.add.text(width / 2, height - 100, 'Waiting for players...', TEXT_STYLE_STATUS)
      .setOrigin(0.5)
      .setAlpha(0.6);

    // AirConsole join hint
    this.add.text(width / 2, height - 50, 'Open airconsole.com on your phone to join', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#446680',
    }).setOrigin(0.5);

    this.game.events.on('player-connected', this.onPlayerConnected, this);
    this.game.events.on('player-disconnected', this.onPlayerDisconnected, this);
  }

  update(time: number): void {
    this.waveTime = time;
    this.drawBackground();
    this.refreshPlayerStatus();
  }

  shutdown(): void {
    this.game.events.off('player-connected', this.onPlayerConnected, this);
    this.game.events.off('player-disconnected', this.onPlayerDisconnected, this);
  }

  private createPlayerSlot(slot: 0 | 1, x: number, y: number): void {
    const panel = this.add.graphics();
    panel.lineStyle(2, 0x00e5ff, 0.4)
      .strokeRoundedRect(x - 200, y - 150, 400, 300, 16);
    panel.fillStyle(0x0d1f2e, 0.7)
      .fillRoundedRect(x - 200, y - 150, 400, 300, 16);

    this.add.text(x, y - 80, `PLAYER ${slot + 1}`, {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: slot === 0 ? '#00e5ff' : '#ff6eb4',
    }).setOrigin(0.5);

    this.playerTexts[slot] = this.add.text(x, y + 20, '— Waiting —', TEXT_STYLE_LABEL)
      .setOrigin(0.5)
      .setAlpha(0.5);
  }

  private refreshPlayerStatus(): void {
    const playerManager = this.registry.get('playerManager') as PlayerManager;
    const gameManager = this.registry.get('gameManager') as GameManager;
    const [p0, p1] = playerManager.getBothPlayers();

    if (p0 && this.playerTexts[0]) {
      const name = p0.nickname || 'Player 1';
      this.playerTexts[0]
        .setText(p0.isReady ? `✓ ${name}\nREADY` : `● ${name}`)
        .setAlpha(1)
        .setColor(p0.isReady ? '#00ff88' : '#00e5ff');
    }

    if (p1 && this.playerTexts[1]) {
      const name = p1.nickname || 'Player 2';
      this.playerTexts[1]
        .setText(p1.isReady ? `✓ ${name}\nREADY` : `● ${name}`)
        .setAlpha(1)
        .setColor(p1.isReady ? '#00ff88' : '#ff6eb4');
    }

    const phase = gameManager.getPhase();
    if (phase === 'lobby') {
      const count = [p0, p1].filter(Boolean).length;
      if (count === 0) this.statusText.setText('Waiting for players...').setAlpha(0.6);
      else if (count === 1) this.statusText.setText('Waiting for 2nd player...').setAlpha(0.8);
      else if (!p0?.isReady || !p1?.isReady) this.statusText.setText('Both players — press READY!').setAlpha(1);
      else this.statusText.setText('Starting...').setAlpha(1);
    }
  }

  private drawBackground(): void {
    const { width, height } = this.scale;
    this.bgGraphics.clear();
    this.bgGraphics.fillStyle(0x0a0a1a).fillRect(0, 0, width, height);

    // Animated grid lines
    this.bgGraphics.lineStyle(1, 0x00e5ff, 0.04);
    const cols = 20;
    const rows = 12;
    for (let i = 0; i <= cols; i++) {
      const x = (i / cols) * width;
      this.bgGraphics.beginPath();
      this.bgGraphics.moveTo(x, 0);
      this.bgGraphics.lineTo(x, height);
      this.bgGraphics.strokePath();
    }
    for (let i = 0; i <= rows; i++) {
      const y = (i / rows) * height + Math.sin(this.waveTime * 0.001 + i * 0.5) * 3;
      this.bgGraphics.beginPath();
      this.bgGraphics.moveTo(0, y);
      this.bgGraphics.lineTo(width, y);
      this.bgGraphics.strokePath();
    }
  }

  private onPlayerConnected(): void { /* refreshed in update */ }
  private onPlayerDisconnected(): void { /* refreshed in update */ }
}
