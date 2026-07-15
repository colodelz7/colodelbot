import { useState, useRef, useCallback, useEffect } from 'react';
import { MS_ATE_DORMIR } from '../lib/utils';

const CAMINHOS_BOCA = {
  feliz: 'M104 116 Q120 128 136 116',
  triste: 'M104 124 Q120 112 136 124',
  bravo: 'M104 122 Q120 117 136 122',
  dormindo: 'M110 120 Q120 123 130 120',
};

export function useRobot(soundOn) {
  const [mood, setMoodState] = useState('feliz');
  const [robotState, setRobotState] = useState('idle'); // idle | pensando | falando
  const [speech, setSpeech] = useState('Oi! Eu sou o ColodelBot 👋 Pode me perguntar qualquer coisa.');
  const [online, setOnline] = useState(navigator.onLine);
  const aguardandoRef = useRef(false);
  const timerSonoRef = useRef(null);
  const audioCtxRef = useRef(null);

  const setMood = useCallback((m) => setMoodState(m), []);
  const mouthPath = CAMINHOS_BOCA[mood] || CAMINHOS_BOCA.feliz;

  const resetarTimerSono = useCallback(() => {
    clearTimeout(timerSonoRef.current);
    setMoodState((m) => (m === 'dormindo' ? 'feliz' : m));
    timerSonoRef.current = setTimeout(() => {
      if (!aguardandoRef.current) setMoodState('dormindo');
    }, MS_ATE_DORMIR);
  }, []);

  const marcarAguardando = useCallback((valor) => { aguardandoRef.current = valor; }, []);

  useEffect(() => {
    function atualizarStatus() { setOnline(navigator.onLine); }
    window.addEventListener('online', atualizarStatus);
    window.addEventListener('offline', atualizarStatus);
    return () => {
      window.removeEventListener('online', atualizarStatus);
      window.removeEventListener('offline', atualizarStatus);
    };
  }, []);

  useEffect(() => {
    resetarTimerSono();
    return () => clearTimeout(timerSonoRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tocarBip = useCallback(() => {
    if (!soundOn) return;
    try {
      const audioCtx = audioCtxRef.current || new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const tocarTom = (freqInicial, freqFinal, atraso, duracao, volume) => {
        setTimeout(() => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freqInicial, audioCtx.currentTime);
          if (freqFinal) osc.frequency.exponentialRampToValueAtTime(freqFinal, audioCtx.currentTime + duracao);
          gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(volume, audioCtx.currentTime + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duracao);
          osc.connect(gain).connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + duracao + 0.02);
        }, atraso);
      };
      tocarTom(880, 660, 0, 0.16, 0.11);
      tocarTom(1180, null, 110, 0.09, 0.08);
    } catch { /* Web Audio pode falhar em alguns contextos */ }
  }, [soundOn]);

  const statusTexto = robotState === 'pensando' ? 'PENSANDO...' : robotState === 'falando' ? 'RESPONDENDO' : (online ? 'ONLINE' : 'OFFLINE');
  const hudStatus = robotState === 'pensando' ? 'PENSANDO' : robotState === 'falando' ? 'RESPONDENDO' : 'IDLE';
  const busy = robotState !== 'idle';

  return {
    mood, mouthPath, setMood, robotState, setRobotState, speech, setSpeech,
    online, statusTexto, hudStatus, busy,
    resetarTimerSono, marcarAguardando, tocarBip,
  };
}
