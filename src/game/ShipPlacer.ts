import type { Board, PlacedShip, Orientation } from '@/types/GameTypes';
import { GRID_SIZE } from '@/types/GameTypes';

export class ShipPlacer {
  static canPlace(
    board: Board,
    length: number,
    x: number,
    y: number,
    orientation: Orientation,
  ): boolean {
    const cells = ShipPlacer.getOccupiedCells(length, x, y, orientation);

    if (!cells.every(([cx, cy]) =>
      cx >= 0 && cx < GRID_SIZE && cy >= 0 && cy < GRID_SIZE
    )) return false;

    for (const [cx, cy] of cells) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
          if (board[ny][nx].state === 'ship') return false;
        }
      }
    }

    return true;
  }

  static placeShip(
    board: Board,
    ship: PlacedShip,
    x: number,
    y: number,
    orientation: Orientation,
  ): Board {
    const newBoard = ShipPlacer.cloneBoard(board);
    const cells = ShipPlacer.getOccupiedCells(ship.definition.length, x, y, orientation);
    for (const [cx, cy] of cells) {
      newBoard[cy][cx] = { state: 'ship', shipId: ship.definition.id };
    }
    return newBoard;
  }

  static removeShip(board: Board, ship: PlacedShip): Board {
    if (ship.x < 0) return board;
    const newBoard = ShipPlacer.cloneBoard(board);
    const cells = ShipPlacer.getOccupiedCells(ship.definition.length, ship.x, ship.y, ship.orientation);
    for (const [cx, cy] of cells) {
      newBoard[cy][cx] = { state: 'empty', shipId: null };
    }
    return newBoard;
  }

  static getOccupiedCells(
    length: number,
    x: number,
    y: number,
    orientation: Orientation,
  ): [number, number][] {
    return Array.from({ length }, (_, i) =>
      (orientation === 'horizontal' ? [x + i, y] : [x, y + i]) as [number, number]
    );
  }

  static autoPlace(board: Board, ships: PlacedShip[]): { board: Board; ships: PlacedShip[] } | null {
    const orientations: Orientation[] = ['horizontal', 'vertical'];
    let currentBoard = ShipPlacer.cloneBoard(board);
    const updatedShips = ships.map(s => ({ ...s }));

    for (const ship of updatedShips) {
      if (ship.x >= 0) continue; // already placed

      let placed = false;
      const candidates: { x: number; y: number; orientation: Orientation }[] = [];
      for (const orientation of orientations) {
        const maxX = orientation === 'horizontal' ? GRID_SIZE - ship.definition.length : GRID_SIZE - 1;
        const maxY = orientation === 'vertical' ? GRID_SIZE - ship.definition.length : GRID_SIZE - 1;
        for (let y = 0; y <= maxY; y++) {
          for (let x = 0; x <= maxX; x++) {
            if (ShipPlacer.canPlace(currentBoard, ship.definition.length, x, y, orientation)) {
              candidates.push({ x, y, orientation });
            }
          }
        }
      }

      if (candidates.length === 0) return null;
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      currentBoard = ShipPlacer.placeShip(currentBoard, ship, pick.x, pick.y, pick.orientation);
      ship.x = pick.x;
      ship.y = pick.y;
      ship.orientation = pick.orientation;
      ship.facing = pick.orientation === 'horizontal' ? 'right' : 'down';
      placed = true;

      if (!placed) return null;
    }

    return { board: currentBoard, ships: updatedShips };
  }

  private static cloneBoard(board: Board): Board {
    return board.map(row => row.map(cell => ({ ...cell })));
  }
}
