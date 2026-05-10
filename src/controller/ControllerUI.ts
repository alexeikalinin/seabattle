import '@/types/AirConsoleTypes';
import type { ScreenMessage, StateUpdateMessage, AttackResultMessage, GameOverMessage } from '@/types/Messages';
import type { PlayerSlot, Board, CellState, Facing } from '@/types/GameTypes';
import { GRID_SIZE } from '@/types/GameTypes';
import { formatShipTally } from '@/utils/fleetTally';
import { ProceduralAudio } from '@/ui/ProceduralAudio';
import { ShipRenderer } from './ShipRenderer';

type ViewId = 'lobby' | 'placement' | 'battle-turn' | 'battle-wait' | 'result';

export class ControllerUI {
  private playerSlot: PlayerSlot | null = null;
  private selectedShipId: string | null = null;
  private currentFacing: Facing = 'right';
  private lastState: StateUpdateMessage | null = null;
  private readonly audio = new ProceduralAudio();
  private renderers: Record<string, ShipRenderer> = {};
  // Per-game flags — reset when phase transitions back to lobby (restart)
  private isReadyThisGame = false;
  private lastPhase: string | null = null;

  constructor(private readonly ac: AirConsole) {}

  init(): void {
    this.buildDOM();
    this.showView('lobby');
  }

  handleScreenMessage(data: unknown): void {
    if (!isScreenMessage(data)) return;
    switch (data.type) {
      case 'STATE_UPDATE':   this.onStateUpdate(data); break;
      case 'ATTACK_RESULT':  this.onAttackResult(data); break;
      case 'GAME_OVER':      this.onGameOver(data); break;
    }
  }

  // ── Message handlers ──────────────────────────────────────────────────

  private onStateUpdate(msg: StateUpdateMessage): void {
    this.playerSlot = msg.playerSlot;
    this.lastState = msg;

    // Detect transition back to lobby (restart) — reset per-game flags
    if (msg.phase === 'lobby' && this.lastPhase !== null && this.lastPhase !== 'lobby') {
      this.isReadyThisGame = false;
      this.selectedShipId = null;
      this.currentFacing = 'right';
    }
    this.lastPhase = msg.phase;

    this.updatePlayerBadge();

    switch (msg.phase) {
      case 'lobby':
        this.renderLobby(msg);
        this.showView('lobby');
        break;
      case 'placement':
        this.renderPlacement(msg);
        this.showView('placement');
        break;
      case 'battle':
        if (msg.yourTurn) {
          this.renderBattleTurn(msg);
          this.showView('battle-turn');
        } else {
          this.renderBattleWait(msg);
          this.showView('battle-wait');
        }
        break;
      case 'result':
        // result is handled by GAME_OVER message
        break;
    }
  }

  private onAttackResult(msg: AttackResultMessage): void {
    if (msg.sunk) {
      this.audio.playSunk();
      const toast = document.getElementById('global-toast');
      if (toast) {
        const name = msg.sunkShipName ? `${msg.sunkShipName} ` : '';
        toast.textContent = `⚓ ${name}SUNK!`;
        toast.classList.add('visible');
        window.setTimeout(() => toast.classList.remove('visible'), 3200);
      }
    } else if (msg.hit) {
      this.audio.playHit();
    } else {
      this.audio.playMiss();
    }

    if (msg.hit) {
      document.body.classList.add('hit-flash');
      setTimeout(() => document.body.classList.remove('hit-flash'), 400);
    }
  }

  private onGameOver(msg: GameOverMessage): void {
    const didWin = msg.winner === this.playerSlot;
    if (didWin) this.audio.playVictory(); else this.audio.playDefeat();
    this.renderResult(didWin);
    this.showView('result');
  }

  // ── View renderers ─────────────────────────────────────────────────────

  private renderLobby(msg: StateUpdateMessage): void {
    const slotName = `PLAYER ${(msg.playerSlot ?? 0) + 1}`;
    const color = msg.playerSlot === 0 ? 'var(--accent)' : 'var(--accent2)';
    qs('#lobby-slot-name').textContent = slotName;
    (qs('#lobby-slot-name') as HTMLElement).style.color = color;

    const youEl = document.getElementById('lobby-you-status');
    const oppEl = document.getElementById('lobby-opp-status');
    if (youEl) {
      youEl.textContent = '● Joining...';
      youEl.className = 'pstatus';
    }
    if (oppEl) {
      if (msg.opponentConnected) {
        oppEl.textContent = msg.opponentReady ? '✓ Ready!' : '● Joining...';
        oppEl.className = msg.opponentReady ? 'pstatus ready' : 'pstatus';
      } else {
        oppEl.textContent = '○ Waiting';
        oppEl.className = 'pstatus dim';
      }
    }

    // Reset READY button only when entering lobby fresh (after restart)
    if (!this.isReadyThisGame) {
      const readyBtn = document.getElementById('ready-btn') as HTMLButtonElement | null;
      if (readyBtn) {
        readyBtn.disabled = false;
        readyBtn.textContent = '⚓ READY TO BATTLE';
        readyBtn.style.opacity = '1';
      }
    }
  }

  private renderPlacement(msg: StateUpdateMessage): void {
    // Ship selector
    const selector = qs('#ship-selector');
    selector.innerHTML = '';

    for (const shipId of msg.unplacedShipIds) {
      const ship = msg.ships.find(s => s.definition.id === shipId);
      if (!ship) continue;

      const btn = document.createElement('button');
      btn.className = 'ship-btn btn';
      if (shipId === this.selectedShipId) btn.classList.add('selected');
      btn.dataset['shipId'] = shipId;

      const segs = document.createElement('div');
      segs.className = 'ship-segments';
      for (let i = 0; i < ship.definition.length; i++) {
        const seg = document.createElement('div');
        seg.className = 'ship-seg';
        segs.appendChild(seg);
      }

      const label = document.createElement('span');
      label.textContent = `${ship.definition.name} (${ship.definition.length})`;

      btn.appendChild(segs);
      btn.appendChild(label);
      btn.addEventListener('click', () => {
        if (shipId === this.selectedShipId) {
          // Tap same ship again = rotate
          this.rotateSelectedShip();
        } else {
          this.selectShip(shipId);
        }
      });
      selector.appendChild(btn);
    }

    // Already-placed ships info
    const placed = msg.ships.filter(s => s.x >= 0).length;
    const total = msg.ships.length;
    qs('#placement-progress').textContent = `${placed} / ${total} placed`;

    const selectorLabel = document.getElementById('ship-selector-label');
    if (selectorLabel) {
      selectorLabel.textContent = msg.unplacedShipIds.length === 0
        ? '✓ All ships placed!'
        : 'Select Ship (unplaced)';
    }

    if (this.selectedShipId) {
      const sh = msg.ships.find(s => s.definition.id === this.selectedShipId);
      if (sh) this.currentFacing = sh.facing;
    }

    // Render own board in placement grid
    this.updateGrid('placement-grid', msg.ownBoard, true);
    this.renderers['placement-grid']?.renderFleet(msg.ships);
    this.highlightPlacementSelection(msg);
    this.updateRotateBtnLabel();

    // Show "GO TO BATTLE" button only when all ships are placed; reset if re-entering placement
    const goBtn = document.getElementById('go-to-battle-btn') as HTMLButtonElement | null;
    if (goBtn) {
      const allPlaced = msg.unplacedShipIds.length === 0;
      goBtn.style.display = allPlaced ? 'block' : 'none';
      if (!allPlaced) {
        goBtn.disabled = false;
        goBtn.textContent = '⚔ GO TO BATTLE!';
        goBtn.style.opacity = '1';
      }
    }
  }

  private renderBattleTurn(msg: StateUpdateMessage): void {
    qs('#ships-left').textContent = String(msg.opponentShipsRemaining);
    this.updateGrid('own-battle-grid', msg.ownBoard, true);
    this.renderers['own-battle-grid']?.renderFleet(msg.ships);
    this.updateGrid('attack-grid', msg.attackBoard, false);
    this.renderers['attack-grid']?.renderSunkEnemies(msg.sunkEnemyShips);
    this.renderFleetTally('fleet-tally-turn', msg);
  }

  private renderBattleWait(msg: StateUpdateMessage): void {
    qs('#wait-ships-left').textContent = String(msg.opponentShipsRemaining);
    this.updateGrid('own-wait-grid', msg.ownBoard, true);
    this.renderers['own-wait-grid']?.renderFleet(msg.ships);
    this.updateGrid('attack-wait-grid', msg.attackBoard, false);
    this.renderers['attack-wait-grid']?.renderSunkEnemies(msg.sunkEnemyShips);
    this.renderFleetTally('fleet-tally-wait', msg);
  }

  private renderFleetTally(elementId: string, msg: StateUpdateMessage): void {
    const el = document.getElementById(elementId);
    if (!el) return;
    const opp = formatShipTally(msg.opponentShipTally);
    const own = formatShipTally(msg.ownShipTally);
    el.innerHTML =
      `<div class="tally-line"><span class="tally-tag">Enemy</span> ${opp}</div>` +
      `<div class="tally-line"><span class="tally-tag">You</span> ${own}</div>`;
  }

  private renderResult(didWin: boolean): void {
    const banner = qs('#result-banner') as HTMLElement;
    banner.className = `status-banner ${didWin ? 'win' : 'lose'}`;
    banner.textContent = didWin ? '🏆 VICTORY!' : '💥 DEFEAT';
    qs('#result-subtitle').textContent = didWin
      ? 'You sunk the enemy fleet!'
      : 'Your fleet was destroyed.';
  }

  // ── Grid rendering ─────────────────────────────────────────────────────

  private highlightPlacementSelection(msg: StateUpdateMessage): void {
    const cells = qs('#placement-grid').querySelectorAll('.grid-cell');
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const idx = row * GRID_SIZE + col;
        const el = cells[idx] as HTMLElement | undefined;
        if (!el) continue;
        const sid = msg.ownBoard[row][col].shipId;
        const on = this.selectedShipId !== null && sid === this.selectedShipId;
        el.classList.toggle('ship-picked', on);
      }
    }
  }

  private updateRotateBtnLabel(): void {
    const btn = document.getElementById('rotate-btn') as HTMLButtonElement | null;
    if (!btn) return;
    const labels: Record<Facing, string> = {
      right: '→ Facing Right',
      down:  '↓ Facing Down',
      left:  '← Facing Left',
      up:    '↑ Facing Up',
    };
    btn.textContent = labels[this.currentFacing];
  }

  private updateGrid(containerId: string, board: Board, isOwnBoard: boolean): void {
    const container = qs(`#${containerId}`);
    const cells = container.querySelectorAll('.grid-cell');

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const idx = row * GRID_SIZE + col;
        const cellEl = cells[idx] as HTMLElement | undefined;
        if (!cellEl) continue;
        const state: CellState = board[row][col].state;
        cellEl.className = 'grid-cell';
        if (state !== 'empty') cellEl.classList.add(state);
        if (isOwnBoard && state === 'empty') cellEl.style.cursor = 'default';
      }
    }
  }

  private buildGrid(containerId: string, onTap?: (col: number, row: number) => void): void {
    const container = qs(`#${containerId}`);
    container.innerHTML = '';

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'grid-cell';
        if (onTap) {
          cell.addEventListener('click', () => onTap(col, row));
        } else {
          cell.style.cursor = 'default';
          cell.tabIndex = -1;
        }
        container.appendChild(cell);
      }
    }

    // Ships layer
    const layer = document.createElement('div');
    layer.className = 'ships-layer';
    container.appendChild(layer);
    this.renderers[containerId] = new ShipRenderer(layer);

    // Row labels A-J, absolutely positioned to the left of the grid
    const rowLabels = document.createElement('div');
    rowLabels.className = 'grid-row-labels';
    rowLabels.setAttribute('aria-hidden', 'true');
    'ABCDEFGHIJ'.split('').forEach(letter => {
      const s = document.createElement('span');
      s.textContent = letter;
      rowLabels.appendChild(s);
    });
    container.appendChild(rowLabels);
  }

  private rotateSelectedShip(): void {
    if (!this.selectedShipId) return;
    this.ac.message(this.ac.SCREEN, { type: 'ROTATE_SHIP', shipId: this.selectedShipId });
    const cycle: Facing[] = ['right', 'down', 'left', 'up'];
    this.currentFacing = cycle[(cycle.indexOf(this.currentFacing) + 1) % 4];
    this.updateRotateBtnLabel();
  }

  // ── Ship selection ─────────────────────────────────────────────────────

  private selectShip(shipId: string): void {
    this.selectedShipId = shipId;
    const ship = this.lastState?.ships.find(s => s.definition.id === shipId);
    if (ship) this.currentFacing = ship.facing;
    document.querySelectorAll('.ship-btn').forEach(b => b.classList.remove('selected'));
    document.querySelector(`[data-ship-id="${shipId}"]`)?.classList.add('selected');
    if (this.lastState?.phase === 'placement') {
      this.highlightPlacementSelection(this.lastState);
      this.updateRotateBtnLabel();
    }
  }

  // ── View switching ─────────────────────────────────────────────────────

  private showView(view: ViewId): void {
    document.querySelectorAll<HTMLElement>('.view').forEach(v => v.classList.remove('active'));
    const el = document.getElementById(`view-${view}`);
    if (el) el.classList.add('active');
  }

  private updatePlayerBadge(): void {
    if (this.playerSlot === null) return;
    const badge = document.getElementById('player-badge');
    if (!badge) return;
    badge.textContent = `PLAYER ${this.playerSlot + 1}`;
    badge.className = `player-badge p${this.playerSlot + 1}`;
  }

  // ── DOM builder ───────────────────────────────────────────────────────

  private buildDOM(): void {
    const colLabels = Array.from({length: 10}, (_, i) => `<div class="grid-col-label">${i + 1}</div>`).join('');
    const root = document.getElementById('controller-root')!;
    root.innerHTML = `
      <div id="player-badge"></div>
      <div id="global-toast" class="global-toast" role="status" aria-live="polite"></div>

      <!-- LOBBY -->
      <div id="view-lobby" class="view">
        <div class="game-title" style="margin-top:24px">BATTLESHIP<br/>DUEL</div>

        <div class="card" style="margin-top:4px">
          <div class="section-label">Your Slot</div>
          <div id="lobby-slot-name" style="font-size:1.6rem;font-family:'Sora',sans-serif;font-weight:800;color:var(--accent);text-align:center;padding:4px 0">—</div>
        </div>

        <div class="card">
          <div class="section-label">Lobby Status</div>
          <div class="player-row" style="max-width:100%">
            <div class="player-tile you"><div class="pname">YOU</div><div class="pstatus" id="lobby-you-status">● Joining...</div></div>
            <div class="player-tile opp"><div class="pname">OPPONENT</div><div class="pstatus dim" id="lobby-opp-status">○ Waiting</div></div>
          </div>
        </div>

        <button id="ready-btn" class="btn btn-primary">⚓ READY TO BATTLE</button>
        <p class="pulse" style="font-size:.72rem;color:var(--text-dim);text-align:center">Tap when ready to start</p>
      </div>

      <!-- PLACEMENT: grid first on small screens so it stays visible; ships scroll below -->
      <div id="view-placement" class="view view-placement">
        <div class="placement-title">DEPLOY FLEET</div>
        <p id="placement-progress" class="placement-progress">0 / 10 placed</p>
        <p class="placement-hint">Tap a ship to select it → tap grid to place. Tap a selected ship again to rotate. Tap a placed ship to move it.</p>

        <div class="btn-row">
          <button type="button" class="btn-half" id="rotate-btn">↻ Rotate (H)</button>
          <button type="button" class="btn-half" id="auto-place-btn">🎲 Auto</button>
        </div>

        <div class="placement-main">
          <div class="card card-grid">
            <div class="section-label">Your Grid</div>
            <div class="grid-header">${colLabels}</div>
            <div id="placement-grid" class="grid" aria-label="Fleet placement grid"></div>
          </div>

          <div class="card card-ships">
            <div class="section-label" id="ship-selector-label">Select Ship (unplaced)</div>
            <div id="ship-selector"></div>
          </div>
        </div>
        <button type="button" id="go-to-battle-btn" class="btn btn-primary" style="display:none;margin-top:12px">⚔ GO TO BATTLE!</button>
      </div>

      <!-- BATTLE — YOUR TURN -->
      <div id="view-battle-turn" class="view view-battle">
        <div class="status-banner your-turn pulse" style="margin-top:16px">⚡ YOUR TURN — FIRE!</div>
        <div class="ships-counter">Enemy ships remaining: <strong id="ships-left">?</strong></div>
        <div id="fleet-tally-turn" class="fleet-tally"></div>
        <div class="battle-grids">
          <div class="card card-battle">
            <div class="section-label">Your Fleet</div>
            <div class="grid-header battle-h">${colLabels}</div>
            <div id="own-battle-grid" class="grid grid--compact"></div>
          </div>
          <div class="card card-battle">
            <div class="section-label">Enemy Waters — Tap to Fire</div>
            <div class="grid-header battle-h">${colLabels}</div>
            <div id="attack-grid" class="grid grid--compact"></div>
          </div>
        </div>
      </div>

      <!-- BATTLE — WAITING -->
      <div id="view-battle-wait" class="view view-battle">
        <div class="status-banner waiting pulse" style="margin-top:16px">⏳ OPPONENT'S TURN</div>
        <div class="ships-counter">Enemy ships remaining: <strong id="wait-ships-left">?</strong></div>
        <div id="fleet-tally-wait" class="fleet-tally"></div>
        <div class="battle-grids">
          <div class="card card-battle">
            <div class="section-label">Your Fleet</div>
            <div class="grid-header battle-h">${colLabels}</div>
            <div id="own-wait-grid" class="grid grid--compact"></div>
          </div>
          <div class="card card-battle">
            <div class="section-label">Your Hits</div>
            <div class="grid-header battle-h">${colLabels}</div>
            <div id="attack-wait-grid" class="grid grid--compact"></div>
          </div>
        </div>
        <p style="font-size:.78rem;color:var(--text-dim);text-align:center">Waiting for opponent's turn…</p>
      </div>

      <!-- RESULT -->
      <div id="view-result" class="view">
        <div style="margin-top:40px"></div>
        <div id="result-banner" class="status-banner win">—</div>
        <p id="result-subtitle" style="font-size:.8rem;color:var(--text-dim);text-align:center"></p>
        <button id="restart-btn" class="btn btn-primary" style="margin-top:32px">⚓ PLAY AGAIN</button>
      </div>
    `;

    this.buildGrid('placement-grid', (col, row) => this.onPlacementTap(col, row));
    this.buildGrid('own-battle-grid');
    this.buildGrid('attack-grid', (col, row) => this.onAttackTap(col, row));
    this.buildGrid('own-wait-grid');
    this.buildGrid('attack-wait-grid');

    qs('#ready-btn').addEventListener('click', () => {
      this.audio.playReady();
      this.isReadyThisGame = true;
      this.ac.message(this.ac.SCREEN, { type: 'READY' });
      (qs('#ready-btn') as HTMLButtonElement).disabled = true;
      (qs('#ready-btn') as HTMLButtonElement).textContent = '✓ READY!';
      (qs('#ready-btn') as HTMLButtonElement).style.opacity = '0.7';
    });

    qs('#rotate-btn').addEventListener('click', () => {
      if (this.selectedShipId) {
        this.rotateSelectedShip();
      } else {
        const cycle: Facing[] = ['right', 'down', 'left', 'up'];
        this.currentFacing = cycle[(cycle.indexOf(this.currentFacing) + 1) % 4];
        this.updateRotateBtnLabel();
      }
    });

    qs('#auto-place-btn').addEventListener('click', () => {
      this.autoPlaceShips();
    });

    qs('#go-to-battle-btn').addEventListener('click', () => {
      const btn = document.getElementById('go-to-battle-btn') as HTMLButtonElement;
      btn.disabled = true;
      btn.textContent = '✓ READY FOR BATTLE!';
      btn.style.opacity = '0.7';
      this.ac.message(this.ac.SCREEN, { type: 'CONFIRM_PLACEMENT' });
    });

    qs('#restart-btn').addEventListener('click', () => {
      this.ac.message(this.ac.SCREEN, { type: 'RESTART_GAME' });
    });

    const badge = document.getElementById('player-badge');
    if (badge) badge.style.display = 'block';
  }

  private onPlacementTap(col: number, row: number): void {
    if (!this.lastState || this.lastState.phase !== 'placement') return;
    const cell = this.lastState.ownBoard[row]?.[col];
    if (!cell) return;

    if (cell.state === 'ship' && cell.shipId) {
      if (cell.shipId === this.selectedShipId) {
        // Tap same selected ship on grid = rotate it in place
        this.rotateSelectedShip();
      } else {
        this.selectShip(cell.shipId);
      }
      return;
    }

    if (!this.selectedShipId) return;

    this.audio.playPlaceShip();
    this.ac.message(this.ac.SCREEN, {
      type: 'PLACE_SHIP',
      shipId: this.selectedShipId,
      x: col,
      y: row,
      orientation: (this.currentFacing === 'right' || this.currentFacing === 'left') ? 'horizontal' : 'vertical',
      facing: this.currentFacing,
    });
  }

  private onAttackTap(col: number, row: number): void {
    if (!this.lastState) return;
    const cell = this.lastState.attackBoard[row]?.[col];
    if (cell && cell.state !== 'empty') return;
    this.audio.playShot();
    this.ac.message(this.ac.SCREEN, { type: 'ATTACK_CELL', x: col, y: row });
  }

  private autoPlaceShips(): void {
    this.ac.message(this.ac.SCREEN, { type: 'AUTO_PLACE' });
  }
}

function qs(selector: string): Element {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  return el;
}

function isScreenMessage(data: unknown): data is ScreenMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    typeof (data as Record<string, unknown>).type === 'string'
  );
}
