import { useCallback, useRef, useState } from 'react';

// Preload an audio file and return a play function
function createSound(src: string, volume = 1, loop = false): { play: () => void; stop: () => void; setVolume: (v: number) => void; audio: HTMLAudioElement } {
  const audio = new Audio(src);
  audio.volume = volume;
  audio.loop = loop;
  audio.preload = 'auto';

  return {
    audio,
    play: () => {
      if (!loop) {
        const clone = audio.cloneNode(true) as HTMLAudioElement;
        clone.volume = audio.volume;
        clone.play().catch(() => {});
      } else {
        if (audio.paused) {
          audio.play().catch(() => {});
        }
      }
    },
    stop: () => {
      audio.pause();
      audio.currentTime = 0;
    },
    setVolume: (v: number) => {
      audio.volume = v;
    },
  };
}

// ── Synthesized fallback sounds (Web Audio API) ──
// Used when audio files aren't loaded yet or as backup

let audioCtx: AudioContext | null = null;
function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function synthHit() {
  const ctx = getCtx(); const t = ctx.currentTime;
  const boom = ctx.createOscillator(); boom.type = 'sine';
  boom.frequency.setValueAtTime(80, t); boom.frequency.exponentialRampToValueAtTime(20, t + 0.5);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  boom.connect(g); g.connect(ctx.destination); boom.start(t); boom.stop(t + 0.65);
  // Noise burst
  const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const n = ctx.createBufferSource(); n.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 600;
  const ng = ctx.createGain(); ng.gain.setValueAtTime(0.25, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  n.connect(f); f.connect(ng); ng.connect(ctx.destination); n.start(t); n.stop(t + 0.45);
}

function synthMiss() {
  const ctx = getCtx(); const t = ctx.currentTime;
  const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const n = ctx.createBufferSource(); n.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass';
  f.frequency.setValueAtTime(2000, t); f.frequency.exponentialRampToValueAtTime(400, t + 0.3);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  n.connect(f); f.connect(g); g.connect(ctx.destination); n.start(t); n.stop(t + 0.4);
}

function synthClick() {
  const ctx = getCtx(); const t = ctx.currentTime;
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.4, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.25);
}

function synthEncrypt() {
  const ctx = getCtx(); const t = ctx.currentTime;
  for (let i = 0; i < 3; i++) {
    const o = ctx.createOscillator(); o.type = 'square';
    o.frequency.setValueAtTime(1200 - i * 300, t + i * 0.06);
    o.frequency.exponentialRampToValueAtTime(400 - i * 80, t + i * 0.06 + 0.05);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.08, t + i * 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.06);
    o.connect(g); g.connect(ctx.destination); o.start(t + i * 0.06); o.stop(t + i * 0.06 + 0.08);
  }
}

function synthVictory() {
  const ctx = getCtx(); const t = ctx.currentTime;
  [261, 329, 392, 523, 659].forEach((freq, i) => {
    const o = ctx.createOscillator(); o.type = i < 3 ? 'triangle' : 'sine'; o.frequency.value = freq;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t + i * 0.15);
    g.gain.linearRampToValueAtTime(0.15, t + i * 0.15 + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.6);
    o.connect(g); g.connect(ctx.destination); o.start(t + i * 0.15); o.stop(t + i * 0.15 + 0.65);
  });
}

function synthHover() {
  const ctx = getCtx();
  const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 1800;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.04, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
  o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.05);
}

// ── Main hook ──

export function useSound() {
  const bgMusic = useRef<ReturnType<typeof createSound> | null>(null);
  const hitSnd = useRef<ReturnType<typeof createSound> | null>(null);
  const missSnd = useRef<ReturnType<typeof createSound> | null>(null);
  const clickSnd = useRef<ReturnType<typeof createSound> | null>(null);
  const encryptSnd = useRef<ReturnType<typeof createSound> | null>(null);
  const victorySnd = useRef<ReturnType<typeof createSound> | null>(null);
  const initialized = useRef(false);

  const [musicOn, setMusicOn] = useState(true);
  const [sfxOn, setSfxOn] = useState(true);

  const init = useCallback(() => {
    if (initialized.current) return;
    initialized.current = true;

    bgMusic.current = createSound('/sounds/pixel-power-surge.mp3', 0.3, true);
    hitSnd.current = createSound('/sounds/explosion.mp3', 0.5);
    missSnd.current = createSound('/sounds/water-splash.mp3', 0.4);
    clickSnd.current = createSound('/sounds/attack-click.mp3', 0.3);
    encryptSnd.current = createSound('/sounds/encrypt.mp3', 0.35);
    victorySnd.current = createSound('/sounds/victory-v4.mp3', 0.5);
  }, []);

  const toggleMusic = useCallback(() => {
    setMusicOn(prev => {
      if (prev) {
        // Pause but don't reset position
        bgMusic.current?.audio && (bgMusic.current.audio.pause());
      } else {
        init();
        bgMusic.current?.audio?.play().catch(() => {});
      }
      return !prev;
    });
  }, [init]);

  const toggleSfx = useCallback(() => {
    setSfxOn(prev => !prev);
  }, []);

  const startDrone = useCallback((volume = 0.3) => {
    init();
    bgMusic.current?.setVolume(volume);
    bgMusic.current?.play();
  }, [init]);

  const setMusicVolume = useCallback((v: number) => {
    bgMusic.current?.setVolume(v);
  }, []);

  const stopDrone = useCallback(() => {
    bgMusic.current?.stop();
  }, []);

  const playSfx = useCallback((
    sndRef: React.RefObject<ReturnType<typeof createSound> | null>,
    fallback: () => void
  ) => {
    if (!sfxOn) return;
    init();
    if (sndRef.current?.audio?.readyState && sndRef.current.audio.readyState >= 2) {
      sndRef.current.play();
    } else {
      fallback();
    }
  }, [init, sfxOn]);

  const attackClick = useCallback(() => playSfx(clickSnd, synthClick), [playSfx]);
  const hit = useCallback(() => playSfx(hitSnd, synthHit), [playSfx]);
  const miss = useCallback(() => playSfx(missSnd, synthMiss), [playSfx]);
  const encrypt = useCallback(() => playSfx(encryptSnd, synthEncrypt), [playSfx]);
  const victory = useCallback(() => playSfx(victorySnd, synthVictory), [playSfx]);

  const hover = useCallback(() => {
    if (!sfxOn) return;
    synthHover();
  }, [sfxOn]);

  const startGame = useCallback(() => {
    if (!sfxOn) return;
    init();
    const ctx = getCtx(); const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(80, t); o.frequency.exponentialRampToValueAtTime(800, t + 0.3);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(200, t); f.frequency.exponentialRampToValueAtTime(4000, t + 0.3);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.4, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o.connect(f); f.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.55);
  }, [init, sfxOn]);

  return {
    startDrone, stopDrone, setMusicVolume, attackClick, hit, miss, encrypt, hover, victory, startGame,
    musicOn, sfxOn, toggleMusic, toggleSfx,
  };
}
