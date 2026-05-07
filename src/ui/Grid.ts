import Phaser from 'phaser';
import type { Board, CellState } from '@/types/GameTypes';
import { GRID_SIZE } from '@/types/GameTypes';

const CELL_COLORS: Record<CellState, number> = {
  empty: 0x0d2137,
  ship:  0x1a5276,
  hit:   0xff4444,
  miss:  0x334d66,
  sunk:  0xff0000,
};

export class Grid extends Phaser.GameObjects.Container {
  private readonly cells: Phaser.GameObjects.Rectangle[][] = [];
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
      for (let col = 0; col < GRID_SIZE; col++) {
        const cx = col * this.cellSize + this.cellSize / 2;
        const cy = row * this.cellSize + this.cellSize / 2;
        const cell = this.scene.add.rectangle(cx, cy, this.cellSize - 2, this.cellSize - 2, 0x0d2137);
        cell.setStrokeStyle(1, 0x00e5ff, 0.35);
        this.add(cell);
        this.cells[row][col] = cell;
      }
    }

    // Row/col labels
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
        const rect = this.cells[row][col];
        const state = board[row][col].state;
        rect.setFillStyle(CELL_COLORS[state]);
        if (state === 'sunk') {
          rect.setStrokeStyle(2.5, 0xffffff, 0.9);
        } else {
          rect.setStrokeStyle(1, 0x00e5ff, 0.35);
        }
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
      onComplete: () => {
        cell.setFillStyle(CELL_COLORS[state]);
        if (state === 'sunk') {
          cell.setStrokeStyle(2.5, 0xffffff, 0.9);
        } else {
          cell.setStrokeStyle(1, 0x00e5ff, 0.35);
        }
      },
    });
  }

  totalSize(): number {
    return GRID_SIZE * this.cellSize;
  }
}
