import type { PlacedShip, ShipTallyRow } from '@/types/GameTypes';
import { FLEET_CONFIG } from '@/types/GameTypes';

export type { ShipTallyRow };

export function shipTallyAlive(ships: PlacedShip[]): ShipTallyRow[] {
  const byLen = new Map<number, number>();
  for (const s of ships) {
    if (s.isSunk) continue;
    byLen.set(s.definition.length, (byLen.get(s.definition.length) ?? 0) + 1);
  }
  const lengths = [...byLen.keys()].sort((a, b) => b - a);
  return lengths.map(len => {
    const def = FLEET_CONFIG.find(d => d.length === len);
    return {
      length: len,
      count: byLen.get(len) ?? 0,
      label: def?.name ?? `×${len}`,
    };
  });
}

export function formatShipTally(rows: ShipTallyRow[]): string {
  if (rows.length === 0) return 'None afloat';
  return rows.map(r => `${r.label}(${r.length}): ${r.count}`).join(' · ');
}
