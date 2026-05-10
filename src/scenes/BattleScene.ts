import Phaser from 'phaser';
import type { PlayerManager } from '@/state/PlayerManager';
import type { GameManager } from '@/game/GameManager';
import type { AttackResultMessage } from '@/types/Messages';
import type { PlayerSlot } from '@/types/GameTypes';
import { Grid } from '@/ui/Grid';
import { AnimationManager } from '@/ui/AnimationManager';
import { ProceduralAudio } from '@/ui/ProceduralAudio';

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

// TV canvas is 1920×1080. Show 2 large attack grids side by side.
// Each grid shows what that player has shot at the opponent.
export class BattleScene extends Phaser.Scene {
  // attack grids: index = attacker slot (p0 shots, p1 shots)
  private attackGrids: [Grid | null, Grid | null] = [null, null];
  private turnText!: Phaser.GameObjects.Text;
  private playerLabels: [Phaser.GameObjects.Text | null, Phaser.GameObjects.Text | null] = [null, null];
  private animManager!: AnimationManager;
  private audio!: ProceduralAudio;
  private attackResultHandler!: (data: AttackEventData) => void;
  private gameOverHandler!: (winner: PlayerSlot) => void;
  private disconnectHandler!: () => void;

  // World positions for animation targeting (defender's fleet grid origin)
  private gridOriginX = [0, 0];
  private gridOriginY = [0, 0];
  private cellSize = 72;

  constructor() { super({ key: 'BattleScene' }); }

  create(): void {
    const { width, height } = this.scale;

    this.animManager = new AnimationManager(this);
    this.audio = this.registry.get('audio') as ProceduralAudio;

    this.add.rectangle(width / 2, height / 2, width, height, 0x050a12);
    this.drawGridLines();

    // ── Layout ────────────────────────────────────────────────────────────
    const topPad   = 110;  // enough room for title + player label + subtitle
    const botPad   = 70;
    const sidePad  = 80;
    const midGap   = 60;

    const availW = width  - sidePad * 2 - midGap;
    const availH = height - topPad - botPad;
    this.cellSize = Math.floor(Math.min(availW / 2, availH) / 10);
    const gridPx  = this.cellSize * 10;

    const leftX  = sidePad + (availW / 2 - gridPx) / 2;
    const rightX = sidePad + availW / 2 + midGap + (availW / 2 - gridPx) / 2;
    const gridY  = topPad + (availH - gridPx) / 2;

    this.gridOriginX = [leftX, rightX];
    this.gridOriginY = [gridY, gridY];

    const pColors = ['#00e5ff', '#ff6eb4'];
    const centersX = [leftX + gridPx / 2, rightX + gridPx / 2];

    // ── Title ─────────────────────────────────────────────────────────────
    this.add.text(width / 2, 32, 'BATTLE PHASE', {
      fontFamily: 'monospace',
      fontSize: '38px',
      color: '#00e5ff',
      stroke: '#003344',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // ── Per-player attack grids ────────────────────────────────────────────
    for (let slot = 0; slot < 2; slot++) {
      const cx = centersX[slot];
      const gx = this.gridOriginX[slot];
      const gy = this.gridOriginY[slot];

      // Player label
      this.playerLabels[slot] = this.add.text(cx, gy - 52, `PLAYER ${slot + 1}`, {
        ...HEADER_STYLE, color: pColors[slot],
      }).setOrigin(0.5).setAlpha(0.95);

      // Subtitle — leave at least 10px gap below player label
      this.add.text(cx, gy - 22, 'ATTACK BOARD', {
        fontFamily: 'monospace', fontSize: '16px', color: pColors[slot],
      }).setOrigin(0.5).setAlpha(0.45);

      // Grid — shows attacker's shots on the opponent
      this.attackGrids[slot] = new Grid(this, gx, gy, this.cellSize);

      // Decorative border glow around grid
      const gfx = this.add.graphics();
      gfx.lineStyle(2, slot === 0 ? 0x00e5ff : 0xff6eb4, 0.25);
      gfx.strokeRect(gx - 6, gy - 6, gridPx + 12, gridPx + 12);
    }

    // ── Turn indicator ────────────────────────────────────────────────────
    this.turnText = this.add.text(width / 2, height - 28, '', TURN_STYLE).setOrigin(0.5);

    // ── Events ────────────────────────────────────────────────────────────
    this.attackResultHandler = (data: AttackEventData) => this.onAttackResult(data);
    this.gameOverHandler     = (_winner: PlayerSlot) => {};
    this.disconnectHandler   = () => this.onDisconnect();

    this.game.events.on('attack-result',      this.attackResultHandler, this);
    this.game.events.on('game-over',          this.gameOverHandler,     this);
    this.game.events.on('player-disconnected', this.disconnectHandler,  this);

    this.updateBoards();
    this.updateTurnDisplay();
  }

  update(): void {
    this.updateBoards();
    this.updateTurnDisplay();
  }

  shutdown(): void {
    this.game.events.off('attack-result',      this.attackResultHandler, this);
    this.game.events.off('game-over',          this.gameOverHandler,     this);
    this.game.events.off('player-disconnected', this.disconnectHandler,  this);
  }

  private updateBoards(): void {
    const playerManager = this.registry.get('playerManager') as PlayerManager;
    const [p0, p1] = playerManager.getBothPlayers();
    // Show each player's attack board (what they shot at the opponent)
    if (p0 && this.attackGrids[0]) this.attackGrids[0].updateFromBoard(p0.board.attackBoard);
    if (p1 && this.attackGrids[1]) this.attackGrids[1].updateFromBoard(p1.board.attackBoard);
  }

  private updateTurnDisplay(): void {
    const gameManager = this.registry.get('gameManager') as GameManager;
    const turn = gameManager.getCurrentTurn();
    if (turn === null) return;
    const names  = ['PLAYER 1', 'PLAYER 2'];
    const colors = ['#00e5ff', '#ff6eb4'];
    this.turnText.setText(`⚡ ${names[turn]}'S TURN`).setColor(colors[turn]);

    // Highlight the active player's label
    for (let s = 0; s < 2; s++) {
      this.playerLabels[s]?.setAlpha(s === turn ? 1 : 0.35);
    }
  }

  private onAttackResult(data: AttackEventData): void {
    const attackerSlot = data.attackerSlot;
    const grid = this.attackGrids[attackerSlot];
    if (!grid) return;

    const gx = this.gridOriginX[attackerSlot];
    const gy = this.gridOriginY[attackerSlot];
    const cs = this.cellSize;
    const worldX = gx + data.x * cs + cs / 2;
    const worldY = gy + data.y * cs + cs / 2;

    grid.markCell(data.x, data.y, data.hit ? (data.sunk ? 'sunk' : 'hit') : 'miss');

    if (data.hit) {
      if (data.sunk) {
        this.audio?.playSunk();
        this.animManager.playExplosion(worldX, worldY);
        this.animManager.playSunkEffect(worldX, worldY);
        this.cameras.main.shake(280, 0.009);
        const label = data.sunkShipName
          ? `⚓ ${data.sunkShipName.toUpperCase()} SUNK!`
          : '⚓ SHIP SUNK!';
        this.animManager.showFloatingBanner(this.scale.width / 2, this.scale.height * 0.42, label);
      } else {
        this.audio?.playHit();
        this.animManager.playExplosion(worldX, worldY);
        this.cameras.main.shake(180, 0.005);
      }
    } else {
      this.audio?.playMiss();
      this.animManager.playWaterSplash(worldX, worldY);
    }
  }

  private onDisconnect(): void {
    const { width, height } = this.scale;
    const overlay = this.add.text(width / 2, height / 2 + 80, '⚠ Player disconnected...', {
      fontFamily: 'monospace', fontSize: '30px', color: '#ff8800',
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
