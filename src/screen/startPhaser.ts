import Phaser from 'phaser';
import { BootScene } from '@/scenes/BootScene';
import { PreloadScene } from '@/scenes/PreloadScene';
import { LobbyScene } from '@/scenes/LobbyScene';
import { PlacementScene } from '@/scenes/PlacementScene';
import { BattleScene } from '@/scenes/BattleScene';
import { ResultScene } from '@/scenes/ResultScene';
import type { AirConsoleAdapter } from '@/airconsole/AirConsoleAdapter';
import type { PlayerManager } from '@/state/PlayerManager';
import type { GameManager } from '@/game/GameManager';

export function startPhaser(
  adapter: AirConsoleAdapter,
  playerManager: PlayerManager,
  gameManager: GameManager,
): void {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    backgroundColor: '#0a0a1a',
    parent: 'game-container',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, PreloadScene, LobbyScene, PlacementScene, BattleScene, ResultScene],
  };

  const game = new Phaser.Game(config);
  game.registry.set('gameManager', gameManager);
  game.registry.set('adapter', adapter);
  game.registry.set('playerManager', playerManager);
}
