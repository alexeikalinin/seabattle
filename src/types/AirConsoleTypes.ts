declare global {
  class AirConsole {
    constructor(opts?: {
      orientation?: string;
      synchronize_time?: boolean;
      silence_inactive_players?: boolean;
      setup_document?: boolean;
    });

    readonly SCREEN: 0;

    message(to: number, data: unknown): void;
    broadcast(data: unknown): void;
    setActivePlayers(maxPlayers: number): void;
    getActivePlayerDeviceIds(): number[];
    getControllerDeviceIds(): number[];
    convertPlayerNumberToDeviceId(playerNumber: number): number | undefined;
    convertDeviceIdToPlayerNumber(deviceId: number): number | undefined;
    getCustomDeviceState(deviceId?: number): unknown;
    setCustomDeviceState(data: unknown): void;
    setCustomDeviceStateProperty(key: string, value: unknown): void;
    getNickname(deviceId: number): string;
    getProfilePicture(deviceId: number, size?: number): string;
    isPremium(deviceId: number): boolean;

    onConnect: ((deviceId: number) => void) | null;
    onDisconnect: ((deviceId: number) => void) | null;
    onMessage: ((deviceId: number, data: unknown) => void) | null;
    onReady: ((code: string) => void) | null;
    onActivePlayersChanged: ((playerNumber: number | undefined) => void) | null;
    onCustomDeviceStateChange: ((deviceId: number, data: unknown) => void) | null;
  }
}

export {};
