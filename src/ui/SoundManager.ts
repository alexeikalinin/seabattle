import Phaser from 'phaser';

export class SoundManager {
  private readonly sounds = new Map<string, Phaser.Sound.BaseSound>();
  private muted = false;

  constructor(private readonly scene: Phaser.Scene) {}

  init(keys: string[]): void {
    for (const key of keys) {
      if (this.scene.cache.audio.has(key)) {
        this.sounds.set(key, this.scene.sound.add(key));
      }
    }
  }

  play(key: string, config?: Phaser.Types.Sound.SoundConfig): void {
    if (this.muted) return;
    this.sounds.get(key)?.play(config);
  }

  toggleMute(): void {
    this.muted = !this.muted;
    this.scene.sound.mute = this.muted;
  }

  isMuted(): boolean { return this.muted; }
}
