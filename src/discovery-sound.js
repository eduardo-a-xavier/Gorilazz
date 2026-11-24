// Som curto de descoberta (sintetizado com WebAudio): dois tons ascendentes. Opção de silenciar, salva no navegador.
// Com o rádio tocando, o som sai mais baixo (não para o rádio); o rádio pausado ou mutado não muda a regra.
export const SOUND_KEY = 'gorilazz.sound.v1';

export function readSoundOn(storage) {
  try { const data = JSON.parse(storage?.getItem(SOUND_KEY) ?? 'null'); return data?.on !== false; } catch { return true; }
}
export function saveSoundOn(storage, on) {
  try { storage?.setItem(SOUND_KEY, JSON.stringify({ version: 1, on: Boolean(on) })); } catch { /* sem armazenamento: vale nesta visita */ }
}

// Tons da descoberta: frequência, início e duração em segundos. Curtos e suaves.
export function discoveryTones() {
  return [{ freq: 880, at: 0, dur: .16 }, { freq: 1320, at: .11, dur: .26 }];
}

// Volume: mais baixo com o rádio tocando, para não competir com a faixa.
export function discoveryGain(radioPlaying) {
  return radioPlaying ? .09 : .18;
}

export function playDiscovery(audioContext, { radioPlaying = false } = {}) {
  if (!audioContext) return;
  const t0 = audioContext.currentTime + .01, gainValue = discoveryGain(radioPlaying);
  for (const tone of discoveryTones()) {
    const osc = audioContext.createOscillator(), gain = audioContext.createGain();
    osc.type = 'sine'; osc.frequency.value = tone.freq;
    gain.gain.setValueAtTime(0, t0 + tone.at);
    gain.gain.linearRampToValueAtTime(gainValue, t0 + tone.at + .012);
    gain.gain.exponentialRampToValueAtTime(.001, t0 + tone.at + tone.dur);
    osc.connect(gain); gain.connect(audioContext.destination);
    osc.start(t0 + tone.at); osc.stop(t0 + tone.at + tone.dur + .02);
  }
}

export function hornAllowed({ entered, visible, blocked, soundOn, now, lastPlayed }) {
  return entered && visible && !blocked && soundOn && now - lastPlayed >= 800;
}

export function playHorn(audioContext, { radioPlaying = false } = {}) {
  if (!audioContext) return;
  const start = audioContext.currentTime + .01;
  const osc = audioContext.createOscillator(), gain = audioContext.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(235, start);
  osc.frequency.exponentialRampToValueAtTime(185, start + .21);
  gain.gain.setValueAtTime(.001, start);
  gain.gain.linearRampToValueAtTime(radioPlaying ? .035 : .06, start + .025);
  gain.gain.exponentialRampToValueAtTime(.001, start + .24);
  osc.connect(gain); gain.connect(audioContext.destination);
  osc.start(start); osc.stop(start + .25);
}

// Motor procedural: um oscilador filtrado, ganho baixo e rampas para evitar estalos.
export function createEngineSound(context) {
  const oscillator = context.createOscillator(), filter = context.createBiquadFilter(), gain = context.createGain();
  oscillator.type = 'sawtooth'; filter.type = 'lowpass'; filter.frequency.value = 260;
  gain.gain.value = 0; oscillator.connect(filter); filter.connect(gain); gain.connect(context.destination); oscillator.start();
  let previousActive = null;
  return {
    update(speed, active) {
      const t = context.currentTime, kph = Math.min(Math.abs(Number(speed) || 0) * 3.6, 110);
      oscillator.frequency.setTargetAtTime(47 + kph * 1.05, t, .13);
      filter.frequency.setTargetAtTime(180 + kph * 5, t, .18);
      if (Boolean(active) !== previousActive) { previousActive = Boolean(active); gain.gain.setTargetAtTime(active ? .025 : 0, t, .08); }
    },
    dispose() { oscillator.stop(); oscillator.disconnect(); filter.disconnect(); gain.disconnect(); },
  };
}
