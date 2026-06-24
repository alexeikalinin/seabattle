import Phaser from 'phaser';
import type { GameManager } from '@/game/GameManager';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  create(): void {
    const gameManager = this.registry.get('gameManager') as GameManager;
    gameManager.setGameEvents(this.game.events);

    const sceneManager = this.game.scene;
    const gameScenes = ['PreloadScene', 'LobbyScene', 'PlacementScene', 'BattleScene', 'ResultScene'];

    this.game.events.on('phase-change', (phase: string) => {
      gameScenes.forEach(key => {
        if (sceneManager.isActive(key)) sceneManager.stop(key);
      });
      switch (phase) {
        case 'lobby':     sceneManager.start('LobbyScene'); break;
        case 'placement': sceneManager.start('PlacementScene'); break;
        case 'battle':    sceneManager.start('BattleScene'); break;
        case 'result':    sceneManager.start('ResultScene'); break;
      }
    });

    sceneManager.start('TransitionScene');
    this.scene.start('PreloadScene');
  }
}
