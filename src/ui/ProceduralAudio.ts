// Procedural sound effects via Web Audio API — no audio files needed.
// Some embedded WebViews (e.g. the AirConsole mobile app) restrict or lack
// AudioContext entirely; every public method below must stay a safe no-op
// in that case so a missing sound effect never blocks game-critical taps.
export class ProceduralAudio {
  private ctx: AudioContext | null = null;
  private muted = false;
  private masterGain: GainNode | null = null;
  private unavailable = false;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) { this.unavailable = true; throw new Error('AudioContext unsupported'); }
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.72;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private get out(): AudioNode { this.getCtx(); return this.masterGain!; }

  /** Wraps a play*() body so audio failures never throw into caller code. */
  private safe(fn: () => void): void {
    if (this.unavailable) return;
    try { fn(); } catch { this.unavailable = true; }
  }

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
    this.safe(() => {
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
    });
  }

  // ── Miss — energy shield deflect ping ─────────────────────────────────
  playMiss(): void {
    this.safe(() => {
      const ctx = this.getCtx();
      const t = ctx.currentTime;

      // Bright shield-ping noise burst
      const n = this.noise(0.18);
      const bpf = ctx.createBiquadFilter(); bpf.type = 'bandpass'; bpf.frequency.value = 2200; bpf.Q.value = 6;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.35, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      n.connect(bpf); bpf.connect(ng); ng.connect(this.out);
      n.start(t);

      // Deflect tone — quick downward sweep
      const o1 = this.osc('sawtooth', 1400);
      o1.frequency.exponentialRampToValueAtTime(420, t + 0.12);
      const g1 = this.env(o1, 0.18, 0.002, 0.12, t);
      g1.connect(this.out); o1.start(t); o1.stop(t + 0.14);

      // Harmonic echo
      const o2 = this.osc('sine', 1800);
      o2.frequency.exponentialRampToValueAtTime(900, t + 0.1);
      const g2 = this.env(o2, 0.08, 0.005, 0.12, t + 0.05);
      g2.connect(this.out); o2.start(t + 0.05); o2.stop(t + 0.18);
    });
  }

  // ── Hit — sharp metallic explosion ───────────────────────────────────
  playHit(): void {
    this.safe(() => {
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
    });
  }

  // ── Sunk — multi-layer deep explosion + metal creak + rumble ─────────
  playSunk(): void {
    this.safe(() => {
      const ctx = this.getCtx();
      const t = ctx.currentTime;

      // Primary explosion (same as hit but louder)
      this.playHit();

      // Secondary delayed explosion
      setTimeout(() => {
        if (!this.ctx) return;
        try {
          const t2 = this.ctx.currentTime;
          const n2 = this.noise(0.6);
          const lpf2 = this.ctx.createBiquadFilter(); lpf2.type = 'lowpass'; lpf2.frequency.value = 300;
          const ng2 = this.ctx.createGain();
          ng2.gain.setValueAtTime(0.65, t2); ng2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.55);
          n2.connect(lpf2); lpf2.connect(ng2); ng2.connect(this.out);
          n2.start(t2);
        } catch { /* ignore — decorative secondary layer */ }
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

      // Hull decompression hiss (high-frequency noise)
      const n3 = this.noise(1.0);
      const hpf3 = ctx.createBiquadFilter(); hpf3.type = 'highpass'; hpf3.frequency.value = 2000;
      const ng3 = ctx.createGain();
      ng3.gain.setValueAtTime(0.22, t + 0.3); ng3.gain.exponentialRampToValueAtTime(0.001, t + 1.3);
      n3.connect(hpf3); hpf3.connect(ng3); ng3.connect(this.out);
      n3.start(t + 0.3);
    });
  }

  // ── Place ship — ascending chime ─────────────────────────────────────
  playPlaceShip(): void {
    this.safe(() => {
      const ctx = this.getCtx();
      const t = ctx.currentTime;
      [440, 554, 660].forEach((freq, i) => {
        const o = this.osc('triangle', freq);
        const g = this.env(o, 0.16, 0.005, 0.15, t + i * 0.055);
        g.connect(this.out); o.start(t + i * 0.055); o.stop(t + i * 0.055 + 0.18);
      });
    });
  }

  // ── Ready — ascending major chord ────────────────────────────────────
  playReady(): void {
    this.safe(() => {
      const ctx = this.getCtx();
      const t = ctx.currentTime;
      [523, 659, 784, 1047].forEach((freq, i) => {
        const o = this.osc('triangle', freq);
        const g = this.env(o, 0.2, 0.01, 0.3, t + i * 0.1);
        g.connect(this.out); o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.35);
      });
    });
  }

  // ── Victory — fanfare with chord layers ──────────────────────────────
  playVictory(): void {
    this.safe(() => {
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
    });
  }

  // ── Defeat — descending minor with hollow tone ────────────────────────
  playDefeat(): void {
    this.safe(() => {
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
    });
  }

  // ── Short UI tap ────────────────────────────────────────────────────
  playTap(): void {
    this.safe(() => {
      const ctx = this.getCtx();
      const t = ctx.currentTime;
      const o = this.osc('sine', 900);
      const g = this.env(o, 0.1, 0.002, 0.04, t);
      g.connect(this.out); o.start(t); o.stop(t + 0.05);
    });
  }
}
