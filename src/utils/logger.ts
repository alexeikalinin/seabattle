type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const COLORS: Record<string, string> = {
  AirConsole:    '#00e5ff',
  GameManager:   '#00ff88',
  PlayerManager: '#ffaa00',
  MessageRouter: '#ff88ff',
  BattleEngine:  '#ff4444',
  ShipPlacer:    '#88aaff',
  Controller:    '#ff6eb4',
  Scene:         '#aaffaa',
};

const LEVEL_STYLES: Record<LogLevel, string> = {
  debug: 'color:#666;',
  info:  'color:#ccc;',
  warn:  'color:#ffaa00;font-weight:bold',
  error: 'color:#ff4444;font-weight:bold',
};

// Vite injects import.meta.env at build time; fall back to true for safety
const isDev: boolean = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ?? true;

export class Logger {
  private readonly prefix: string;
  private readonly color: string;

  constructor(module: string) {
    this.prefix = `[${module}]`;
    this.color = COLORS[module] ?? '#aaa';
  }

  debug(msg: string, ...args: unknown[]): void {
    if (!isDev) return;
    console.debug(`%c${this.prefix}%c ${msg}`, `color:${this.color};font-weight:bold`, 'color:#666', ...args);
  }

  info(msg: string, ...args: unknown[]): void {
    if (!isDev) return;
    console.info(`%c${this.prefix}%c ${msg}`, `color:${this.color};font-weight:bold`, LEVEL_STYLES.info, ...args);
  }

  warn(msg: string, ...args: unknown[]): void {
    console.warn(`%c${this.prefix}%c ${msg}`, `color:${this.color};font-weight:bold`, LEVEL_STYLES.warn, ...args);
  }

  error(msg: string, ...args: unknown[]): void {
    console.error(`%c${this.prefix}%c ${msg}`, `color:${this.color};font-weight:bold`, LEVEL_STYLES.error, ...args);
  }

  group(label: string): void {
    if (!isDev) return;
    console.groupCollapsed(`%c${this.prefix} ${label}`, `color:${this.color};font-weight:bold`);
  }

  groupEnd(): void {
    if (!isDev) return;
    console.groupEnd();
  }
}
