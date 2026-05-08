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

  // ── SVG path templates per ship length ───────────────────────────────
  private static paths(len: number, s: string, sunk: boolean): string {
    const h = sunk ? `rgba(175,12,12,0.32)` : `rgba(0,150,220,0.15)`;   // hull fill
    const b = sunk ? `rgba(175,12,12,0.30)` : `rgba(0,180,255,0.28)`;   // block fill
    const r = sunk ? `rgba(170,12,12,0.30)` : `rgba(0,175,255,0.34)`;   // rect detail
    const g = sunk ? `rgba(175,12,12,0.25)` : `rgba(0,165,235,0.18)`;   // grey block
    const bow = sunk ? `rgba(200,20,20,0.45)` : `rgba(0,212,255,0.45)`;

    switch (len) {
      case 4: return `
        <!-- Carrier: flat flight deck, angled port deck, island starboard -->
        <path d="M 14,25 L 356,18 Q 392,50 356,82 L 14,75 Q 6,50 14,25 Z" fill="${h}" stroke="${s}" stroke-width="2.5"/>
        <path d="M 40,75 L 270,75 L 252,96 L 40,92 Z" fill="${sunk?'rgba(160,10,10,.18)':'rgba(0,130,200,.10)'}" stroke="${s}" stroke-width="1.5" opacity="0.7"/>
        <!-- Island superstructure -->
        <rect x="252" y="20" width="58" height="20" rx="3" fill="${b}" stroke="${s}" stroke-width="2"/>
        <rect x="256" y="23" width="50" height="8" rx="2" fill="${sunk?'rgba(170,8,8,.2)':'rgba(0,210,255,.15)'}" stroke="${s}" stroke-width="1"/>
        <!-- Mast -->
        <line x1="290" y1="20" x2="290" y2="10" stroke="${s}" stroke-width="2.5" opacity="0.65"/>
        <rect x="278" y="7" width="24" height="6" rx="2" fill="${b}" stroke="${s}" stroke-width="1.5"/>
        <!-- Catapults -->
        <line x1="280" y1="22" x2="382" y2="37" stroke="${s}" stroke-width="1" opacity="${sunk?.18:.35}"/>
        <line x1="280" y1="30" x2="376" y2="43" stroke="${s}" stroke-width="1" opacity="${sunk?.18:.35}"/>
        <!-- Arrestor wires -->
        <line x1="118" y1="68" x2="110" y2="95" stroke="${s}" stroke-width=".8" opacity="${sunk?.15:.28}"/>
        <line x1="136" y1="68" x2="128" y2="95" stroke="${s}" stroke-width=".8" opacity="${sunk?.15:.28}"/>
        <!-- Deck centerline -->
        <line x1="35" y1="50" x2="340" y2="50" stroke="${s}" stroke-width=".6" stroke-dasharray="18,12" opacity="0.18"/>
        <!-- Stern engines -->
        <rect x="14" y="34" width="10" height="32" rx="2" fill="${r}" stroke="${s}" stroke-width="1.2"/>
        <circle cx="390" cy="50" r="5" fill="${bow}"/>`;

      case 3: return `
        <!-- Slava-class cruiser: twin turrets fore/aft, missile tubes, bridge -->
        <path d="M 12,22 L 258,14 Q 292,50 258,86 L 12,78 Q 5,50 12,22 Z" fill="${h}" stroke="${s}" stroke-width="2.5"/>
        <!-- Fore twin turret -->
        <circle cx="50" cy="50" r="13" fill="${b}" stroke="${s}" stroke-width="2"/>
        <line x1="50" y1="47" x2="70" y2="44" stroke="${s}" stroke-width="3.5" stroke-linecap="round"/>
        <line x1="50" y1="53" x2="70" y2="56" stroke="${s}" stroke-width="3.5" stroke-linecap="round"/>
        <!-- Bridge superstructure -->
        <path d="M 80,30 L 130,26 L 130,74 L 80,70 Z" fill="${g}" stroke="${s}" stroke-width="1.8"/>
        <!-- Radar dome -->
        <circle cx="108" cy="26" r="8" fill="${b}" stroke="${s}" stroke-width="1.5"/>
        <circle cx="108" cy="26" r="4" fill="${sunk?'rgba(200,20,20,.5)':'rgba(0,215,255,.55)'}"/>
        <!-- Missile tubes port -->
        <rect x="84" y="14" width="14" height="5.5" rx="1.5" fill="${r}" stroke="${s}" stroke-width="1.2"/>
        <rect x="102" y="13" width="14" height="5.5" rx="1.5" fill="${r}" stroke="${s}" stroke-width="1.2"/>
        <rect x="120" y="13" width="14" height="5.5" rx="1.5" fill="${r}" stroke="${s}" stroke-width="1.2"/>
        <!-- Missile tubes starboard -->
        <rect x="84" y="80.5" width="14" height="5.5" rx="1.5" fill="${r}" stroke="${s}" stroke-width="1.2"/>
        <rect x="102" y="81.5" width="14" height="5.5" rx="1.5" fill="${r}" stroke="${s}" stroke-width="1.2"/>
        <rect x="120" y="81.5" width="14" height="5.5" rx="1.5" fill="${r}" stroke="${s}" stroke-width="1.2"/>
        <!-- Aft superstructure -->
        <rect x="146" y="32" width="52" height="36" rx="4" fill="${g}" stroke="${s}" stroke-width="1.5"/>
        <!-- Funnel -->
        <rect x="165" y="28" width="18" height="12" rx="3" fill="${b}" stroke="${s}" stroke-width="1.5"/>
        <!-- Aft turret -->
        <circle cx="222" cy="50" r="12" fill="${b}" stroke="${s}" stroke-width="2"/>
        <line x1="222" y1="47" x2="242" y2="44" stroke="${s}" stroke-width="3" stroke-linecap="round"/>
        <line x1="222" y1="53" x2="242" y2="56" stroke="${s}" stroke-width="3" stroke-linecap="round"/>
        <!-- Helo deck stern -->
        <circle cx="16" cy="50" r="10" fill="none" stroke="${s}" stroke-width="1.2" opacity="0.4"/>
        <line x1="9" y1="50" x2="23" y2="50" stroke="${s}" stroke-width=".8" opacity="0.35"/>
        <line x1="16" y1="43" x2="16" y2="57" stroke="${s}" stroke-width=".8" opacity="0.35"/>
        <circle cx="287" cy="50" r="4" fill="${bow}"/>`;

      case 2: return `
        <!-- Arleigh Burke destroyer: stealth facets, Mk45 gun, SPY-1 radar, VLS -->
        <path d="M 12,26 L 168,16 Q 192,50 168,84 L 12,74 Q 5,50 12,26 Z" fill="${h}" stroke="${s}" stroke-width="2.5"/>
        <!-- Stealth faceting lines -->
        <line x1="12" y1="26" x2="75" y2="18" stroke="${s}" stroke-width=".8" opacity=".28"/>
        <line x1="12" y1="74" x2="75" y2="82" stroke="${s}" stroke-width=".8" opacity=".28"/>
        <!-- Mk 45 gun mount -->
        <path d="M 36,40 L 62,36 L 68,50 L 62,64 L 36,60 Z" fill="${b}" stroke="${s}" stroke-width="1.8"/>
        <line x1="62" y1="50" x2="82" y2="50" stroke="${s}" stroke-width="3.5" stroke-linecap="round"/>
        <!-- Bridge (pyramid stealth) -->
        <path d="M 82,28 L 128,24 L 132,50 L 128,76 L 82,72 Z" fill="${g}" stroke="${s}" stroke-width="1.8"/>
        <!-- SPY-1 phased array panels -->
        <rect x="90" y="26" width="20" height="13" rx="2" fill="${b}" stroke="${s}" stroke-width="1.5"/>
        <rect x="90" y="61" width="20" height="13" rx="2" fill="${b}" stroke="${s}" stroke-width="1.5"/>
        <!-- VLS cells fore -->
        <rect x="86" y="38" width="8" height="24" rx="1.5" fill="${r}" stroke="${s}" stroke-width="1.2"/>
        <!-- VLS cells aft -->
        <rect x="140" y="34" width="10" height="32" rx="1.5" fill="${r}" stroke="${s}" stroke-width="1.2"/>
        <!-- Helo deck -->
        <circle cx="20" cy="50" r="9" fill="none" stroke="${s}" stroke-width="1.2" opacity="0.4"/>
        <line x1="13" y1="50" x2="27" y2="50" stroke="${s}" stroke-width=".8" opacity=".35"/>
        <line x1="20" y1="43" x2="20" y2="57" stroke="${s}" stroke-width=".8" opacity=".35"/>
        <circle cx="188" cy="50" r="4" fill="${bow}"/>`;

      default: return `
        <!-- Virginia-class submarine: teardrop hull, sail, periscopes -->
        <ellipse cx="48" cy="50" rx="40" ry="24" fill="${h}" stroke="${s}" stroke-width="2.5"/>
        <!-- Sail (conning tower) -->
        <rect x="36" y="28" width="20" height="16" rx="3" fill="${b}" stroke="${s}" stroke-width="2"/>
        <!-- Periscopes -->
        <line x1="42" y1="28" x2="42" y2="20" stroke="${s}" stroke-width="2.5" stroke-linecap="round" opacity="${sunk?.3:.7}"/>
        <line x1="50" y1="28" x2="50" y2="16" stroke="${s}" stroke-width="2.5" stroke-linecap="round" opacity="${sunk?.3:.7}"/>
        <circle cx="42" cy="20" r="2.5" fill="${s}" opacity="${sunk?.25:.65}"/>
        <circle cx="50" cy="16" r="3" fill="${s}" opacity="${sunk?.25:.7}"/>
        <!-- Rudder cross -->
        <line x1="10" y1="44" x2="10" y2="56" stroke="${s}" stroke-width="2.5" opacity="0.4" stroke-linecap="round"/>
        <line x1="6" y1="50" x2="18" y2="50" stroke="${s}" stroke-width="2.5" opacity="0.4" stroke-linecap="round"/>
        <circle cx="87" cy="50" r="3.5" fill="${bow}"/>`;
    }
  }
}
