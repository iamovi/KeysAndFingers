import { useCallback, useRef } from 'react';

class SoundEngine {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.08) {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  keystroke() {
    this.playTone(800 + Math.random() * 200, 0.05, 'square', 0.04);
  }

  error() {
    this.playTone(200, 0.15, 'sawtooth', 0.06);
  }

  complete() {
    const ctx = this.getCtx();
    [523, 659, 784, 1047].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.1), i * 120);
    });
  }

  milestone() {
    this.playTone(1200, 0.1, 'sine', 0.06);
    setTimeout(() => this.playTone(1600, 0.15, 'sine', 0.06), 80);
  }
}

const engine = new SoundEngine();

export const useSoundEffects = (enabled: boolean) => {
  const playKeystroke = useCallback(() => {
    if (enabled) engine.keystroke();
  }, [enabled]);

  const playError = useCallback(() => {
    if (enabled) engine.error();
  }, [enabled]);

  const playComplete = useCallback(() => {
    if (enabled) engine.complete();
  }, [enabled]);

  const playMilestone = useCallback(() => {
    if (enabled) engine.milestone();
  }, [enabled]);

  return { playKeystroke, playError, playComplete, playMilestone };
};
