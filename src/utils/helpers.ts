import type { Board } from '@/types/GameTypes';
import { GRID_SIZE } from '@/types/GameTypes';
import type { PlayerSlot } from '@/types/GameTypes';

export function createEmptyBoard(): Board {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({ state: 'empty' as const, shipId: null }))
  );
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function randomSlot(): PlayerSlot {
  return Math.random() < 0.5 ? 0 : 1;
}

export function deepCloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => ({ ...cell })));
}
