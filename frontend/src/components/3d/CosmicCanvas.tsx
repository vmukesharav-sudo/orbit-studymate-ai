import React, { useEffect, useRef } from 'react';

export const CosmicCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle collection
    const starsCount = 140;
    const stars: { x: number; y: number; size: number; speed: number; alpha: number; delta: number; color: string }[] = [];
    const colors = ['#22D3EE', '#8B5CF6', '#A855F7', '#FFFFFF', '#60A5FA'];

    for (let i = 0; i < starsCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.8 + 0.4,
        speed: Math.random() * 0.25 + 0.05,
        alpha: Math.random() * 0.8 + 0.2,
        delta: (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render subtle cosmic nebula gradient
      const gradient = ctx.createRadialGradient(width * 0.5, height * 0.35, 100, width * 0.5, height * 0.35, width * 0.8);
      gradient.addColorStop(0, 'rgba(37, 99, 235, 0.06)');
      gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.04)');
      gradient.addColorStop(1, 'rgba(5, 6, 17, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Render stars
      stars.forEach((star) => {
        star.y -= star.speed;
        if (star.y < 0) {
          star.y = height;
          star.x = Math.random() * width;
        }

        star.alpha += star.delta;
        if (star.alpha > 0.95 || star.alpha < 0.2) {
          star.delta = -star.delta;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = Math.max(0.1, Math.min(1, star.alpha));
        ctx.shadowBlur = 6;
        ctx.shadowColor = star.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-70"
    />
  );
};

export default CosmicCanvas;

