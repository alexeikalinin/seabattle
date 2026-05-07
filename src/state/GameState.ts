import type { GamePhase, PlayerSlot } from '@/types/GameTypes';

export class GameState {
  phase: GamePhase = 'lobby';
  currentTurn: PlayerSlot | null = null;
  winner: PlayerSlot | null = null;
  roundNumber = 0;

  startPlacement(): void {
    this.phase = 'placement';
  }

  startBattle(firstTurn: PlayerSlot): void {
    this.phase = 'battle';
    this.currentTurn = firstTurn;
  }

  endGame(winner: PlayerSlot): void {
    this.phase = 'result';
    this.winner = winner;
  }

  reset(): void {
    this.phase = 'lobby';
    this.currentTurn = null;
    this.winner = null;
    this.roundNumber++;
  }
}
