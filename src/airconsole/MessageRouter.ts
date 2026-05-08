import type { AirConsoleAdapter } from './AirConsoleAdapter';
import type { GameManager } from '@/game/GameManager';
import type { PlayerManager } from '@/state/PlayerManager';
import type { ControllerAction } from '@/types/Messages';
import { Logger } from '@/utils/logger';

const log = new Logger('MessageRouter');

export class MessageRouter {
  constructor(
    private readonly adapter: AirConsoleAdapter,
    private readonly gameManager: GameManager,
    private readonly playerManager: PlayerManager,
  ) {
    this.adapter.onConnect(this.handleConnect.bind(this));
    this.adapter.onDisconnect(this.handleDisconnect.bind(this));
    this.adapter.onMessage(this.handleMessage.bind(this));
  }

  private handleConnect(deviceId: number): void {
    log.info(`handleConnect device=#${deviceId}`);
    this.gameManager.handleConnect(deviceId);
  }

  private handleDisconnect(deviceId: number): void {
    log.warn(`handleDisconnect device=#${deviceId}`);
    this.gameManager.handleDisconnect(deviceId);
  }

  private handleMessage(deviceId: number, action: ControllerAction): void {
    if (!this.playerManager.isRegisteredPlayer(deviceId)) {
      if (action.type !== 'READY') {
        log.warn(`Ignored action "${action.type}" from unregistered device #${deviceId}`);
        return;
      }
    }

    log.debug(`Routing "${action.type}" from device #${deviceId}`);

    switch (action.type) {
      case 'READY':               this.gameManager.handleReady(deviceId); break;
      case 'PLACE_SHIP':          this.gameManager.handlePlaceShip(deviceId, action); break;
      case 'ROTATE_SHIP':         this.gameManager.handleRotateShip(deviceId, action); break;
      case 'ATTACK_CELL':         this.gameManager.handleAttack(deviceId, action); break;
      case 'RESTART_GAME':        this.gameManager.handleRestart(deviceId); break;
      case 'AUTO_PLACE':          this.gameManager.handleAutoPlace(deviceId); break;
      case 'CONFIRM_PLACEMENT':   this.gameManager.handleConfirmPlacement(deviceId); break;
    }
  }
}
