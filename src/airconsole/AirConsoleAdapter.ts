import '@/types/AirConsoleTypes';
import type { ControllerAction, ScreenMessage } from '@/types/Messages';
import { Logger } from '@/utils/logger';

const log = new Logger('AirConsole');

type MessageHandler = (deviceId: number, action: ControllerAction) => void;
type ConnectHandler = (deviceId: number) => void;
type DisconnectHandler = (deviceId: number) => void;

export class AirConsoleAdapter {
  private readonly ac: AirConsole;

  constructor() {
    log.info('Initializing AirConsole SDK');
    // silence_inactive_players=false: prevents SDK from blocking onConnect for
    // device 2 when device 1 is already in active players (v1.9.0 feature).
    // We manage player registration ourselves.
    this.ac = new AirConsole({ orientation: 'landscape', silence_inactive_players: false });
    log.info('AirConsole instance created');
  }

  sendToController(deviceId: number, msg: ScreenMessage): void {
    log.debug(`→ device #${deviceId}`, msg);
    this.ac.message(deviceId, msg);
  }

  broadcastToControllers(msg: ScreenMessage): void {
    log.debug('→ broadcast', msg);
    this.ac.broadcast(msg);
  }

  activatePlayers(): void {
    log.info('setActivePlayers(2)');
    this.ac.setActivePlayers(2);
  }

  getSlotForDevice(deviceId: number): number | undefined {
    return this.ac.convertDeviceIdToPlayerNumber(deviceId);
  }

  getDeviceForSlot(slot: number): number | undefined {
    return this.ac.convertPlayerNumberToDeviceId(slot);
  }

  getNickname(deviceId: number): string {
    return this.ac.getNickname(deviceId);
  }

  onConnect(handler: ConnectHandler): void {
    this.ac.onConnect = (deviceId: number) => {
      log.info(`Device #${deviceId} connected`);
      handler(deviceId);
    };
  }

  onDisconnect(handler: DisconnectHandler): void {
    this.ac.onDisconnect = (deviceId: number) => {
      log.warn(`Device #${deviceId} disconnected`);
      handler(deviceId);
    };
  }

  onMessage(handler: MessageHandler): void {
    this.ac.onMessage = (deviceId: number, data: unknown): void => {
      if (isControllerAction(data)) {
        log.debug(`← device #${deviceId}`, data);
        handler(deviceId, data);
      } else {
        log.warn(`Unknown message from device #${deviceId}`, data);
      }
    };
  }
}

function isControllerAction(data: unknown): data is ControllerAction {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    typeof (data as Record<string, unknown>).type === 'string'
  );
}
