// Procedural sound effects via Web Audio API — no audio files needed.
export class ProceduralAudio {
  private ctx: AudioContext | null = null;
  private muted = false;
  private masterGain: GainNode | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.7;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private get out(): AudioNode {
    this.getCtx();
    return this.masterGain!;
  }

  toggleMute(): void {
    this.muted = !this.muted;
    if (this.masterGain) this.masterGain.gain.value = this.muted ? 0 : 0.7;
  }
  isMuted(): boolean { return this.muted; }

  // Short cannon "thump" when firing
  playShot(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.14);
    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.connect(gain); gain.connect(this.out);
    osc.start(t); osc.stop(t + 0.16);
  }

  // Water splash when miss
  playMiss(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.35), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.28;

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 900;
    bpf.Q.value = 1.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    src.connect(bpf); bpf.connect(gain); gain.connect(this.out);
    src.start(t);

    // Soft "plop" tone
    const osc = ctx.createOscillator();
    const oGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(160, t + 0.1);
    oGain.gain.setValueAtTime(0.18, t);
    oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(oGain); oGain.connect(this.out);
    osc.start(t); osc.stop(t + 0.12);
  }

  // Metallic explosion when hit
  playHit(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;

    // Noise burst
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 350;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.7, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    src.connect(lpf); lpf.connect(nGain); nGain.connect(this.out);
    src.start(t);

    // Low metallic thud
    const osc = ctx.createOscillator();
    const oGain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.12);
    oGain.gain.setValueAtTime(0.4, t);
    oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(oGain); oGain.connect(this.out);
    osc.start(t); osc.stop(t + 0.18);
  }

  // Big explosion + creak for sunk
  playSunk(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    this.playHit();

    // Deep rumble
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(75, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(18, t + 1.1);
    gain.gain.setValueAtTime(0.55, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
    osc.connect(gain); gain.connect(this.out);
    osc.start(t + 0.08); osc.stop(t + 1.1);

    // Metal creak descending
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(380, t + 0.18);
    osc2.frequency.exponentialRampToValueAtTime(120, t + 0.7);
    g2.gain.setValueAtTime(0.18, t + 0.18);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    osc2.connect(g2); g2.connect(this.out);
    osc2.start(t + 0.18); osc2.stop(t + 0.7);
  }

  // Ascending chime when ship placed
  playPlaceShip(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(660, t + 0.09);
    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    osc.connect(gain); gain.connect(this.out);
    osc.start(t); osc.stop(t + 0.13);
  }

  // C-E-G chord for ready
  playReady(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t + i * 0.11);
      gain.gain.linearRampToValueAtTime(0.22, t + i * 0.11 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.11 + 0.28);
      osc.connect(gain); gain.connect(this.out);
      osc.start(t + i * 0.11); osc.stop(t + i * 0.11 + 0.3);
    });
  }

  // Rising fanfare for victory
  playVictory(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const melody = [523, 659, 784, 1047];
    melody.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t + i * 0.18);
      gain.gain.linearRampToValueAtTime(0.17, t + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.18 + 0.42);
      osc.connect(gain); gain.connect(this.out);
      osc.start(t + i * 0.18); osc.stop(t + i * 0.18 + 0.45);
    });
  }

  // Descending tones for defeat
  playDefeat(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const melody = [392, 349, 311, 262];
    melody.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t + i * 0.22);
      gain.gain.linearRampToValueAtTime(0.18, t + i * 0.22 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.22 + 0.55);
      osc.connect(gain); gain.connect(this.out);
      osc.start(t + i * 0.22); osc.stop(t + i * 0.22 + 0.6);
    });
  }

  // Short click for UI tap
  playTap(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.connect(gain); gain.connect(this.out);
    osc.start(t); osc.stop(t + 0.04);
  }
}
