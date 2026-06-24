import type { PlacedShip, Facing } from '@/types/GameTypes';
import type { SunkShipInfo } from '@/types/Messages';

export class ShipRenderer {
  private readonly layer: HTMLElement;

  constructor(layer: HTMLElement) {
    this.layer = layer;
  }

  /** Render own fleet — all placed ships with full detail. */
  renderFleet(ships: PlacedShip[]): void {
    this.layer.innerHTML = '';
    for (const ship of ships) {
      if (ship.x < 0) continue;
      this.layer.appendChild(this.makeEl(ship.x, ship.y, ship.definition.length, ship.facing, ship.isSunk));
    }
  }

  /** Render only fully-sunk enemy ships on the attack grid. */
  renderSunkEnemies(ships: SunkShipInfo[]): void {
    this.layer.innerHTML = '';
    for (const s of ships) {
      this.layer.appendChild(this.makeEl(s.x, s.y, s.length, s.facing, true));
    }
  }

  private makeEl(
    x: number, y: number, length: number,
    facing: Facing,
    isSunk: boolean,
  ): HTMLElement {
    const div = document.createElement('div');
    div.style.cssText = 'position:absolute;pointer-events:none;z-index:2;';

    // All ships render as a horizontal SVG (bow on right).
    // CSS transform rotates the element to match the actual facing.
    // Each trick keeps the element visually occupying the correct grid cells.
    if (facing === 'right') {
      // Standard horizontal: left→right
      div.style.left   = `${x * 10}%`;
      div.style.top    = `${y * 10}%`;
      div.style.width  = `${length * 10}%`;
      div.style.height = '10%';
    } else if (facing === 'down') {
      // Rotate 90° CW around top-left of a div shifted one cell right.
      // Result occupies column x, rows y…y+length-1.
      div.style.left            = `${(x + 1) * 10}%`;
      div.style.top             = `${y * 10}%`;
      div.style.width           = `${length * 10}%`;
      div.style.height          = '10%';
      div.style.transformOrigin = 'top left';
      div.style.transform       = 'rotate(90deg)';
    } else if (facing === 'left') {
      // 180° around center — same cells as 'right', bow now on the left.
      div.style.left            = `${x * 10}%`;
      div.style.top             = `${y * 10}%`;
      div.style.width           = `${length * 10}%`;
      div.style.height          = '10%';
      div.style.transformOrigin = '50% 50%';
      div.style.transform       = 'rotate(180deg)';
    } else {
      // 'up' — rotate -90° CW (CCW) around top-left of a div placed at bottom of cells.
      // Result occupies column x, rows y…y+length-1, bow facing up.
      div.style.left            = `${x * 10}%`;
      div.style.top             = `${(y + length) * 10}%`;
      div.style.width           = `${length * 10}%`;
      div.style.height          = '10%';
      div.style.transformOrigin = 'top left';
      div.style.transform       = 'rotate(-90deg)';
    }

    const stroke = isSunk ? '#ff3333' : '#00d4ff';
    const filterVal = isSunk
      ? 'drop-shadow(0 0 10px rgba(255,30,30,.65)) saturate(0.22) brightness(0.6)'
      : 'drop-shadow(0 0 7px rgba(0,212,255,.6))';
    const sunkMark = isSunk
      ? `<text x="${length * 50}" y="62" text-anchor="middle" font-size="26" fill="#ff4444" font-weight="bold" opacity="0.88">✕</text>`
      : '';
    const sinkLine = isSunk
      ? `<line x1="14" y1="48" x2="${length * 100 - 18}" y2="56" stroke="rgba(255,50,50,.22)" stroke-width="1.5"/>`
      : '';

    div.innerHTML = `<svg style="width:100%;height:100%;filter:${filterVal};overflow:visible"
      viewBox="0 0 ${length * 100} 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      ${ShipRenderer.paths(length, stroke, isSunk)}
      ${sinkLine}${sunkMark}
    </svg>`;

    return div;
  }

  // ── SVG path template: fighter jet — fuselage, delta wings, nose cannons, engine glow ──
  private static paths(len: number, s: string, sunk: boolean): string {
    const h = sunk ? `rgba(175,12,12,0.32)` : `rgba(0,150,220,0.16)`;   // fuselage fill
    const b = sunk ? `rgba(175,12,12,0.30)` : `rgba(0,200,255,0.3)`;    // canopy fill
    const w = sunk ? `rgba(170,12,12,0.22)` : `rgba(0,150,220,0.14)`;   // wing fill
    const bow = sunk ? `rgba(200,20,20,0.45)` : `rgba(0,212,255,0.45)`; // engine glow

    const W = len * 100;
    const tailX = 10;
    const noseX = W - 8;
    const wingRootX = W * 0.40;
    const wingTipX = W * 0.62;
    const wingBackX = W * 0.72;
    const wingForeX = W * 0.52;
    const canopyX = W * 0.66;
    const canopyR = 7 + len;
    const gunLen = 30 + len * 3;
    const gunStartX = noseX - 30;
    const gunW = 3 + len * 0.8;
    const engineR = 4 + len * 1.2;

    return `
      <!-- Fuselage -->
      <path d="M ${tailX},50 L ${wingRootX},38 L ${noseX},50 L ${wingRootX},62 Z" fill="${h}" stroke="${s}" stroke-width="2.5"/>
      <!-- Delta wings -->
      <path d="M ${wingRootX},44 L ${wingTipX},8 L ${wingBackX},24 L ${wingForeX},46 Z" fill="${w}" stroke="${s}" stroke-width="1.8"/>
      <path d="M ${wingRootX},56 L ${wingTipX},92 L ${wingBackX},76 L ${wingForeX},54 Z" fill="${w}" stroke="${s}" stroke-width="1.8"/>
      <!-- Canopy -->
      <ellipse cx="${canopyX}" cy="50" rx="${canopyR}" ry="7" fill="${b}" stroke="${s}" stroke-width="1.4"/>
      <!-- Twin nose cannons -->
      <rect x="${gunStartX}" y="${50 - 9}" width="${gunLen}" height="${gunW}" fill="${s}"/>
      <rect x="${gunStartX}" y="${50 + 9 - gunW}" width="${gunLen}" height="${gunW}" fill="${s}"/>
      <!-- Engine glow -->
      <circle cx="${tailX - 4}" cy="50" r="${engineR}" fill="${bow}"/>`;
  }
}
