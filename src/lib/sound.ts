/**
 * Sistema de som usando Web Audio API pura — sem assets externos.
 * Todos os sons são sintetizados programaticamente.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function getVolume(): number {
  try {
    const raw = localStorage.getItem('settings');
    if (raw) {
      const s = JSON.parse(raw);
      if (typeof s?.volume === 'number') return s.volume / 100;
    }
  } catch { /* */ }
  return 0.7;
}

function isEnabled(): boolean {
  try {
    const raw = localStorage.getItem('settings');
    if (raw) {
      const s = JSON.parse(raw);
      return s?.sound_enabled !== false;
    }
  } catch { /* */ }
  return true;
}

/** Apito curto (início/fim de jogo) */
export function playWhistle(): void {
  if (!isEnabled()) return;
  try {
    const ac = getCtx();
    const vol = getVolume();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.frequency.setValueAtTime(880, ac.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, ac.currentTime + 0.1);
    osc.frequency.linearRampToValueAtTime(880, ac.currentTime + 0.3);
    gain.gain.setValueAtTime(vol * 0.3, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4);
    osc.start();
    osc.stop(ac.currentTime + 0.4);
  } catch { /* */ }
}

/** Som de gol — jingle alegre */
export function playGoal(): void {
  if (!isEnabled()) return;
  try {
    const ac = getCtx();
    const vol = getVolume();
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = 'square';
      osc.frequency.value = freq;
      const t = ac.currentTime + i * 0.12;
      gain.gain.setValueAtTime(vol * 0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  } catch { /* */ }
}

/** Som de derrota — decrescente */
export function playDefeat(): void {
  if (!isEnabled()) return;
  try {
    const ac = getCtx();
    const vol = getVolume();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.frequency.setValueAtTime(400, ac.currentTime);
    osc.frequency.linearRampToValueAtTime(200, ac.currentTime + 0.6);
    gain.gain.setValueAtTime(vol * 0.25, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.7);
    osc.start();
    osc.stop(ac.currentTime + 0.7);
  } catch { /* */ }
}

/** Click em botão */
export function playClick(): void {
  if (!isEnabled()) return;
  try {
    const ac = getCtx();
    const vol = getVolume();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.frequency.value = 600;
    gain.gain.setValueAtTime(vol * 0.1, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05);
    osc.start();
    osc.stop(ac.currentTime + 0.05);
  } catch { /* */ }
}

/** Notificação de chat */
export function playChatNotification(): void {
  if (!isEnabled()) return;
  try {
    const ac = getCtx();
    const vol = getVolume();
    [800, 1000].forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.frequency.value = freq;
      const t = ac.currentTime + i * 0.08;
      gain.gain.setValueAtTime(vol * 0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.start(t);
      osc.stop(t + 0.1);
    });
  } catch { /* */ }
}

/** Conquista desbloqueada */
export function playAchievement(): void {
  if (!isEnabled()) return;
  try {
    const ac = getCtx();
    const vol = getVolume();
    const notes = [523, 784, 1047, 1568]; // fanfare
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const t = ac.currentTime + i * 0.1;
      gain.gain.setValueAtTime(vol * 0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  } catch { /* */ }
}
