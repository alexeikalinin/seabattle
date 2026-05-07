import type { PlayerSlot } from '@/types/GameTypes';

export class TurnManager {
  private currentTurn: PlayerSlot;

  constructor(firstTurn: PlayerSlot = 0) {
    this.currentTurn = firstTurn;
  }

  getCurrent(): PlayerSlot { return this.currentTurn; }

  advance(): PlayerSlot {
    this.currentTurn = this.currentTurn === 0 ? 1 : 0;
    return this.currentTurn;
  }

  isPlayerTurn(slot: PlayerSlot): boolean {
    return this.currentTurn === slot;
  }

  reset(firstTurn: PlayerSlot = 0): void {
    this.currentTurn = firstTurn;
  }
}
