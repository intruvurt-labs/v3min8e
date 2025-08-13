import { useEffect, useRef } from 'react';

interface CyberGridProps {
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  animated?: boolean;
}

export default function CyberGrid({ 
  className = '', 
  intensity = 'medium',
  animated = true 
}: CyberGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!animated) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Grid configuration based on intensity
    const gridConfig = {
      low: { size: 80, opacity: 0.15, pulseSpeed: 0.02 },
      medium: { size: 50, opacity: 0.25, pulseSpeed: 0.03 },
      high: { size: 30, opacity: 0.35, pulseSpeed: 0.04 }
    };

    const config = gridConfig[intensity];
    let animationFrame: number;
    let time = 0;

    const drawGrid = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Main grid lines
      ctx.strokeStyle = `rgba(0, 255, 163, ${config.opacity * (1 + 0.3 * Math.sin(time * config.pulseSpeed))})`;
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      
      // Vertical lines
      for (let x = 0; x <= canvas.width; x += config.size) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      }
      
      // Horizontal lines
      for (let y = 0; y <= canvas.height; y += config.size) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
      
      ctx.stroke();

      // Secondary smaller grid
      ctx.strokeStyle = `rgba(0, 255, 163, ${config.opacity * 0.3 * (1 + 0.5 * Math.sin(time * config.pulseSpeed * 1.5))})`;
      ctx.lineWidth = 0.5;
      
      ctx.beginPath();
      
      const smallSize = config.size / 5;
      for (let x = 0; x <= canvas.width; x += smallSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      }
      
      for (let y = 0; y <= canvas.height; y += smallSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
      
      ctx.stroke();

      // Add some random glowing nodes
      ctx.fillStyle = `rgba(0, 255, 163, ${config.opacity * 0.8})`;
      for (let i = 0; i < 20; i++) {
        const x = (Math.sin(time * 0.001 + i) * 0.5 + 0.5) * canvas.width;
        const y = (Math.cos(time * 0.0015 + i * 0.5) * 0.5 + 0.5) * canvas.height;
        const pulse = 1 + 0.5 * Math.sin(time * 0.005 + i);
        
        ctx.beginPath();
        ctx.arc(x, y, 2 * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        ctx.shadowColor = 'rgba(0, 255, 163, 0.8)';
        ctx.shadowBlur = 10 * pulse;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      time++;
      animationFrame = requestAnimationFrame(drawGrid);
    };

    drawGrid();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [intensity, animated]);

  return (
    <div className={`fixed inset-0 pointer-events-none z-0 ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: 'transparent' }}
      />
      {/* Static grid fallback for non-animated mode */}
      {!animated && (
        <div className="absolute inset-0 cyber-grid opacity-20" />
      )}
    </div>
  );
}
