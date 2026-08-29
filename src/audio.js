export class AudioFX {
  constructor() { this.muted = localStorage.getItem('rocketLanderMuted') === '1'; this.ctx = null; this.engine = null; this.unavailable = false; }
  on() { if (this.ctx || this.unavailable || this.muted) return this.ctx; try { const Context = globalThis.AudioContext || globalThis.webkitAudioContext; if (!Context) throw new Error('Web Audio unavailable'); this.ctx = new Context(); if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); } catch (_) { this.unavailable = true; } return this.ctx; }
  tone(frequency, duration = .08, type = 'square', volume = .035) { if (this.muted || !this.on()) return; try { const oscillator = this.ctx.createOscillator(), gain = this.ctx.createGain(); oscillator.type = type; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(volume, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, this.ctx.currentTime + duration); oscillator.connect(gain).connect(this.ctx.destination); oscillator.start(); oscillator.stop(this.ctx.currentTime + duration); } catch (_) {} }
  thrust(active) { if (this.muted || !active) { if (this.engine) { try { this.engine.stop(); } catch (_) {} } this.engine = null; return; } if (!this.on() || this.engine) return; try { const oscillator = this.ctx.createOscillator(), gain = this.ctx.createGain(); oscillator.type = 'sawtooth'; oscillator.frequency.value = 65; gain.gain.value = .022; oscillator.connect(gain).connect(this.ctx.destination); oscillator.start(); this.engine = oscillator; } catch (_) { this.unavailable = true; } }
  land() { this.tone(440, .1); setTimeout(() => this.tone(660, .18), 90); }
  crash() { this.tone(90, .35, 'sawtooth', .06); }
  advanced() { this.tone(330, .1); setTimeout(() => this.tone(660, .18), 110); }
  toggle() { this.muted = !this.muted; localStorage.setItem('rocketLanderMuted', this.muted ? '1' : '0'); if (this.muted) this.thrust(false); return this.muted; }
}
