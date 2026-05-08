import Phaser from 'phaser';
import type { Board, CellState } from '@/types/GameTypes';
import { GRID_SIZE } from '@/types/GameTypes';

const CELL_COLORS: Record<CellState, number> = {
  empty: 0x0d2137,
  ship:  0x1a5276,
  hit:   0xdd3333,
  miss:  0x071628,  // very dark — white dot overlay provides contrast
  sunk:  0xbb0808,
};

export class Grid extends Phaser.GameObjects.Container {
  private readonly cells: Phaser.GameObjects.Rectangle[][] = [];
  private readonly markers: (Phaser.GameObjects.Text | null)[][] = [];
  readonly cellSize: number;

  constructor(scene: Phaser.Scene, x: number, y: number, cellSize = 48) {
    super(scene, x, y);
    this.cellSize = cellSize;
    this.buildGrid();
    scene.add.existing(this);
  }

  private buildGrid(): void {
    for (let row = 0; row < GRID_SIZE; row++) {
      this.cells[row] = [];
      this.markers[row] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        const cx = col * this.cellSize + this.cellSize / 2;
        const cy = row * this.cellSize + this.cellSize / 2;
        const cell = this.scene.add.rectangle(cx, cy, this.cellSize - 2, this.cellSize - 2, 0x0d2137);
        cell.setStrokeStyle(1, 0x00e5ff, 0.35);
        this.add(cell);
        this.cells[row][col] = cell;
        this.markers[row][col] = null;
      }
    }

    const labelStyle = { fontFamily: 'monospace', fontSize: '11px', color: '#446680' };
    const letters = 'ABCDEFGHIJ';
    for (let i = 0; i < GRID_SIZE; i++) {
      this.add(this.scene.add.text(
        i * this.cellSize + this.cellSize / 2,
        -14,
        String(i + 1),
        labelStyle,
      ).setOrigin(0.5, 0.5));
      this.add(this.scene.add.text(
        -14,
        i * this.cellSize + this.cellSize / 2,
        letters[i],
        labelStyle,
      ).setOrigin(0.5, 0.5));
    }
  }

  updateFromBoard(board: Board): void {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const state = board[row][col].state;
        this.applyState(row, col, state);
      }
    }
  }

  markCell(col: number, row: number, state: CellState): void {
    const cell = this.cells[row]?.[col];
    if (!cell) return;
    this.scene.tweens.add({
      targets: cell,
      scaleX: 1.45,
      scaleY: 1.45,
      duration: 90,
      yoyo: true,
      onComplete: () => this.applyState(row, col, state),
    });
  }

  totalSize(): number {
    return GRID_SIZE * this.cellSize;
  }

  private applyState(row: number, col: number, state: CellState): void {
    const cell = this.cells[row][col];
    cell.setFillStyle(CELL_COLORS[state]);

    if (state === 'sunk') {
      cell.setStrokeStyle(2.5, 0xffffff, 0.9);
    } else if (state === 'miss') {
      cell.setStrokeStyle(1.5, 0x88c8ee, 0.5);
    } else {
      cell.setStrokeStyle(1, 0x00e5ff, 0.35);
    }

    this.setMarker(row, col, state);
  }

  private setMarker(row: number, col: number, state: CellState): void {
    const existing = this.markers[row][col];
    if (existing) {
      existing.destroy();
      this.markers[row][col] = null;
    }

    const cx = col * this.cellSize + this.cellSize / 2;
    const cy = row * this.cellSize + this.cellSize / 2;
    const s = this.cellSize;

    if (state === 'miss') {
      // White dot — clearly visible against very dark miss background
      const dot = this.scene.add.circle(cx, cy, s * 0.16, 0xc8e8ff, 0.85);
      this.add(dot);
      this.markers[row][col] = dot as unknown as Phaser.GameObjects.Text;
    } else if (state === 'hit') {
      const t = this.scene.add.text(cx, cy, '✕', {
        fontSize: `${Math.round(s * 0.42)}px`,
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0.5).setAlpha(0.9);
      this.add(t);
      this.markers[row][col] = t;
    } else if (state === 'sunk') {
      const t = this.scene.add.text(cx, cy, '✕', {
        fontSize: `${Math.round(s * 0.44)}px`,
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0.5);
      this.add(t);
      this.markers[row][col] = t;
      // Pulse the sunk marker
      this.scene.tweens.add({
        targets: t,
        alpha: 0.5,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }
}
