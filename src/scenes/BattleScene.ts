import Phaser from 'phaser';
import type { PlayerManager } from '@/state/PlayerManager';
import type { GameManager } from '@/game/GameManager';
import type { AttackResultMessage } from '@/types/Messages';
import type { PlayerSlot } from '@/types/GameTypes';
import { Grid } from '@/ui/Grid';
import { AnimationManager } from '@/ui/AnimationManager';

interface AttackEventData extends AttackResultMessage {
  attackerSlot: PlayerSlot;
}

const HEADER_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'monospace',
  fontSize: '28px',
  color: '#00e5ff',
};

const TURN_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'monospace',
  fontSize: '40px',
  color: '#ffffff',
  stroke: '#000022',
  strokeThickness: 4,
};

export class BattleScene extends Phaser.Scene {
  private grids: [Grid | null, Grid | null] = [null, null];
  private turnText!: Phaser.GameObjects.Text;
  private animManager!: AnimationManager;
  private attackResultHandler!: (data: AttackEventData) => void;
  private gameOverHandler!: (winner: PlayerSlot) => void;
  private disconnectHandler!: () => void;

  constructor() { super({ key: 'BattleScene' }); }

  create(): void {
    const { width, height } = this.scale;
    const cellSize = 46;
    const gridSize = cellSize * 10;
    const margin = (width - gridSize * 2 - 200) / 2;

    this.animManager = new AnimationManager(this);

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x050a12);
    this.drawGridLines();

    // Player 1 section
    this.grids[0] = new Grid(this, margin + 20, 160, cellSize);
    this.add.text(margin + 20 + gridSize / 2, 120, 'PLAYER 1 — YOUR FLEET', { ...HEADER_STYLE, color: '#00e5ff' })
      .setOrigin(0.5)
      .setAlpha(0.8);

    // Player 2 section
    this.grids[1] = new Grid(this, width - margin - gridSize - 20, 160, cellSize);
    this.add.text(width - margin - 20 - gridSize / 2, 120, 'PLAYER 2 — YOUR FLEET', { ...HEADER_STYLE, color: '#ff6eb4' })
      .setOrigin(0.5)
      .setAlpha(0.8);

    // Center info
    this.turnText = this.add.text(width / 2, height / 2 - 20, '', TURN_STYLE).setOrigin(0.5);

    this.add.text(width / 2, 50, 'BATTLE PHASE', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#00e5ff',
      stroke: '#003344',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.attackResultHandler = (data: AttackEventData) => this.onAttackResult(data, margin, cellSize);
    this.gameOverHandler = (winner: PlayerSlot) => this.onGameOver(winner);
    this.disconnectHandler = () => this.onDisconnect();

    this.game.events.on('attack-result', this.attackResultHandler, this);
    this.game.events.on('game-over', this.gameOverHandler, this);
    this.game.events.on('player-disconnected', this.disconnectHandler, this);

    this.updateBoards();
    this.updateTurnDisplay();
  }

  update(): void {
    this.updateBoards();
    this.updateTurnDisplay();
  }

  shutdown(): void {
    this.game.events.off('attack-result', this.attackResultHandler, this);
    this.game.events.off('game-over', this.gameOverHandler, this);
    this.game.events.off('player-disconnected', this.disconnectHandler, this);
  }

  private updateBoards(): void {
    const playerManager = this.registry.get('playerManager') as PlayerManager;
    const [p0, p1] = playerManager.getBothPlayers();
    if (p0 && this.grids[0]) this.grids[0].updateFromBoard(p0.board.ownBoard);
    if (p1 && this.grids[1]) this.grids[1].updateFromBoard(p1.board.ownBoard);
  }

  private updateTurnDisplay(): void {
    const gameManager = this.registry.get('gameManager') as GameManager;
    const turn = gameManager.getCurrentTurn();
    if (turn === null) return;
    const names = ['PLAYER 1', 'PLAYER 2'];
    const colors = ['#00e5ff', '#ff6eb4'];
    this.turnText
      .setText(`${names[turn]}'S TURN`)
      .setColor(colors[turn]);
  }

  private onAttackResult(data: AttackEventData, margin: number, cellSize: number): void {
    const { width } = this.scale;
    const gridSize = cellSize * 10;

    const targetSlot: PlayerSlot = data.attackerSlot === 0 ? 1 : 0;
    const grid = this.grids[targetSlot];
    if (!grid) return;

    const gridX = targetSlot === 0
      ? margin + 20
      : width - margin - gridSize - 20;
    const gridY = 160;

    const worldX = gridX + data.x * cellSize + cellSize / 2;
    const worldY = gridY + data.y * cellSize + cellSize / 2;

    grid.markCell(data.x, data.y, data.hit ? (data.sunk ? 'sunk' : 'hit') : 'miss');

    if (data.hit) {
      this.animManager.playExplosion(worldX, worldY);
      this.cameras.main.shake(180, 0.005);
    } else {
      this.animManager.playWaterSplash(worldX, worldY);
    }

    if (data.sunk) {
      this.animManager.playSunkEffect(worldX, worldY);
    }
  }

  private onGameOver(_winner: PlayerSlot): void {
    // Phase change handled by BootScene listener
  }

  private onDisconnect(): void {
    const { width, height } = this.scale;
    const overlay = this.add.text(width / 2, height / 2 + 80, '⚠ Player disconnected...', {
      fontFamily: 'monospace',
      fontSize: '30px',
      color: '#ff8800',
    }).setOrigin(0.5);
    this.time.delayedCall(3000, () => overlay.destroy());
  }

  private drawGridLines(): void {
    const { width, height } = this.scale;
    const gfx = this.add.graphics();
    gfx.lineStyle(1, 0x00e5ff, 0.04);
    for (let i = 0; i <= 40; i++) {
      const x = (i / 40) * width;
      gfx.beginPath().moveTo(x, 0).lineTo(x, height).strokePath();
    }
    for (let i = 0; i <= 22; i++) {
      const y = (i / 22) * height;
      gfx.beginPath().moveTo(0, y).lineTo(width, y).strokePath();
    }
  }
}
