import type { Orientation, PlayerSlot, GamePhase, Board, PlacedShip, ShipTallyRow } from './GameTypes';

// ── Controller → Screen ──────────────────────────────────────────────────

export type ControllerAction =
  | ReadyAction
  | PlaceShipAction
  | RotateShipAction
  | AttackCellAction
  | RestartGameAction
  | AutoPlaceAction;

export interface ReadyAction       { type: 'READY' }
export interface PlaceShipAction   { type: 'PLACE_SHIP'; shipId: string; x: number; y: number; orientation: Orientation }
export interface RotateShipAction  { type: 'ROTATE_SHIP'; shipId: string }
export interface AttackCellAction  { type: 'ATTACK_CELL'; x: number; y: number }
export interface RestartGameAction { type: 'RESTART_GAME' }
export interface AutoPlaceAction   { type: 'AUTO_PLACE' }

// ── Screen → Controller ──────────────────────────────────────────────────

export type ScreenMessage =
  | StateUpdateMessage
  | AttackResultMessage
  | GameOverMessage;

export interface StateUpdateMessage {
  type: 'STATE_UPDATE';
  phase: GamePhase;
  playerSlot: PlayerSlot;
  yourTurn: boolean;
  ownBoard: Board;
  attackBoard: Board;
  ships: PlacedShip[];
  opponentShipsRemaining: number;
  /** Opponent ships still afloat, grouped by class (name + length). */
  opponentShipTally: ShipTallyRow[];
  /** Your ships still afloat, grouped by class. */
  ownShipTally: ShipTallyRow[];
  unplacedShipIds: string[];
}

export interface AttackResultMessage {
  type: 'ATTACK_RESULT';
  x: number;
  y: number;
  hit: boolean;
  sunk: boolean;
  shipId: string | null;
  /** Set when sunk — for UI (“Carrier sunk!”). */
  sunkShipName: string | null;
  attackerSlot: PlayerSlot;
}

export interface GameOverMessage {
  type: 'GAME_OVER';
  winner: PlayerSlot;
}
