/** Procedural Ledger / combat SFX. Unlocks on first gesture. */
export class GameAudio {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  sfx: GainNode | null = null;
  muted = false;
  volume = 0.7;

  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx({ latencyHint: "interactive" });
      this.master = this.ctx.createGain();
      this.sfx = this.ctx.createGain();
      this.sfx.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.applyVolume();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  applyVolume() {
    if (!this.master) return;
    const v = this.muted ? 0 : this.volume * this.volume;
    this.master.gain.setTargetAtTime(v, this.ctx!.currentTime, 0.02);
  }

  setMuted(m: boolean) {
    this.muted = m;
    this.applyVolume();
  }

  private beep(freq: number, dur: number, type: OscillatorType, gain: number, slide = 0) {
    if (!this.ctx || !this.sfx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.sfx);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    osc.onended = () => {
      osc.disconnect();
      g.disconnect();
    };
  }

  private noise(dur: number, gain: number, hp = 800) {
    if (!this.ctx || !this.sfx || this.muted) return;
    const t = this.ctx.currentTime;
    const n = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = n;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = hp;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfx);
    src.start(t);
    src.stop(t + dur);
    src.onended = () => {
      src.disconnect();
      filter.disconnect();
      g.disconnect();
    };
  }

  swing() {
    this.noise(0.08, 0.12, 1200);
    this.beep(180 + Math.random() * 40, 0.07, "square", 0.04, -80);
  }
  hit() {
    this.beep(140, 0.09, "sawtooth", 0.08, -90);
    this.noise(0.05, 0.1, 400);
  }
  dash() {
    this.noise(0.12, 0.09, 600);
    this.beep(420, 0.1, "sine", 0.05, -200);
  }
  skill() {
    this.beep(520, 0.18, "triangle", 0.07, -260);
    this.beep(260, 0.22, "sine", 0.05, 80);
  }
  summon() {
    this.beep(90, 0.28, "sawtooth", 0.06, 40);
    this.beep(180, 0.2, "square", 0.03, 120);
  }
  death() {
    this.beep(220, 0.4, "sine", 0.08, -160);
    this.noise(0.25, 0.12, 200);
  }
  stamp() {
    this.beep(880, 0.05, "square", 0.04);
    this.beep(220, 0.12, "triangle", 0.05);
  }
  pickup() {
    this.beep(660, 0.1, "sine", 0.05, 200);
  }
  hurt() {
    this.beep(110, 0.16, "sawtooth", 0.07, -50);
  }
  win() {
    this.beep(392, 0.18, "triangle", 0.06);
    this.beep(523, 0.22, "triangle", 0.05);
    this.beep(784, 0.4, "sine", 0.05);
  }
}
