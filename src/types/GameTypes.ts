export type Orientation = 'horizontal' | 'vertical';
export type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';
export type GamePhase = 'lobby' | 'placement' | 'battle' | 'result';
export type PlayerSlot = 0 | 1;

export interface ShipDefinition {
  readonly id: string;
  readonly length: number;
  readonly name: string;
}

export interface PlacedShip {
  readonly definition: ShipDefinition;
  x: number;
  y: number;
  orientation: Orientation;
  hits: number;
  isSunk: boolean;
}

export interface BoardCell {
  state: CellState;
  shipId: string | null;
}

export type Board = BoardCell[][];

/** Remaining ships grouped for HUD (battle). */
export interface ShipTallyRow {
  length: number;
  count: number;
  label: string;
}

export interface PlayerBoard {
  ownBoard: Board;
  attackBoard: Board;
  ships: PlacedShip[];
  allShipsPlaced: boolean;
}

export interface PlayerData {
  deviceId: number;
  slot: PlayerSlot;
  nickname: string;
  isReady: boolean;
  board: PlayerBoard;
  isConnected: boolean;
}

export const FLEET_CONFIG: ShipDefinition[] = [
  { id: 'carrier',     length: 4, name: 'Carrier' },
  { id: 'cruiser-1',   length: 3, name: 'Cruiser' },
  { id: 'cruiser-2',   length: 3, name: 'Cruiser' },
  { id: 'destroyer-1', length: 2, name: 'Destroyer' },
  { id: 'destroyer-2', length: 2, name: 'Destroyer' },
  { id: 'destroyer-3', length: 2, name: 'Destroyer' },
  { id: 'submarine-1', length: 1, name: 'Sub' },
  { id: 'submarine-2', length: 1, name: 'Sub' },
  { id: 'submarine-3', length: 1, name: 'Sub' },
  { id: 'submarine-4', length: 1, name: 'Sub' },
];

export const GRID_SIZE = 10;
export const TOTAL_SHIP_CELLS = FLEET_CONFIG.reduce((sum, s) => sum + s.length, 0);
