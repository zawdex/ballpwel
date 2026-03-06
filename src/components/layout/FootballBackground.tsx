import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  type: 'ball' | 'dot';
}

const FootballBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
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

    // Create particles
    const createParticles = () => {
      const particles: Particle[] = [];
      const count = Math.floor((canvas.width * canvas.height) / 80000); // density based

      for (let i = 0; i < Math.min(count, 15); i++) {
        const isBall = i < Math.max(3, Math.floor(count * 0.3));
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: isBall ? 6 + Math.random() * 8 : 1.5 + Math.random() * 2,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: -0.15 - Math.random() * 0.25,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.01,
          opacity: isBall ? 0.025 : 0.015 + Math.random() * 0.01,
          type: isBall ? 'ball' : 'dot',
        });
      }
      return particles;
    };

    particlesRef.current = createParticles();

    const drawBall = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;

      // Ball circle
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.strokeStyle = `hsl(45, 100%, 50%)`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Pentagon pattern (simplified)
      const s = p.size * 0.45;
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const nx = Math.cos(angle) * s;
        const ny = Math.sin(angle) * s;
        ctx.beginPath();
        ctx.arc(nx, ny, p.size * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(45, 100%, 50%)`;
        ctx.fill();
      }

      ctx.restore();
    };

    const drawDot = (p: Particle) => {
      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(45, 100%, 50%)`;
      ctx.fill();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        // Wrap around
        if (p.y < -20) p.y = canvas.height + 20;
        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;

        if (p.type === 'ball') {
          drawBall(p);
        } else {
          drawDot(p);
        }
      });

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
