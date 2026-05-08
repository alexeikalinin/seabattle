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
  fontSize: '22px',
  color: '#00e5ff',
};

const SUB_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'monospace',
  fontSize: '16px',
  color: '#7ecfe0',
};

const TURN_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'monospace',
  fontSize: '36px',
  color: '#ffffff',
  stroke: '#000022',
  strokeThickness: 4,
};

export class BattleScene extends Phaser.Scene {
  private fleetGrids: [Grid | null, Grid | null] = [null, null];
  private radarGrids: [Grid | null, Grid | null] = [null, null];
  private turnText!: Phaser.GameObjects.Text;
  private animManager!: AnimationManager;
  private audio!: ProceduralAudio;
  private attackResultHandler!: (data: AttackEventData) => void;
  private gameOverHandler!: (winner: PlayerSlot) => void;
  private disconnectHandler!: () => void;
  private cellSize = 34;
  private gridOriginX = [0, 0];
  private gridOriginY = [0, 0];

  constructor() { super({ key: 'BattleScene' }); }

  create(): void {
    const { width, height } = this.scale;

    this.animManager = new AnimationManager(this);
    this.audio = this.registry.get('audio') as ProceduralAudio;

    this.add.rectangle(width / 2, height / 2, width, height, 0x050a12);
    this.drawGridLines();

    const colW = width * 0.48;
    const gapMid = width * 0.04;
    const leftX = (width - colW * 2 - gapMid) / 2;
    const rightX = leftX + colW + gapMid;
    this.cellSize = Math.max(26, Math.min(36, Math.floor((colW - 40) / 10)));
    const gridPx = this.cellSize * 10;
    const topY = 88;
    const stackGap = 44;

    const centersX = [leftX + colW / 2, rightX + colW / 2];
    this.gridOriginX = [centersX[0] - gridPx / 2, centersX[1] - gridPx / 2];
    this.gridOriginY = [topY, topY];

    const pColors = ['#00e5ff', '#ff6eb4'];

    for (let slot = 0; slot < 2; slot++) {
      const cx = centersX[slot];
      this.add.text(cx, 52, `PLAYER ${slot + 1}`, { ...HEADER_STYLE, color: pColors[slot] })
        .setOrigin(0.5)
        .setAlpha(0.95);

      this.add.text(cx, topY - 26, 'YOUR FLEET', SUB_STYLE).setOrigin(0.5).setAlpha(0.75);
      this.fleetGrids[slot] = new Grid(this, this.gridOriginX[slot], topY, this.cellSize);

      const radarY = topY + gridPx + stackGap;
      this.add.text(cx, radarY - 26, 'YOUR SHOTS', SUB_STYLE).setOrigin(0.5).setAlpha(0.75);
      this.radarGrids[slot] = new Grid(this, this.gridOriginX[slot], radarY, this.cellSize);
    }

    this.turnText = this.add.text(width / 2, height - 36, '', TURN_STYLE).setOrigin(0.5);

    this.add.text(width / 2, 22, 'BATTLE PHASE', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#00e5ff',
      stroke: '#003344',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.attackResultHandler = (data: AttackEventData) => this.onAttackResult(data);
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
    if (p0 && this.fleetGrids[0]) this.fleetGrids[0].updateFromBoard(p0.board.ownBoard);
    if (p0 && this.radarGrids[0]) this.radarGrids[0].updateFromBoard(p0.board.attackBoard);
    if (p1 && this.fleetGrids[1]) this.fleetGrids[1].updateFromBoard(p1.board.ownBoard);
    if (p1 && this.radarGrids[1]) this.radarGrids[1].updateFromBoard(p1.board.attackBoard);
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

  private onAttackResult(data: AttackEventData): void {
    const targetSlot: PlayerSlot = data.attackerSlot === 0 ? 1 : 0;
    const grid = this.fleetGrids[targetSlot];
    if (!grid) return;

    const gridX = this.gridOriginX[targetSlot];
    const gridY = this.gridOriginY[targetSlot];
    const cs = this.cellSize;

    const worldX = gridX + data.x * cs + cs / 2;
    const worldY = gridY + data.y * cs + cs / 2;

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
