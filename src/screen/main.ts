import Phaser from 'phaser';
import { BootScene } from '@/scenes/BootScene';
import { PreloadScene } from '@/scenes/PreloadScene';
import { LobbyScene } from '@/scenes/LobbyScene';
import { PlacementScene } from '@/scenes/PlacementScene';
import { BattleScene } from '@/scenes/BattleScene';
import { ResultScene } from '@/scenes/ResultScene';
import { AirConsoleAdapter } from '@/airconsole/AirConsoleAdapter';
import { PlayerManager } from '@/state/PlayerManager';
import { GameManager } from '@/game/GameManager';
import { MessageRouter } from '@/airconsole/MessageRouter';

const adapter = new AirConsoleAdapter();
const playerManager = new PlayerManager(adapter);
const gameManager = new GameManager(adapter, playerManager);
new MessageRouter(adapter, gameManager, playerManager);

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
