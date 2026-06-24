export type Orientation = 'horizontal' | 'vertical';
export type Facing = 'right' | 'down' | 'left' | 'up';
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
  facing: Facing;
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
  { id: 'heavy-fighter',   length: 4, name: 'Heavy Fighter' },  // 4-cell — 1 ship
  { id: 'fighter-1',       length: 3, name: 'Fighter' },        // 3-cell — 2 ships
  { id: 'fighter-2',       length: 3, name: 'Fighter' },
  { id: 'interceptor-1',   length: 2, name: 'Interceptor' },    // 2-cell — 3 ships
  { id: 'interceptor-2',   length: 2, name: 'Interceptor' },
  { id: 'interceptor-3',   length: 2, name: 'Interceptor' },
  { id: 'scout-1',         length: 1, name: 'Scout' },          // 1-cell — 4 ships
  { id: 'scout-2',         length: 1, name: 'Scout' },
  { id: 'scout-3',         length: 1, name: 'Scout' },
  { id: 'scout-4',         length: 1, name: 'Scout' },
];

export const GRID_SIZE = 10;
export const TOTAL_SHIP_CELLS = FLEET_CONFIG.reduce((sum, s) => sum + s.length, 0);
