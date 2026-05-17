import type { AirConsoleAdapter } from '@/airconsole/AirConsoleAdapter';
import type { PlayerManager } from '@/state/PlayerManager';
import { Logger } from '@/utils/logger';

const log = new Logger('GameManager');
import { GameState } from '@/state/GameState';
import { ShipPlacer } from './ShipPlacer';
import { BattleEngine } from './BattleEngine';
import { TurnManager } from './TurnManager';
import { shipTallyAlive } from '@/utils/fleetTally';
import { randomSlot, createEmptyBoard } from '@/utils/helpers';
import type { PlaceShipAction, RotateShipAction, AttackCellAction, SunkShipInfo } from '@/types/Messages';
import type { PlayerSlot, Facing, Orientation, PlayerData, Board, PlacedShip } from '@/types/GameTypes';
import { GRID_SIZE } from '@/types/GameTypes';
import type Phaser from 'phaser';

export class GameManager {
  private readonly gameState = new GameState();
  private readonly turnManager = new TurnManager();
  private gameEvents: Phaser.Events.EventEmitter | null = null;
  private readonly placementConfirmed = new Set<PlayerSlot>();
  // Battle statistics
  private battleStartTime: number | null = null;
  private readonly shotsFired: [number, number] = [0, 0];   // [P0, P1]
  private readonly shipsScored: [number, number] = [0, 0];  // [P0, P1]

  constructor(
    private readonly adapter: AirConsoleAdapter,
    private readonly playerManager: PlayerManager,
  ) {}

  setGameEvents(emitter: Phaser.Events.EventEmitter): void {
    log.info('Phaser game.events emitter registered');
    this.gameEvents = emitter;
  }

  handleConnect(deviceId: number): void {
    const result = this.playerManager.handleConnect(deviceId);
    log.info(`handleConnect #${deviceId} — ${result}`);
    if (result === 'new' || result === 'reconnect') {
      // Broadcast to all registered players so opponent status updates everywhere
      this.broadcastStateUpdate();
      this.gameEvents?.emit('player-connected', deviceId);
    }
  }

  handleDisconnect(deviceId: number): void {
    log.warn(`handleDisconnect #${deviceId}`);
    this.playerManager.handleDisconnect(deviceId);
    this.gameEvents?.emit('player-disconnected', deviceId);
  }

  handleReady(deviceId: number): void {
    if (this.gameState.phase !== 'lobby') {
      log.warn(`READY ignored — phase is "${this.gameState.phase}"`);
      return;
    }
    const player = this.playerManager.getPlayer(deviceId);
    if (!player) return;
    log.info(`Player slot=${player.slot} is READY`);
    player.isReady = true;
    this.broadcastStateUpdate();

    if (this.playerManager.bothPlayersReady()) {
      this.startPlacement();
    }
  }

  handlePlaceShip(deviceId: number, action: PlaceShipAction): void {
    if (this.gameState.phase !== 'placement') return;
    const player = this.playerManager.getPlayer(deviceId);
    if (!player) return;

    const ship = player.board.ships.find(s => s.definition.id === action.shipId);
    if (!ship) return;

    // Compute the board WITHOUT this ship as a local variable — do NOT update
    // player.board.ownBoard yet. If canPlace fails, the board remains consistent
    // with ship.x / ship.y (old position), preventing another ship from occupying
    // the vacated cells and causing an overlap.
    const boardWithoutShip = ship.x >= 0
      ? ShipPlacer.removeShip(player.board.ownBoard, ship)
      : player.board.ownBoard;

    if (!ShipPlacer.canPlace(boardWithoutShip, ship.definition.length, action.x, action.y, action.orientation)) {
      this.syncPlayerState(deviceId);
      return;
    }

    ship.x = action.x;
    ship.y = action.y;
    ship.orientation = action.orientation;
    ship.facing = action.facing;
    player.board.ownBoard = ShipPlacer.placeShip(boardWithoutShip, ship, action.x, action.y, action.orientation);
    player.board.allShipsPlaced = player.board.ships.every(s => s.x >= 0);

    this.syncPlayerState(deviceId);
    this.gameEvents?.emit('ship-placed', { deviceId, slot: player.slot });
  }

  handleAutoPlace(deviceId: number): void {
    if (this.gameState.phase !== 'placement') return;
    const player = this.playerManager.getPlayer(deviceId);
    if (!player) return;

    // Create copies with all positions reset — never mutate player state before we know success
    const freshBoard = createEmptyBoard();
    const unplacedShips = player.board.ships.map(s => ({ ...s, x: -1, y: -1 }));

    const result = ShipPlacer.autoPlace(freshBoard, unplacedShips);
    if (!result) { this.syncPlayerState(deviceId); return; }

    player.board.ownBoard = result.board;
    player.board.ships = result.ships;
    player.board.allShipsPlaced = true;

    this.syncPlayerState(deviceId);
    this.gameEvents?.emit('ship-placed', { deviceId, slot: player.slot });
  }

  handleRotateShip(deviceId: number, action: RotateShipAction): void {
    if (this.gameState.phase !== 'placement') return;
    const player = this.playerManager.getPlayer(deviceId);
    if (!player) return;
    const ship = player.board.ships.find(s => s.definition.id === action.shipId);
    if (!ship) return;

    const nextFacing = rotateClockwise(ship.facing);
    const nextOrientation: Orientation = (nextFacing === 'right' || nextFacing === 'left') ? 'horizontal' : 'vertical';

    if (ship.x < 0) {
      ship.facing = nextFacing;
      ship.orientation = nextOrientation;
      this.syncPlayerState(deviceId);
      return;
    }

    const len = ship.definition.length;
    const tempBoard = ShipPlacer.removeShip(player.board.ownBoard, ship);

    // Clamp anchor so the rotated ship stays within grid bounds
    const anchorX = nextOrientation === 'horizontal' ? Math.min(ship.x, GRID_SIZE - len) : ship.x;
    const anchorY = nextOrientation === 'vertical'   ? Math.min(ship.y, GRID_SIZE - len) : ship.y;

    if (this.placeRotated(tempBoard, ship, anchorX, anchorY, len, nextOrientation, nextFacing, player)) {
      this.syncPlayerState(deviceId);
      return;
    }

    // Can't place at clamped anchor — restore and give up
    player.board.ownBoard = ShipPlacer.placeShip(tempBoard, ship, ship.x, ship.y, ship.orientation);
    this.syncPlayerState(deviceId);
  }

  private placeRotated(
    board: Board, ship: PlacedShip, startX: number, startY: number,
    len: number, orientation: Orientation, facing: Facing, player: PlayerData,
  ): boolean {
    const maxX = orientation === 'horizontal' ? GRID_SIZE - len : GRID_SIZE - 1;
    const maxY = orientation === 'vertical'   ? GRID_SIZE - len : GRID_SIZE - 1;

    // Find nearest valid position using Manhattan distance from clamped anchor
    let bestDist = Infinity;
    let bestX = -1, bestY = -1;
    for (let ty = 0; ty <= maxY; ty++) {
      for (let tx = 0; tx <= maxX; tx++) {
        if (ShipPlacer.canPlace(board, len, tx, ty, orientation)) {
          const dist = Math.abs(tx - startX) + Math.abs(ty - startY);
          if (dist < bestDist) { bestDist = dist; bestX = tx; bestY = ty; }
        }
      }
    }
    if (bestX < 0) return false;

    ship.orientation = orientation;
    ship.facing = facing;
    ship.x = bestX;
    ship.y = bestY;
    player.board.ownBoard = ShipPlacer.placeShip(board, ship, bestX, bestY, orientation);
    return true;
  }

  handleAttack(deviceId: number, action: AttackCellAction): void {
    if (this.gameState.phase !== 'battle') {
      log.warn(`ATTACK ignored — phase is "${this.gameState.phase}"`);
      return;
    }
    const attacker = this.playerManager.getPlayer(deviceId);
    if (!attacker) { log.warn(`ATTACK from unknown device #${deviceId}`); return; }
    if (!this.turnManager.isPlayerTurn(attacker.slot)) {
      log.warn(`ATTACK ignored — not P${attacker.slot}'s turn`);
      return;
    }

    const defenderSlot: PlayerSlot = attacker.slot === 0 ? 1 : 0;
    const defender = this.playerManager.getPlayerBySlot(defenderSlot);
    if (!defender) return;

    const cell = defender.board.ownBoard[action.y]?.[action.x];
    if (!cell || cell.state === 'hit' || cell.state === 'miss' || cell.state === 'sunk') return;

    log.info(`Attack (${action.x},${action.y}) by P${attacker.slot}`);
    const result = BattleEngine.processAttack(
      attacker.slot,
      defender.board.ownBoard,
      defender.board.ships,
      action.x,
      action.y,
    );

    defender.board.ownBoard = result.updatedBoard;
    defender.board.ships = result.updatedShips;
    this.shotsFired[attacker.slot]++;
    if (result.sunk) this.shipsScored[attacker.slot]++;

    if (result.sunk && result.shipId) {
      const sunkShip = result.updatedShips.find(s => s.definition.id === result.shipId);
      if (sunkShip) {
        const cells = ShipPlacer.getOccupiedCells(sunkShip.definition.length, sunkShip.x, sunkShip.y, sunkShip.orientation);
        // Mark ship cells as sunk on attacker's board
        for (const [cx, cy] of cells) {
          attacker.board.attackBoard[cy][cx] = { state: 'sunk', shipId: result.shipId };
        }
        // Auto-mark surrounding cells as miss — only if the defender's updated board
        // confirms those cells are truly empty (guards against any placement edge-case
        // where ships end up adjacent, which would otherwise block future attacks).
        for (const [cx, cy] of cells) {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = cx + dx, ny = cy + dy;
              if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
              if (
                attacker.board.attackBoard[ny][nx].state === 'empty' &&
                result.updatedBoard[ny][nx].state !== 'ship'
              ) {
                attacker.board.attackBoard[ny][nx] = { state: 'miss', shipId: null };
              }
            }
          }
        }
      }
    } else {
      attacker.board.attackBoard[action.y][action.x] = {
        state: result.hit ? 'hit' : 'miss',
        shipId: result.shipId,
      };
    }

    let sunkShipName: string | null = null;
    if (result.sunk && result.shipId) {
      const sunk = result.updatedShips.find(s => s.definition.id === result.shipId);
      sunkShipName = sunk?.definition.name ?? null;
    }

    const attackMsg = {
      type: 'ATTACK_RESULT' as const,
      x: action.x,
      y: action.y,
      hit: result.hit,
      sunk: result.sunk,
      shipId: result.shipId,
      sunkShipName,
      attackerSlot: attacker.slot,
    };

    this.adapter.broadcastToControllers(attackMsg);
    this.gameEvents?.emit('attack-result', { ...attackMsg, attackerSlot: attacker.slot });

    log.info(`Result: ${result.hit ? (result.sunk ? 'SUNK' : 'HIT') : 'MISS'} at (${action.x},${action.y})`);
    if (result.gameOver && result.winner !== null) {
      this.endGame(result.winner);
    } else {
      if (!result.hit) this.turnManager.advance();
      this.broadcastStateUpdate();
    }
  }

  handleConfirmPlacement(deviceId: number): void {
    if (this.gameState.phase !== 'placement') return;
    const player = this.playerManager.getPlayer(deviceId);
    if (!player || !player.board.allShipsPlaced) return;
    log.info(`Player slot=${player.slot} confirmed placement`);
    this.placementConfirmed.add(player.slot);
    if (this.placementConfirmed.size === 2) {
      this.startBattle();
    }
  }

  handleRestart(_deviceId: number): void {
    if (this.gameState.phase !== 'result') return;
    this.reset();
  }

  syncPlayerState(deviceId: number): void {
    this.sendStateToPlayer(deviceId);
  }

  getPhase() { return this.gameState.phase; }
  getCurrentTurn() { return this.gameState.phase === 'battle' ? this.turnManager.getCurrent() : null; }
  getWinner() { return this.gameState.winner; }

  private startPlacement(): void {
    log.info('Phase → placement');
    this.gameState.startPlacement();
    this.gameEvents?.emit('phase-change', 'placement');
    this.broadcastStateUpdate();
  }

  private startBattle(): void {
    const firstTurn = randomSlot();
    log.info(`Phase → battle, first turn: P${firstTurn}`);
    // Activate both players now that both are confirmed in game.
    // Calling setActivePlayers earlier (on connect) would cause SDK v1.9.0
    // silence_inactive_players to silently block the second player's onConnect.
    this.adapter.activatePlayers();
    this.turnManager.reset(firstTurn);
    this.gameState.startBattle(firstTurn);
    this.battleStartTime = Date.now();
    this.shotsFired[0] = 0; this.shotsFired[1] = 0;
    this.shipsScored[0] = 0; this.shipsScored[1] = 0;
    this.gameEvents?.emit('phase-change', 'battle');
    this.broadcastStateUpdate();
  }

  private endGame(winner: PlayerSlot): void {
    log.info(`Phase → result, winner: P${winner}`);
    this.gameState.endGame(winner);
    const durationSecs = this.battleStartTime
      ? Math.round((Date.now() - this.battleStartTime) / 1000)
      : 0;
    this.adapter.broadcastToControllers({
      type: 'GAME_OVER',
      winner,
      stats: {
        shotsFired: [...this.shotsFired] as [number, number],
        shipsScored: [...this.shipsScored] as [number, number],
        durationSecs,
      },
    });
    this.gameEvents?.emit('phase-change', 'result');
    this.gameEvents?.emit('game-over', winner);
  }

  private reset(): void {
    log.info('Phase → lobby (restart)');
    this.playerManager.reset();
    this.gameState.reset();
    this.battleStartTime = null;
    this.shotsFired[0] = 0; this.shotsFired[1] = 0;
    this.shipsScored[0] = 0; this.shipsScored[1] = 0;
    this.turnManager.reset();
    this.placementConfirmed.clear();
    this.gameEvents?.emit('phase-change', 'lobby');
    this.broadcastStateUpdate();
  }

  private broadcastStateUpdate(): void {
    const [p0, p1] = this.playerManager.getBothPlayers();
    if (p0) this.sendStateToPlayer(p0.deviceId);
    if (p1) this.sendStateToPlayer(p1.deviceId);
  }

  private sendStateToPlayer(deviceId: number): void {
    const player = this.playerManager.getPlayer(deviceId);
    if (!player) return;

    const defenderSlot: PlayerSlot = player.slot === 0 ? 1 : 0;
    const defender = this.playerManager.getPlayerBySlot(defenderSlot);
    const opponentShipsRemaining = defender
      ? defender.board.ships.filter(s => !s.isSunk).length
      : 0;

    const unplacedShipIds = player.board.ships
      .filter(s => s.x < 0)
      .map(s => s.definition.id);

    const opponentShipTally = defender ? shipTallyAlive(defender.board.ships) : [];
    const ownShipTally = shipTallyAlive(player.board.ships);
    const sunkEnemyShips: SunkShipInfo[] = defender
      ? defender.board.ships
          .filter(s => s.isSunk && s.x >= 0)
          .map(s => ({ id: s.definition.id, x: s.x, y: s.y, length: s.definition.length, orientation: s.orientation, facing: s.facing }))
      : [];

    const yourTurn = this.turnManager.isPlayerTurn(player.slot);
    const TURN_SECONDS = 30;
    this.adapter.sendToController(deviceId, {
      type: 'STATE_UPDATE',
      phase: this.gameState.phase,
      playerSlot: player.slot,
      yourTurn,
      ...(this.gameState.phase === 'battle' && yourTurn
        ? { turnDeadline: Date.now() + TURN_SECONDS * 1000 }
        : {}),
      ownBoard: player.board.ownBoard,
      attackBoard: player.board.attackBoard,
      ships: player.board.ships,
      opponentShipsRemaining,
      opponentShipTally,
      ownShipTally,
      unplacedShipIds,
      sunkEnemyShips,
      opponentConnected: defender?.isConnected ?? false,
      opponentReady: defender?.isReady ?? false,
    });
  }
}

const FACING_CYCLE: Facing[] = ['right', 'down', 'left', 'up'];
function rotateClockwise(facing: Facing): Facing {
  return FACING_CYCLE[(FACING_CYCLE.indexOf(facing) + 1) % 4];
}

