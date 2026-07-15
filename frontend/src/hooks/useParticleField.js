import { useEffect } from 'react';

export function useParticleField(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const prefereReduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const CORES = ['43, 217, 197', '155, 123, 255', '100, 120, 235'];
    const DISTANCIA_LIGACAO = 130;
    let largura, altura, particulas, raf;

    function redimensionar() {
      largura = canvas.width = window.innerWidth;
      altura = canvas.height = window.innerHeight;
    }

    function criarParticulas() {
      const quantidade = window.innerWidth < 700 ? 26 : 46;
      particulas = Array.from({ length: quantidade }, () => ({
        x: Math.random() * largura, y: Math.random() * altura,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        cor: CORES[Math.floor(Math.random() * CORES.length)],
        raio: 1 + Math.random() * 1.4,
      }));
    }

    function passo() {
      ctx.clearRect(0, 0, largura, altura);
      for (const p of particulas) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > largura) p.vx *= -1;
        if (p.y < 0 || p.y > altura) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.raio, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.cor}, 0.6)`;
        ctx.fill();
      }
      for (let i = 0; i < particulas.length; i++) {
        for (let j = i + 1; j < particulas.length; j++) {
          const a = particulas[i], b = particulas[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < DISTANCIA_LIGACAO) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${a.cor}, ${0.12 * (1 - dist / DISTANCIA_LIGACAO)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      if (!prefereReduzirMovimento) raf = requestAnimationFrame(passo);
    }

    function onResize() { redimensionar(); criarParticulas(); }

    redimensionar();
    criarParticulas();
    window.addEventListener('resize', onResize);
    if (prefereReduzirMovimento) passo();
    else raf = requestAnimationFrame(passo);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, [canvasRef]);
}
