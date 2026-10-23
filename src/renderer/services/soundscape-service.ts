import { SoundscapePreset } from '../../shared/types';

class ProceduralSoundscapeService {
  private ctx: AudioContext | null = null;
  private currentPreset: SoundscapePreset = 'off';
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private activeNodes: { stop?: () => void; disconnect?: () => void }[] = [];
  private volume: number = 0.5;

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.smoothingTimeConstant = 0.8;

        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setVolume(val: number): void {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentPreset(): SoundscapePreset {
    return this.currentPreset;
  }

  public play(preset: SoundscapePreset): void {
    if (preset === this.currentPreset && preset !== 'off') return;
    this.stop();

    if (preset === 'off') {
      this.currentPreset = 'off';
      return;
    }

    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    this.currentPreset = preset;

    if (preset === 'rain') {
      this.startRain(ctx, this.masterGain);
    } else if (preset === 'cafe') {
      this.startCafe(ctx, this.masterGain);
    } else if (preset === 'forest') {
      this.startForest(ctx, this.masterGain);
    } else if (preset === 'binaural') {
      this.startBinaural(ctx, this.masterGain);
    }
  }

  public stop(): void {
    for (const node of this.activeNodes) {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch {
        // ignore
      }
    }
    this.activeNodes = [];
    this.currentPreset = 'off';
  }

  private startRain(ctx: AudioContext, destination: GainNode): void {
    // Generate pink noise buffer for rain body
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to soft rain hiss
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, ctx.currentTime);

    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0.6, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(destination);

    whiteNoise.start();
    this.activeNodes.push(whiteNoise, filter, rainGain);
  }

  private startCafe(ctx: AudioContext, destination: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.06;
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    // Lowpass filter for warm background coffee shop murmur
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, ctx.currentTime);

    const cafeGain = ctx.createGain();
    cafeGain.gain.setValueAtTime(0.5, ctx.currentTime);

    source.connect(filter);
    filter.connect(cafeGain);
    cafeGain.connect(destination);

    source.start();
    this.activeNodes.push(source, filter, cafeGain);
  }

  private startForest(ctx: AudioContext, destination: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.05;
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    // Swept bandpass filter simulating gentle breeze through trees
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420, ctx.currentTime);
    filter.Q.setValueAtTime(1.8, ctx.currentTime);

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.18, ctx.currentTime); // slow organic wave

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(180, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const forestGain = ctx.createGain();
    forestGain.gain.setValueAtTime(0.65, ctx.currentTime);

    source.connect(filter);
    filter.connect(forestGain);
    forestGain.connect(destination);

    source.start();
    lfo.start();
    this.activeNodes.push(source, filter, lfo, lfoGain, forestGain);
  }

  private startBinaural(ctx: AudioContext, destination: GainNode): void {
    // 200 Hz Base Frequency, 210 Hz Right Frequency -> 10 Hz Alpha Wave Flow State
    const oscL = ctx.createOscillator();
    const oscR = ctx.createOscillator();

    oscL.type = 'sine';
    oscR.type = 'sine';
    oscL.frequency.setValueAtTime(196, ctx.currentTime); // G3
    oscR.frequency.setValueAtTime(206, ctx.currentTime); // 10Hz offset for Alpha Wave

    const pannerL = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const pannerR = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

    if (pannerL) pannerL.pan.setValueAtTime(-0.85, ctx.currentTime);
    if (pannerR) pannerR.pan.setValueAtTime(0.85, ctx.currentTime);

    const binauralGain = ctx.createGain();
    binauralGain.gain.setValueAtTime(0.35, ctx.currentTime);

    if (pannerL && pannerR) {
      oscL.connect(pannerL);
      pannerL.connect(binauralGain);

      oscR.connect(pannerR);
      pannerR.connect(binauralGain);
    } else {
      oscL.connect(binauralGain);
      oscR.connect(binauralGain);
    }

    binauralGain.connect(destination);

    oscL.start();
    oscR.start();
    this.activeNodes.push(oscL, oscR, binauralGain);
  }

  public getAudioEnergy(): number {
    if (!this.analyser || this.currentPreset === 'off') return 0;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return sum / (dataArray.length * 255);
  }
}

export const SoundscapeService = new ProceduralSoundscapeService();
