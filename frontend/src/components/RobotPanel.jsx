import { useRef, useEffect, useState } from 'react';

const FRASES_CUTUCAR = [
  'Oi de novo! 👀',
  'Pode perguntar, eu tô aqui.',
  'Bipe bop. Tudo certo por aqui.',
  'Bora trocar uma ideia?',
  'Manda a pergunta!',
];

export default function RobotPanel({ robot, hudSession, hudMessages }) {
  const domeRef = useRef(null);
  const eyeLRef = useRef(null);
  const eyeRRef = useRef(null);
  const sparksRef = useRef(null);
  const [pulseActive, setPulseActive] = useState(false);

  useEffect(() => {
    const prefereReduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefereReduzirMovimento) return;
    function onMouseMove(evento) {
      const rect = domeRef.current.getBoundingClientRect();
      const centroX = rect.left + rect.width / 2;
      const centroY = rect.top + rect.height / 2;
      const deltaX = (evento.clientX - centroX) / window.innerWidth;
      const deltaY = (evento.clientY - centroY) / window.innerHeight;
      domeRef.current.style.transform = `translate(${deltaX * 6}px, ${deltaY * 6}px)`;
      const pupilX = Math.max(-3, Math.min(3, deltaX * 14));
      const pupilY = Math.max(-2.5, Math.min(2.5, deltaY * 14));
      const t = `translate(${pupilX}px, ${pupilY}px)`;
      if (eyeLRef.current) eyeLRef.current.style.transform = t;
      if (eyeRRef.current) eyeRRef.current.style.transform = t;
    }
    document.addEventListener('mousemove', onMouseMove);
    return () => document.removeEventListener('mousemove', onMouseMove);
  }, []);

  function dispararFaiscas(quantidade = 7) {
    for (let i = 0; i < quantidade; i++) {
      const spark = document.createElement('span');
      spark.className = 'spark';
      const angulo = Math.random() * Math.PI * 2;
      const distancia = 26 + Math.random() * 26;
      spark.style.setProperty('--spark-x', `${Math.cos(angulo) * distancia}px`);
      spark.style.setProperty('--spark-y', `${Math.sin(angulo) * distancia}px`);
      spark.style.left = `${45 + Math.random() * 10}%`;
      spark.style.top = `${40 + Math.random() * 10}%`;
      spark.style.animationDelay = `${Math.random() * 0.15}s`;
      sparksRef.current?.appendChild(spark);
      setTimeout(() => spark.remove(), 950);
    }
  }

  function onRobotClick() {
    robot.resetarTimerSono();
    setPulseActive(false);
    requestAnimationFrame(() => setPulseActive(true));
    robot.setSpeech(FRASES_CUTUCAR[Math.floor(Math.random() * FRASES_CUTUCAR.length)]);
    dispararFaiscas(4);
  }

  // expõe pra quem envia mensagem (App) disparar faíscas ao terminar
  useEffect(() => {
    robot._dispararFaiscas = dispararFaiscas;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const domeClasses = [
    'dome',
    robot.robotState === 'pensando' ? 'is-thinking' : '',
    robot.robotState === 'falando' ? 'is-talking' : '',
    robot.mood === 'bravo' ? 'is-angry' : '',
    robot.mood === 'dormindo' ? 'is-sleeping' : '',
    'is-idle-glance',
  ].filter(Boolean).join(' ');

  return (
    <section className="robot-panel" aria-label="ColodelBot, assistente virtual">
      <div className={domeClasses} id="dome" ref={domeRef}>
        <svg className="circuit" viewBox="0 0 240 240" aria-hidden="true">
          <path className="circuit__line" d="M20 60 H70 V30" />
          <path className="circuit__line" d="M220 70 H180 V110" />
          <path className="circuit__line" d="M25 190 H75 V160" />
          <path className="circuit__line" d="M215 185 H165 V150" />
          <circle className="circuit__node" cx="70" cy="30" r="3" />
          <circle className="circuit__node" cx="180" cy="110" r="3" />
          <circle className="circuit__node" cx="75" cy="160" r="3" />
          <circle className="circuit__node" cx="165" cy="150" r="3" />
        </svg>

        <div className="dome__ring dome__ring--outer" aria-hidden="true"></div>
        <div className="dome__ring dome__ring--scan" id="scanRing" aria-hidden="true"></div>
        <div className="dome__hex" aria-hidden="true"></div>

        <div className="orbit orbit--1" aria-hidden="true">
          <div className="badge badge--code" title="Código">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none"><path d="M9 6L3 12L9 18M15 6L21 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
        <div className="orbit orbit--2" aria-hidden="true">
          <div className="badge badge--braces" title="Dados">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none"><path d="M8 3C6 3 5.5 4 5.5 6V9C5.5 10.5 5 11 3.5 11.5C5 12 5.5 12.5 5.5 14V17C5.5 19 6 20 8 20M16 3C18 3 18.5 4 18.5 6V9C18.5 10.5 19 11 20.5 11.5C19 12 18.5 12.5 18.5 14V17C18.5 19 18 20 16 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
        <div className="orbit orbit--3" aria-hidden="true">
          <div className="badge badge--terminal" title="Terminal">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none"><path d="M4 5H20V19H4V5Z" stroke="currentColor" strokeWidth="1.6"/><path d="M7 9L10 12L7 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 15H16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </div>
        </div>

        <button className="robot" id="robotButton" aria-label="Cutucar o ColodelBot" onClick={onRobotClick}>
          <svg viewBox="0 0 240 240" className="robot__svg" aria-hidden="true">
            <ellipse cx="120" cy="222" rx="62" ry="9" fill="#04101c" opacity="0.35" />
            <path className="robot__body" d="M58 226 C 54 176, 70 150, 120 150 C 170 150, 186 176, 182 226 Z" />
            <line className="robot__antenna-stem" x1="120" y1="46" x2="120" y2="22" />
            <circle className="robot__antenna-tip" cx="120" cy="16" r="6" />
            <circle className="robot__ear" cx="186" cy="98" r="20" />
            <circle className="robot__ear-ring" cx="186" cy="98" r="13" />
            <circle className="robot__ear-glow" cx="186" cy="98" r="6" />
            <circle className="robot__ear" cx="54" cy="98" r="14" />
            <rect className="robot__head" x="46" y="40" width="148" height="118" rx="46" />
            <rect className="robot__face" x="68" y="64" width="104" height="72" rx="26" />
            <path className="robot__brow robot__brow--l" d="M88 84 L104 90" />
            <path className="robot__brow robot__brow--r" d="M152 84 L136 90" />
            <g>
              <g ref={eyeLRef}><ellipse className="robot__eye" cx="100" cy="100" rx="10" ry="14" /></g>
              <g ref={eyeRRef}><ellipse className="robot__eye" cx="140" cy="100" rx="10" ry="14" /></g>
            </g>
            <path className="robot__mouth" d={robot.mouthPath} />
            <text className="robot__zzz" x="172" y="52">z</text>
            <text className="robot__zzz robot__zzz--big" x="184" y="36">Z</text>
          </svg>
          <div className={`robot__pulse${pulseActive ? ' is-active' : ''}`} aria-hidden="true"></div>
          <div className="robot__sparks" ref={sparksRef} aria-hidden="true"></div>
        </button>

        <div className="platform" aria-hidden="true">
          <div className="platform__ring"></div>
          <div className="platform__beam"></div>
        </div>
      </div>

      <p className="robot__speech">{robot.speech}</p>

      <div className="hud">
        <div className="hud__row"><span className="hud__label">SESSÃO</span><span className="hud__value">{hudSession}</span></div>
        <div className="hud__row"><span className="hud__label">MENSAGENS</span><span className="hud__value">{hudMessages}</span></div>
        <div className="hud__row"><span className="hud__label">MODELO</span><span className="hud__value">gemini-2.5-flash</span></div>
        <div className="hud__row"><span className="hud__label">STATUS</span><span className="hud__value">{robot.hudStatus}</span></div>
      </div>
    </section>
  );
}
