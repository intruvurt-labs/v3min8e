// Performance-optimized animation utilities
// Ensures smooth animations without compromising speed and security

/**
 * Debounce function to limit animation updates
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function to limit animation frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Request animation frame wrapper for smooth animations
 */
export const requestAnimationFrameWrapper = (callback: () => void) => {
  if (typeof window !== "undefined") {
    return window.requestAnimationFrame(callback);
  }
  return setTimeout(callback, 16); // Fallback for SSR
};

/**
 * CSS transform optimization for GPU acceleration
 */
export const optimizeTransforms = (element: HTMLElement) => {
  if (element) {
    element.style.willChange = "transform";
    element.style.transform = "translateZ(0)"; // Force GPU layer
  }
};

/**
 * Particle system optimization
 */
export class OptimizedParticleSystem {
  private particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
  }> = [];
  private maxParticles: number;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationId: number = 0;

  constructor(maxParticles: number = 50) {
    this.maxParticles = maxParticles;
  }

  init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.startAnimation();
  }

  addParticle(x: number, y: number) {
    if (this.particles.length < this.maxParticles) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 0,
        maxLife: 60 + Math.random() * 60,
      });
    }
  }

  private updateParticles() {
    this.particles = this.particles.filter((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life++;
      return particle.life < particle.maxLife;
    });
  }

  private drawParticles() {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach((particle) => {
      const alpha = 1 - particle.life / particle.maxLife;
      this.ctx!.fillStyle = `rgba(0, 255, 163, ${alpha})`;
      this.ctx!.fillRect(particle.x, particle.y, 2, 2);
    });
  }

  private animate = () => {
    this.updateParticles();
    this.drawParticles();
    this.animationId = requestAnimationFrame(this.animate);
  };

  startAnimation() {
    this.animate();
  }

  stopAnimation() {
    cancelAnimationFrame(this.animationId);
  }

  destroy() {
    this.stopAnimation();
    this.particles = [];
    this.canvas = null;
    this.ctx = null;
  }
}

/**
 * Performance monitor for animations
 */
export class AnimationPerformanceMonitor {
  private frameCount = 0;
  private lastTime = 0;
  private fps = 60;
  private onLowPerformance?: () => void;

  constructor(onLowPerformance?: () => void) {
    this.onLowPerformance = onLowPerformance;
  }

  tick() {
    const now = performance.now();
    this.frameCount++;

    if (now - this.lastTime >= 1000) {
      this.fps = (this.frameCount * 1000) / (now - this.lastTime);
      this.frameCount = 0;
      this.lastTime = now;

      // If FPS drops below 30, trigger low performance callback
      if (this.fps < 30 && this.onLowPerformance) {
        this.onLowPerformance();
      }
    }
  }

  getFPS() {
    return this.fps;
  }
}

/**
 * Reduced motion detection for accessibility
 */
export const prefersReducedMotion = () => {
  if (typeof window === "undefined") return false;

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Safe animation config based on device capabilities
 */
export const getSafeAnimationConfig = () => {
  const isLowEnd =
    typeof navigator !== "undefined" &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  const reducedMotion = prefersReducedMotion();

  return {
    particleCount: reducedMotion ? 0 : isLowEnd ? 10 : 25,
    animationDuration: reducedMotion ? 0 : isLowEnd ? 500 : 300,
    enableBlur: !isLowEnd && !reducedMotion,
    enableGlow: !isLowEnd && !reducedMotion,
    frameRate: isLowEnd ? 30 : 60,
  };
};

/**
 * Memory-efficient animation cleanup
 */
export class AnimationCleanup {
  private cleanupTasks: Array<() => void> = [];

  add(cleanup: () => void) {
    this.cleanupTasks.push(cleanup);
  }

  cleanup() {
    this.cleanupTasks.forEach((task) => task());
    this.cleanupTasks = [];
  }
}
