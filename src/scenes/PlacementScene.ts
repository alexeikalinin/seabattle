import Phaser from 'phaser';
import type { PlayerManager } from '@/state/PlayerManager';
import { ProceduralAudio } from '@/ui/ProceduralAudio';
import { Grid } from '@/ui/Grid';

const LABEL_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'monospace',
  fontSize: '28px',
  color: '#00e5ff',
};

const STATUS_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'monospace',
  fontSize: '22px',
  color: '#7ecfe0',
};

export class PlacementScene extends Phaser.Scene {
  private grids: [Grid | null, Grid | null] = [null, null];
  private statusTexts: [Phaser.GameObjects.Text | null, Phaser.GameObjects.Text | null] = [null, null];
  private shipPlacedHandler!: (data: { slot: number }) => void;

  constructor() { super({ key: 'PlacementScene' }); }

  create(): void {
    const { width, height } = this.scale;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1a);

    this.add.text(width / 2, 50, 'PLACE YOUR SHIPS', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#00e5ff',
      stroke: '#003344',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(width / 2, 100, 'Use your smartphone to place ships', STATUS_STYLE)
      .setOrigin(0.5)
      .setAlpha(0.6);

    // Fit two grids side by side using all available space
    const titleH  = 140;   // room for title + subtitle
    const statusH = 80;    // room for status text at bottom
    const midGap  = 100;   // gap between the two grids
    const sidePad = 60;    // left/right padding

    const maxFromW = Math.floor((width  - sidePad * 2 - midGap) / 2 / 10) * 10;
    const maxFromH = Math.floor((height - titleH - statusH)      / 10) * 10;
    const gridSize = Math.min(maxFromW, maxFromH);
    const cellSize = gridSize / 10;

    const totalW  = gridSize * 2 + midGap;
    const leftX   = (width - totalW) / 2;
    const rightX  = leftX + gridSize + midGap;
    const gridY   = titleH;

    const cenL = leftX  + gridSize / 2;
    const cenR = rightX + gridSize / 2;

    // Player 1 grid
    this.grids[0] = new Grid(this, leftX, gridY, cellSize);
    this.add.text(cenL, gridY - 50, 'PLAYER 1', { ...LABEL_STYLE, color: '#00e5ff' }).setOrigin(0.5);
    this.statusTexts[0] = this.add.text(cenL, gridY + gridSize + 28, 'Placing ships...', STATUS_STYLE)
      .setOrigin(0.5).setAlpha(0.7);

    // Player 2 grid
    this.grids[1] = new Grid(this, rightX, gridY, cellSize);
    this.add.text(cenR, gridY - 50, 'PLAYER 2', { ...LABEL_STYLE, color: '#ff6eb4' }).setOrigin(0.5);
    this.statusTexts[1] = this.add.text(cenR, gridY + gridSize + 28, 'Placing ships...', STATUS_STYLE)
      .setOrigin(0.5).setAlpha(0.7);

    // VS divider
    this.add.text(width / 2, gridY + gridSize / 2, 'VS', {
      fontFamily: 'monospace',
      fontSize: '56px',
      color: '#1a3a4a',
    }).setOrigin(0.5);

    this.shipPlacedHandler = (data: { slot: number }) => {
      this.onShipPlaced(data.slot as 0 | 1);
    };
    this.game.events.on('ship-placed', this.shipPlacedHandler, this);
  }

  update(): void {
    const playerManager = this.registry.get('playerManager') as PlayerManager;
    const [p0, p1] = playerManager.getBothPlayers();

    if (p0 && this.grids[0]) {
      this.grids[0].updateFromBoard(p0.board.ownBoard, true);
    }
    if (p1 && this.grids[1]) {
      this.grids[1].updateFromBoard(p1.board.ownBoard, true);
    }
  }

  shutdown(): void {
    this.game.events.off('ship-placed', this.shipPlacedHandler, this);
  }

  private onShipPlaced(slot: 0 | 1): void {
    (this.registry.get('audio') as ProceduralAudio | undefined)?.playPlaceShip();
    const playerManager = this.registry.get('playerManager') as PlayerManager;
    const player = playerManager.getPlayerBySlot(slot);
    if (!player || !this.statusTexts[slot]) return;

    const placed = player.board.ships.filter(s => s.x >= 0).length;
    const total = player.board.ships.length;

    if (player.board.allShipsPlaced) {
      this.statusTexts[slot]!
        .setText('✓ All ships placed!')
        .setColor('#00ff88')
        .setAlpha(1);
    } else {
      this.statusTexts[slot]!.setText(`${placed}/${total} ships placed`).setAlpha(0.9);
    }
  }
}
