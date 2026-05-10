import type { PlayerData, PlayerSlot } from '@/types/GameTypes';
import type { AirConsoleAdapter } from '@/airconsole/AirConsoleAdapter';
import { createEmptyBoard } from '@/utils/helpers';
import { FLEET_CONFIG } from '@/types/GameTypes';
import { Logger } from '@/utils/logger';

const log = new Logger('PlayerManager');

function makeInitialBoard() {
  return {
    ownBoard: createEmptyBoard(),
    attackBoard: createEmptyBoard(),
    ships: FLEET_CONFIG.map(def => ({
      definition: def,
      x: -1,
      y: -1,
      orientation: 'horizontal' as const,
      facing: 'right' as const,
      hits: 0,
      isSunk: false,
    })),
    allShipsPlaced: false,
  };
}

export class PlayerManager {
  private readonly players = new Map<number, PlayerData>();
  private readonly slotMap = new Map<PlayerSlot, number>();

  constructor(private readonly adapter: AirConsoleAdapter) {}

  handleConnect(deviceId: number): 'new' | 'reconnect' | 'spectator' {
    const existing = this.players.get(deviceId);
    if (existing) {
      existing.isConnected = true;
      existing.nickname = this.adapter.getNickname(deviceId) || existing.nickname;
      log.info(`Reconnect: device #${deviceId} → slot ${existing.slot}`);
      return 'reconnect';
    }

    const slot = this.assignSlot(deviceId);
    if (slot === null) {
      log.warn(`Device #${deviceId} ignored — both slots taken (spectator)`);
      return 'spectator';
    }

    const nickname = this.adapter.getNickname(deviceId) || `Player ${slot + 1}`;
    const playerData: PlayerData = {
      deviceId,
      slot,
      nickname,
      isReady: false,
      isConnected: true,
      board: makeInitialBoard(),
    };

    this.players.set(deviceId, playerData);
    this.slotMap.set(slot, deviceId);
    log.info(`New player: device #${deviceId} → slot ${slot}`);
    // Do NOT call setActivePlayers here — calling it before both players connect
    // causes SDK v1.9.0 silence_inactive_players to block the second player's onConnect.
    // setActivePlayers is called in GameManager.startBattle() instead.
    return 'new';
  }

  handleDisconnect(deviceId: number): void {
    const player = this.players.get(deviceId);
    if (player) {
      player.isConnected = false;
      log.warn(`Player slot=${player.slot} disconnected`);
    }
  }

  getPlayer(deviceId: number): PlayerData | undefined {
    return this.players.get(deviceId);
  }

  getPlayerBySlot(slot: PlayerSlot): PlayerData | undefined {
    const deviceId = this.slotMap.get(slot);
    return deviceId !== undefined ? this.players.get(deviceId) : undefined;
  }

  isRegisteredPlayer(deviceId: number): boolean {
    return this.players.has(deviceId);
  }

  getBothPlayers(): [PlayerData | null, PlayerData | null] {
    return [
      this.getPlayerBySlot(0) ?? null,
      this.getPlayerBySlot(1) ?? null,
    ];
  }

  bothPlayersConnected(): boolean {
    return (
      this.players.size === 2 &&
      [...this.players.values()].every(p => p.isConnected)
    );
  }

  bothPlayersReady(): boolean {
    return (
      this.players.size === 2 &&
      [...this.players.values()].every(p => p.isReady)
    );
  }

  bothPlayersPlaced(): boolean {
    return (
      this.players.size === 2 &&
      [...this.players.values()].every(p => p.board.allShipsPlaced)
    );
  }

  reset(): void {
    for (const player of this.players.values()) {
      player.isReady = false;
      player.board = makeInitialBoard();
    }
  }

  private assignSlot(deviceId: number): PlayerSlot | null {
    if (!this.slotMap.has(0)) { this.slotMap.set(0, deviceId); return 0; }
    if (!this.slotMap.has(1)) { this.slotMap.set(1, deviceId); return 1; }
    return null;
  }
}
