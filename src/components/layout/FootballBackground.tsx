import { useEffect, useRef } from 'react';

const FootballBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let time = 0;

    const drawStadium = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const alpha = 0.18;

      // --- Stadium oval / bowl outline ---
      ctx.save();
      const cx = w / 2;
      const cy = h * 0.45;
      const rx = w * 0.42;
      const ry = h * 0.32;

      // Outer stadium ring
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(45, 100%, 50%, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner stadium ring
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 0.85, ry * 0.85, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(45, 100%, 50%, ${alpha * 0.7})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // --- Pitch rectangle inside ---
      const pitchW = rx * 1.2;
      const pitchH = ry * 0.9;
      const px = cx - pitchW / 2;
      const py = cy - pitchH / 2;

      ctx.strokeStyle = `hsla(45, 100%, 50%, ${alpha * 0.8})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py, pitchW, pitchH);

      // Center line
      ctx.beginPath();
      ctx.moveTo(cx, py);
      ctx.lineTo(cx, py + pitchH);
      ctx.stroke();

      // Center circle
      const centerR = Math.min(pitchW, pitchH) * 0.15;
      ctx.beginPath();
      ctx.arc(cx, cy, centerR, 0, Math.PI * 2);
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(45, 100%, 50%, ${alpha})`;
      ctx.fill();

      // Penalty areas
      const penW = pitchW * 0.18;
      const penH = pitchH * 0.4;
      // Left
      ctx.strokeRect(px, cy - penH / 2, penW, penH);
      // Right
      ctx.strokeRect(px + pitchW - penW, cy - penH / 2, penW, penH);

      // Goal areas
      const goalW = pitchW * 0.07;
      const goalH = pitchH * 0.2;
      ctx.strokeRect(px, cy - goalH / 2, goalW, goalH);
      ctx.strokeRect(px + pitchW - goalW, cy - goalH / 2, goalW, goalH);

      ctx.restore();

      // --- Stadium lights (top) ---
      const lightCount = 6;
      for (let i = 0; i < lightCount; i++) {
        const angle = (Math.PI / (lightCount + 1)) * (i + 1);
        const lx = cx + Math.cos(Math.PI + angle) * (rx + 30);
        const ly = cy + Math.sin(Math.PI + angle) * (ry + 30) - 20;

        // Light pole
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx, ly - 40);
        ctx.strokeStyle = `hsla(45, 100%, 50%, ${alpha * 0.5})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Light glow — animated flicker
        const flicker = 0.7 + 0.3 * Math.sin(time * 0.02 + i * 1.2);
        const grad = ctx.createRadialGradient(lx, ly - 40, 0, lx, ly - 40, 60);
        grad.addColorStop(0, `hsla(45, 100%, 70%, ${alpha * 1.5 * flicker})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(lx - 60, ly - 100, 120, 120);
      }

      // --- Floating light particles (like stadium atmosphere) ---
      for (let i = 0; i < 20; i++) {
        const seed = i * 137.5;
        const px2 = (seed * 7.3 + time * 0.15 * (0.3 + (i % 5) * 0.1)) % w;
        const py2 = (seed * 3.7 + Math.sin(time * 0.008 + i) * 30) % h;
        const size = 1 + (i % 3) * 0.5;
        const particleAlpha = 0.04 + 0.025 * Math.sin(time * 0.015 + i * 0.8);

        ctx.beginPath();
        ctx.arc(px2, py2, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(45, 100%, 60%, ${particleAlpha})`;
        ctx.fill();
      }

      // --- Subtle crowd silhouette arcs ---
      ctx.save();
      ctx.globalAlpha = alpha * 0.8;
      const crowdSegments = 40;
      for (let i = 0; i < crowdSegments; i++) {
        const angle = (Math.PI * 2 / crowdSegments) * i;
        const crowdRx = rx * (0.92 + 0.03 * Math.sin(time * 0.01 + i * 0.5));
        const crowdRy = ry * (0.92 + 0.03 * Math.sin(time * 0.01 + i * 0.7));
        const sx = cx + Math.cos(angle) * crowdRx;
        const sy = cy + Math.sin(angle) * crowdRy;
        const blobSize = 3 + 2 * Math.sin(time * 0.02 + i);

        ctx.beginPath();
        ctx.arc(sx, sy, blobSize, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(45, 80%, 50%, 1)`;
        ctx.fill();
      }
      ctx.restore();
    };

    const animate = () => {
      time++;
      drawStadium();
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
};

export default FootballBackground;
