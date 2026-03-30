"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  opacityDir: number;
  color: string;
}

const COLORS = [
  "rgba(99,102,241,",   // indigo
  "rgba(34,211,238,",   // cyan
  "rgba(52,211,153,",   // emerald
  "rgba(148,163,184,",  // slate
];

export default function CinematicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];
    let floatingTickers: { x: number; y: number; text: string; opacity: number; vy: number; color: string }[] = [];
    let t = 0;

    const W = () => canvas.width;
    const H = () => canvas.height;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const stockTexts = [
      "+1.24%", "₹2,847", "SELL", "BUY", "+0.87%", "₹3,412",
      "-0.43%", "₹1,623", "+2.11%", "NLP:0.82", "VOL:LOW",
      "AI:↑", "RSI:67", "PCA", "LSTM", "+14.2%", "₹438",
      "HOLD", "0.74", "-1.57%", "₹548", "BULL", "BEAR",
    ];

    const spawnTicker = () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      text: stockTexts[Math.floor(Math.random() * stockTexts.length)],
      opacity: 0,
      vy: -(0.2 + Math.random() * 0.3),
      color: Math.random() > 0.5 ? "rgba(52,211,153," : "rgba(251,113,133,",
    });

    const initParticles = () => {
      particles = Array.from({ length: 80 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.5 + 0.1,
        opacityDir: Math.random() > 0.5 ? 0.003 : -0.003,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }));
      floatingTickers = Array.from({ length: 18 }, spawnTicker);
    };

    const drawPerspectiveGrid = () => {
      const w = W(), h = H();
      const horizonY = h * 0.55;
      const vanishX = w / 2;
      const speed = (t * 0.3) % 60;

      ctx.save();
      ctx.globalAlpha = 0.07;
      ctx.strokeStyle = "rgba(99,102,241,1)";
      ctx.lineWidth = 0.5;

      // Horizontal grid lines (receding into horizon)
      const numH = 14;
      for (let i = 0; i <= numH; i++) {
        const progress = i / numH;
        const perspective = Math.pow(progress, 2.2);
        const y = horizonY + (h - horizonY) * perspective + (speed * perspective);
        if (y > h) continue;
        const xSpread = (w * 1.2) * perspective;
        ctx.globalAlpha = 0.04 + perspective * 0.08;
        ctx.beginPath();
        ctx.moveTo(vanishX - xSpread / 2, y);
        ctx.lineTo(vanishX + xSpread / 2, y);
        ctx.stroke();
      }

      // Vertical grid lines (converging to vanishing point)
      const numV = 16;
      ctx.globalAlpha = 0.05;
      for (let i = 0; i <= numV; i++) {
        const t2 = i / numV;
        const baseX = w * 1.2 * t2 - w * 0.1;
        ctx.beginPath();
        ctx.moveTo(vanishX, horizonY);
        ctx.lineTo(baseX, h);
        ctx.globalAlpha = 0.03 + Math.abs(t2 - 0.5) * 0.04;
        ctx.stroke();
      }
      ctx.restore();

      // Horizon glow
      const grad = ctx.createLinearGradient(0, horizonY - 60, 0, horizonY + 60);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.5, "rgba(99,102,241,0.06)");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, horizonY - 60, w, 120);
    };

    const drawParticles = () => {
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity += p.opacityDir;
        if (p.opacity >= 0.6 || p.opacity <= 0.05) p.opacityDir *= -1;
        if (p.x < 0) p.x = W();
        if (p.x > W()) p.x = 0;
        if (p.y < 0) p.y = H();
        if (p.y > H()) p.y = 0;

        // Glow
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
        grd.addColorStop(0, `${p.color}${p.opacity})`);
        grd.addColorStop(1, `${p.color}0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.min(p.opacity * 2, 0.9)})`;
        ctx.fill();
      });
    };

    const drawFloatingTickers = () => {
      ctx.font = "600 10px 'SF Mono', 'Fira Code', monospace";
      floatingTickers.forEach((tk, i) => {
        tk.y += tk.vy;
        if (tk.opacity < 0.35) tk.opacity = Math.min(tk.opacity + 0.006, 0.35);
        if (tk.y < -30) {
          floatingTickers[i] = spawnTicker();
          floatingTickers[i].y = H() + 10;
          floatingTickers[i].opacity = 0;
        }

        ctx.globalAlpha = tk.opacity;
        ctx.fillStyle = `${tk.color}1)`;
        ctx.fillText(tk.text, tk.x, tk.y);
        ctx.globalAlpha = 1;
      });
    };

    const drawVignette = () => {
      const w = W(), h = H();
      const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.85);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(1, "rgba(7,10,18,0.65)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    };

    const render = () => {
      t += 1;
      ctx.clearRect(0, 0, W(), H());

      drawPerspectiveGrid();
      drawParticles();
      drawFloatingTickers();
      drawVignette();

      animId = requestAnimationFrame(render);
    };

    resize();
    initParticles();
    render();

    window.addEventListener("resize", () => { resize(); initParticles(); });
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      aria-hidden
    />
  );
}
