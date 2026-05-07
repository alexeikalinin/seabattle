import { AirConsoleAdapter } from '@/airconsole/AirConsoleAdapter';
import { PlayerManager } from '@/state/PlayerManager';
import { GameManager } from '@/game/GameManager';
import { MessageRouter } from '@/airconsole/MessageRouter';

const adapter = new AirConsoleAdapter();
const playerManager = new PlayerManager(adapter);
const gameManager = new GameManager(adapter, playerManager);
new MessageRouter(adapter, gameManager, playerManager);

void import('./startPhaser').then(({ startPhaser }) => {
  startPhaser(adapter, playerManager, gameManager);
});
