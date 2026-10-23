/**
 * Procedural Web Audio API sound synthesizer for Mochi Companion.
 * Zero external sound files required; completely offline and lightweight.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const SoundEffects = {
  chirp(volume = 0.3) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(volume * 0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  },

  waterDrop(volume = 0.35) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Pitch sweep mimicking a water droplet
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.15);

    gain.gain.setValueAtTime(volume * 0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  },

  timerComplete(volume = 0.4) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Harmonious dual bell chime (E5 -> G#5 -> B5)
    const notes = [659.25, 830.61, 987.77];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.001, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(volume * 0.18, now + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.6);
    });
  },

  breakChime(volume = 0.35) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Warm relaxing two-tone chime
    const freqs = [523.25, 659.25]; // C5, E5
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.18);

      gain.gain.setValueAtTime(volume * 0.16, now + idx * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.18);
      osc.stop(now + idx * 0.18 + 0.5);
    });
  },

  chime(volume = 0.3) {
    this.breakChime(volume);
  },

  celebrate(volume = 0.4) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Joyful upward arpeggio: C5 -> E5 -> G5 -> C6
    const chord = [523.25, 659.25, 783.99, 1046.5];
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(volume * 0.18, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.4);
    });
  },

  bonk(volume = 0.25) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Comical soft cartoon bonk / dizzy boing
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);

    gain.gain.setValueAtTime(volume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  },

  party(volume = 0.3) {
    this.celebrate(volume);
  },

  gitCommit(volume = 0.35) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Rapid triumphant major triad: G5 -> C6 -> E6
    const freqs = [783.99, 1046.5, 1318.51];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(volume * 0.16, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.3);
    });
  },

  purr(volume = 0.25) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.15);
    osc.frequency.linearRampToValueAtTime(90, now + 0.3);

    gain.gain.setValueAtTime(volume * 0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);
  },

  treatEat(volume = 0.3) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [440, 554.37, 659.25];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(volume * 0.15, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.2);
    });
  },

  whoosh(volume = 0.2) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.14);
    gain.gain.setValueAtTime(volume * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  },

  appleChime(volume = 0.3) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Pristine Apple-style glassy harmonic chime arpeggio: C#5 -> F#5 -> A#5 -> C#6
    const chord = [554.37, 739.99, 932.33, 1108.73];
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.001, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(volume * 0.16, now + idx * 0.05 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + idx * 0.05 + 0.42);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.45);
    });
  },

  appleSleep(volume = 0.25) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Gentle descending harmonic lullaby for graceful quit: F#5 -> D#5 -> B4
    const notes = [739.99, 622.25, 493.88];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0.001, now + idx * 0.09);
      gain.gain.linearRampToValueAtTime(volume * 0.14, now + idx * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + idx * 0.09 + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.4);
    });
  },

  codeFlow(_volume = 0.2) {
    // Kept silent during typing to avoid audio pollution
  },

  keyboardTap(_volume = 0.1) {
    // Disabled / silent so typing does not create noise
  },
};

