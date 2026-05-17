// Procedural sound effects via Web Audio API — no audio files needed.
export class ProceduralAudio {
  private ctx: AudioContext | null = null;
  private muted = false;
  private masterGain: GainNode | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.72;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private get out(): AudioNode { this.getCtx(); return this.masterGain!; }

  toggleMute(): void {
    this.muted = !this.muted;
    if (this.masterGain) this.masterGain.gain.value = this.muted ? 0 : 0.72;
  }
  isMuted(): boolean { return this.muted; }

  // ── Helpers ────────────────────────────────────────────────────────

  /** Create a noise buffer of given duration. */
  private noise(secs: number): AudioBufferSourceNode {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * secs), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }

  /** Oscillator with common setup. */
  private osc(type: OscillatorType, freq: number): OscillatorNode {
    const o = this.ctx!.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    return o;
  }

  /** Simple gain envelope: attack then exponential decay. */
  private env(node: AudioNode, peak: number, attackT: number, decayT: number, startT: number): GainNode {
    const g = this.ctx!.createGain();
    g.gain.setValueAtTime(0, startT);
    g.gain.linearRampToValueAtTime(peak, startT + attackT);
    g.gain.exponentialRampToValueAtTime(0.0001, startT + attackT + decayT);
    node.connect(g);
    return g;
  }

  // ── Shot — cannon thump with whoosh ─────────────────────────────────
  playShot(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;

    // Low cannon thump
    const o = this.osc('sine', 140);
    o.frequency.exponentialRampToValueAtTime(35, t + 0.18);
    const g = this.env(o, 0.6, 0.005, 0.2, t);
    g.connect(this.out);
    o.start(t); o.stop(t + 0.22);

    // Compressed air whoosh (high-pass noise)
    const n = this.noise(0.14);
    const hpf = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 1800;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.18, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    n.connect(hpf); hpf.connect(ng); ng.connect(this.out);
    n.start(t);
  }

  // ── Miss — realistic water impact with bubbles ───────────────────────
  playMiss(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;

    // Bandpass splash noise
    const n = this.noise(0.4);
    const bpf = ctx.createBiquadFilter(); bpf.type = 'bandpass'; bpf.frequency.value = 700; bpf.Q.value = 1.5;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.5, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    n.connect(bpf); bpf.connect(ng); ng.connect(this.out);
    n.start(t);

    // Plop drop tone
    const o1 = this.osc('sine', 320);
    o1.frequency.exponentialRampToValueAtTime(140, t + 0.12);
    const g1 = this.env(o1, 0.22, 0.005, 0.14, t);
    g1.connect(this.out); o1.start(t); o1.stop(t + 0.15);

    // Air bubble rising
    const o2 = this.osc('sine', 180);
    o2.frequency.exponentialRampToValueAtTime(420, t + 0.18);
    const g2 = this.env(o2, 0.08, 0.01, 0.18, t + 0.06);
    g2.connect(this.out); o2.start(t + 0.06); o2.stop(t + 0.25);
  }

  // ── Hit — sharp metallic explosion ───────────────────────────────────
  playHit(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;

    // Full-spectrum noise burst
    const n = this.noise(0.55);
    const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 420;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.85, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    n.connect(lpf); lpf.connect(ng); ng.connect(this.out);
    n.start(t);

    // Sharp attack transient
    const o1 = this.osc('square', 220);
    o1.frequency.exponentialRampToValueAtTime(65, t + 0.08);
    const g1 = this.env(o1, 0.45, 0.002, 0.1, t);
    g1.connect(this.out); o1.start(t); o1.stop(t + 0.11);

    // Secondary boom
    const o2 = this.osc('sine', 90);
    o2.frequency.exponentialRampToValueAtTime(28, t + 0.22);
    const g2 = this.env(o2, 0.38, 0.01, 0.25, t + 0.02);
    g2.connect(this.out); o2.start(t + 0.02); o2.stop(t + 0.28);
  }

  // ── Sunk — multi-layer deep explosion + metal creak + rumble ─────────
  playSunk(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;

    // Primary explosion (same as hit but louder)
    this.playHit();

    // Secondary delayed explosion
    this.ctx?.currentTime; // keep ctx alive
    setTimeout(() => {
      if (!this.ctx) return;
      const t2 = this.ctx.currentTime;
      const n2 = this.noise(0.6);
      const lpf2 = this.ctx.createBiquadFilter(); lpf2.type = 'lowpass'; lpf2.frequency.value = 300;
      const ng2 = this.ctx.createGain();
      ng2.gain.setValueAtTime(0.65, t2); ng2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.55);
      n2.connect(lpf2); lpf2.connect(ng2); ng2.connect(this.out);
      n2.start(t2);
    }, 140);

    // Deep sub-bass rumble
    const o1 = this.osc('sine', 70);
    o1.frequency.exponentialRampToValueAtTime(16, t + 1.4);
    const g1 = this.env(o1, 0.62, 0.02, 1.4, t + 0.08);
    g1.connect(this.out); o1.start(t + 0.08); o1.stop(t + 1.5);

    // Metal creak — descending sawtooth
    const o2 = this.osc('sawtooth', 460);
    o2.frequency.exponentialRampToValueAtTime(95, t + 0.75);
    const g2 = this.env(o2, 0.15, 0.005, 0.75, t + 0.2);
    g2.connect(this.out); o2.start(t + 0.2); o2.stop(t + 0.95);

    // Water rush (mid-frequency noise)
    const n3 = this.noise(1.0);
    const bpf3 = ctx.createBiquadFilter(); bpf3.type = 'bandpass'; bpf3.frequency.value = 500; bpf3.Q.value = 0.8;
    const ng3 = ctx.createGain();
    ng3.gain.setValueAtTime(0.3, t + 0.3); ng3.gain.exponentialRampToValueAtTime(0.001, t + 1.3);
    n3.connect(bpf3); bpf3.connect(ng3); ng3.connect(this.out);
    n3.start(t + 0.3);
  }

  // ── Place ship — ascending chime ─────────────────────────────────────
  playPlaceShip(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    [440, 554, 660].forEach((freq, i) => {
      const o = this.osc('triangle', freq);
      const g = this.env(o, 0.16, 0.005, 0.15, t + i * 0.055);
      g.connect(this.out); o.start(t + i * 0.055); o.stop(t + i * 0.055 + 0.18);
    });
  }

  // ── Ready — ascending major chord ────────────────────────────────────
  playReady(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    [523, 659, 784, 1047].forEach((freq, i) => {
      const o = this.osc('triangle', freq);
      const g = this.env(o, 0.2, 0.01, 0.3, t + i * 0.1);
      g.connect(this.out); o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.35);
    });
  }

  // ── Victory — fanfare with chord layers ──────────────────────────────
  playVictory(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;

    // Main melody: C5–E5–G5–C6
    const melody = [523, 659, 784, 1047];
    melody.forEach((freq, i) => {
      const o = this.osc('square', freq);
      const g = this.env(o, 0.15, 0.01, 0.4, t + i * 0.16);
      g.connect(this.out); o.start(t + i * 0.16); o.stop(t + i * 0.16 + 0.5);
    });

    // Harmony: a fifth below (G4–B4–D5–G5)
    const harmony = [392, 494, 587, 784];
    harmony.forEach((freq, i) => {
      const o = this.osc('triangle', freq);
      const g = this.env(o, 0.09, 0.01, 0.38, t + i * 0.16 + 0.04);
      g.connect(this.out); o.start(t + i * 0.16 + 0.04); o.stop(t + i * 0.16 + 0.5);
    });

    // Sparkle high notes
    const sparkle = [2093, 2637, 3136];
    sparkle.forEach((freq, i) => {
      const o = this.osc('sine', freq);
      const g = this.env(o, 0.05, 0.002, 0.18, t + 0.6 + i * 0.12);
      g.connect(this.out); o.start(t + 0.6 + i * 0.12); o.stop(t + 0.6 + i * 0.12 + 0.2);
    });
  }

  // ── Defeat — descending minor with hollow tone ────────────────────────
  playDefeat(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;

    // Minor descending: Am chord fragments
    const melody = [440, 392, 349, 294];
    melody.forEach((freq, i) => {
      const o = this.osc('triangle', freq);
      const g = this.env(o, 0.18, 0.01, 0.55, t + i * 0.22);
      g.connect(this.out); o.start(t + i * 0.22); o.stop(t + i * 0.22 + 0.65);
    });

    // Low drone underneath
    const drone = this.osc('sine', 110);
    const dg = this.env(drone, 0.12, 0.05, 1.2, t);
    dg.connect(this.out); drone.start(t); drone.stop(t + 1.4);
  }

  // ── Short UI tap ────────────────────────────────────────────────────
  playTap(): void {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const o = this.osc('sine', 900);
    const g = this.env(o, 0.1, 0.002, 0.04, t);
    g.connect(this.out); o.start(t); o.stop(t + 0.05);
  }
}
