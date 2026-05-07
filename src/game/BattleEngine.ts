import type { Board, PlacedShip, PlayerSlot } from '@/types/GameTypes';
import { TOTAL_SHIP_CELLS } from '@/types/GameTypes';
import { ShipPlacer } from './ShipPlacer';

export interface AttackResult {
  hit: boolean;
  sunk: boolean;
  shipId: string | null;
  gameOver: boolean;
  winner: PlayerSlot | null;
  updatedBoard: Board;
  updatedShips: PlacedShip[];
}

export class BattleEngine {
  static processAttack(
    attackerSlot: PlayerSlot,
    targetBoard: Board,
    targetShips: PlacedShip[],
    x: number,
    y: number,
  ): AttackResult {
    const cell = targetBoard[y][x];

    if (cell.state === 'hit' || cell.state === 'miss' || cell.state === 'sunk') {
      throw new Error(`Cell (${x},${y}) already attacked`);
    }

    const newBoard = targetBoard.map(row => row.map(c => ({ ...c })));
    const newShips: PlacedShip[] = targetShips.map(s => ({ ...s }));
    let hit = false;
    let sunk = false;
    let shipId: string | null = null;

    if (cell.state === 'ship' && cell.shipId !== null) {
      hit = true;
      shipId = cell.shipId;
      const idx = newShips.findIndex(s => s.definition.id === shipId);
      if (idx !== -1) {
        newShips[idx] = { ...newShips[idx], hits: newShips[idx].hits + 1 };
        if (newShips[idx].hits >= newShips[idx].definition.length) {
          newShips[idx] = { ...newShips[idx], isSunk: true };
          sunk = true;
          const sunkCells = ShipPlacer.getOccupiedCells(
            newShips[idx].definition.length,
            newShips[idx].x,
            newShips[idx].y,
            newShips[idx].orientation,
          );
          for (const [cx, cy] of sunkCells) {
            newBoard[cy][cx] = { state: 'sunk', shipId };
          }
        } else {
          newBoard[y][x] = { state: 'hit', shipId };
        }
      }
    } else {
      newBoard[y][x] = { state: 'miss', shipId: null };
    }

    const sunkCells = newShips
      .filter(s => s.isSunk)
      .reduce((sum, s) => sum + s.definition.length, 0);

    const gameOver = sunkCells >= TOTAL_SHIP_CELLS;

    return {
      hit,
      sunk,
      shipId,
      gameOver,
      winner: gameOver ? attackerSlot : null,
      updatedBoard: newBoard,
      updatedShips: newShips,
    };
  }
}
