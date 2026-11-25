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

// Calcula o RPM e a marcha virtual (1ª a 4ª) do motor buggy a partir da velocidade em km/h.
export function engineRpmForSpeed(kph) {
  const s = Math.max(0, Math.min(110, Number(kph) || 0));
  const gears = [[0, 22], [18, 46], [38, 74], [64, 110]];
  const idx = s < 21 ? 0 : s < 44 ? 1 : s < 70 ? 2 : 3;
  const [lo, hi] = gears[idx];
  const ratio = Math.max(0, Math.min(1, (s - lo) / (hi - lo)));
  const rpm = 850 + ratio * 3150;
  return { gear: idx + 1, rpm, fundamentalHz: 34 + (rpm / 4000) * 58 + s * .38 };
}

// Atenuação espacial quadrática suave (0 a 1) entre a posição do ouvinte e uma fonte sonora (praça ou caixa de palco).
export function spatialAttenuation(listener, source, maxRadius = 32) {
  if (!listener || !source) return 0;
  const d = Math.hypot((listener.x ?? 0) - (source.x ?? 0), (listener.z ?? 0) - (source.z ?? 0));
  if (d >= maxRadius) return 0;
  const u = 1 - d / maxRadius;
  return u * u;
}

// Motor procedural encorpado (estilo buggy): fundamental sawtooth + sub-harmônico grave (triangle) + harmônico de combustão,
// com transição de marchas/RPM, atenuação espacial de pombos nas praças e caixas dos palcos no mesmo controle de mudo.
export function createEngineSound(context, { plazas = [], stages = [] } = {}) {
  const oscillator = context.createOscillator(), filter = context.createBiquadFilter(), gain = context.createGain();
  oscillator.type = 'sawtooth'; filter.type = 'lowpass'; filter.frequency.value = 260;
  gain.gain.value = 0; oscillator.connect(filter); filter.connect(gain); gain.connect(context.destination); oscillator.start();

  // Camadas extras do motor buggy e ambiente espacial (criadas quando o AudioContext suporta múltiplos nós independentes)
  const subOsc = context.createOscillator(), subGain = context.createGain();
  const harmOsc = context.createOscillator(), harmGain = context.createGain();
  const stageOsc = context.createOscillator(), stageFilter = context.createBiquadFilter(), stageGain = context.createGain();
  const birdOsc = context.createOscillator(), birdGain = context.createGain();
  const layered = subOsc !== oscillator && subGain !== gain;
  if (layered) {
    subOsc.type = 'triangle'; subOsc.frequency.value = 24;
    subGain.gain.value = 0; subOsc.connect(filter);

    harmOsc.type = 'square'; harmOsc.frequency.value = 72;
    harmGain.gain.value = .35; harmOsc.connect(harmGain); harmGain.connect(filter);
    subOsc.start(); harmOsc.start();

    // Caixas de som dos palcos: pulso grave filtrado com atenuação espacial por distância
    stageOsc.type = 'triangle'; stageOsc.frequency.value = 55;
    stageFilter.type = 'lowpass'; stageFilter.frequency.value = 160;
    stageGain.gain.value = 0;
    stageOsc.connect(stageFilter); stageFilter.connect(stageGain); stageGain.connect(context.destination);
    stageOsc.start();

    // Pombos / pássaros ambiente nas praças: arrulho suave modulado no tempo quando perto das praças
    birdOsc.type = 'sine'; birdOsc.frequency.value = 520;
    birdGain.gain.value = 0;
    birdOsc.connect(birdGain); birdGain.connect(context.destination);
    birdOsc.start();
  }

  let previousActive = null;
  return {
    update(speed, active, { x = 0, z = 0, radioPlaying = false } = {}) {
      const t = context.currentTime, kph = Math.min(Math.abs(Number(speed) || 0) * 3.6, 110);
      const { fundamentalHz, rpm } = engineRpmForSpeed(kph);
      oscillator.frequency.setTargetAtTime(fundamentalHz, t, .11);
      filter.frequency.setTargetAtTime(165 + (rpm / 4000) * 340 + kph * 2.4, t, .15);
      const isOn = Boolean(active);
      const duck = radioPlaying ? .55 : 1;
      const engineLevel = isOn ? (.028 + Math.min(.014, kph * .00018)) * duck : 0;
      if (isOn !== previousActive || isOn) {
        previousActive = isOn;
        gain.gain.setTargetAtTime(engineLevel, t, .08);
      }
      if (layered) {
        subOsc.frequency.setTargetAtTime(fundamentalHz * .5, t, .12);
        harmOsc.frequency.setTargetAtTime(fundamentalHz * 1.5, t, .12);

        // Atenuação espacial por distância nas caixas dos palcos (raio 34 m)
        let maxStage = 0, stageIndex = 0;
        for (let i = 0; i < stages.length; i++) {
          const att = spatialAttenuation({ x, z }, stages[i], 34);
          if (att > maxStage) { maxStage = att; stageIndex = i; }
        }
        const stageNotes = [55, 65.41, 73.42, 49];
        const pulse = .75 + .25 * Math.sin(t * 7.5);
        stageOsc.frequency.setTargetAtTime(stageNotes[stageIndex % 4], t, .15);
        stageGain.gain.setTargetAtTime(isOn ? maxStage * .016 * pulse * duck : 0, t, .12);

        // Pombos / pássaros nas praças (raio 30 m): arrulho curto intermitente (~520–640 Hz)
        let maxPlaza = 0;
        for (let i = 0; i < plazas.length; i++) {
          const att = spatialAttenuation({ x, z }, plazas[i], 30);
          if (att > maxPlaza) maxPlaza = att;
        }
        const cooGate = Math.max(0, Math.sin(t * 2.1) * Math.sin(t * 5.7));
        const cooFreq = 510 + 110 * Math.sin(t * 14);
        birdOsc.frequency.setTargetAtTime(cooFreq, t, .06);
        birdGain.gain.setTargetAtTime(isOn ? maxPlaza * cooGate * .011 * duck : 0, t, .08);
      }
    },
    dispose() {
      oscillator.stop(); oscillator.disconnect(); filter.disconnect(); gain.disconnect();
      if (layered) {
        for (const n of [subOsc, harmOsc, stageOsc, birdOsc]) { try { n.stop(); n.disconnect(); } catch {} }
        for (const g of [subGain, harmGain, stageFilter, stageGain, birdGain]) { try { g.disconnect(); } catch {} }
      }
    },
  };
}
