import { useEffect, useRef, memo } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Flame, Sparkles } from "lucide-react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * HeroParticleFlowCanvas:
 * Renders lightweight, ambient floating warm embers, steam motes, and soft glowing
 * golden bokeh particles that drift with organic sinusoidal fluid motion.
 * When the user moves their cursor or touches the screen, the particles gently flow
 * and ripple in response.
 */
export const HeroParticleFlowCanvas = memo(function HeroParticleFlowCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion()) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let width = 0;
    let height = 0;

    const pointer = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      active: false,
    };

    interface Particle {
      x: number;
      y: number;
      radius: number;
      baseX: number;
      baseY: number;
      vx: number;
      vy: number;
      alpha: number;
      maxAlpha: number;
      pulseSpeed: number;
      hue: number;
      swayOffset: number;
      swaySpeed: number;
    }

    let particles: Particle[] = [];
    const PARTICLE_COUNT = 38;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = canvas.width = rect.width * (window.devicePixelRatio || 1);
      height = canvas.height = rect.height * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

      const displayW = rect.width;
      const displayH = rect.height;

      // Re-seed particles smoothly
      particles = Array.from({ length: PARTICLE_COUNT }, () => {
        const x = Math.random() * displayW;
        const y = Math.random() * displayH;
        return {
          x,
          y,
          baseX: x,
          baseY: y,
          radius: Math.random() * 2.8 + 1.2,
          vx: (Math.random() - 0.5) * 0.35,
          vy: -(Math.random() * 0.45 + 0.25), // gentle upward buoyant drift
          alpha: Math.random() * 0.4 + 0.1,
          maxAlpha: Math.random() * 0.45 + 0.25,
          pulseSpeed: Math.random() * 0.02 + 0.01,
          hue: Math.random() > 0.4 ? 38 : 22, // warm gold and amber ember tones
          swayOffset: Math.random() * Math.PI * 2,
          swaySpeed: Math.random() * 0.015 + 0.008,
        };
      });
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener("pointermove", onPointerMove, { passive: true });
      parent.addEventListener("pointerleave", onPointerLeave, { passive: true });
    }

    let tick = 0;

    const render = () => {
      tick++;
      const rect = canvas.getBoundingClientRect();
      const displayW = rect.width;
      const displayH = rect.height;

      ctx.clearRect(0, 0, displayW, displayH);

      // Draw flowing ambient aura in the corner
      const auraGradient = ctx.createRadialGradient(
        displayW * 0.75 + Math.sin(tick * 0.008) * 40,
        displayH * 0.45 + Math.cos(tick * 0.01) * 30,
        0,
        displayW * 0.75,
        displayH * 0.45,
        displayW * 0.55,
      );
      auraGradient.addColorStop(0, "rgba(234, 116, 32, 0.09)");
      auraGradient.addColorStop(0.5, "rgba(217, 119, 6, 0.04)");
      auraGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = auraGradient;
      ctx.fillRect(0, 0, displayW, displayH);

      // Render floating particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Buoyant sinusoidal flow
        p.y += p.vy;
        p.swayOffset += p.swaySpeed;
        p.x += Math.sin(p.swayOffset) * 0.5 + p.vx;

        // Pointer fluid repulsion / draft
        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 120;
          if (dist < maxDist && dist > 0) {
            const force = (1 - dist / maxDist) * 1.8;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force * 0.6;
          }
        }

        // Wrap around boundaries
        if (p.y < -10) {
          p.y = displayH + 10;
          p.x = Math.random() * displayW;
        }
        if (p.x < -10) p.x = displayW + 10;
        if (p.x > displayW + 10) p.x = -10;

        // Pulsing glow alpha
        const currentAlpha =
          p.maxAlpha * (0.6 + 0.4 * Math.sin(tick * p.pulseSpeed + p.swayOffset));

        // Draw soft glowing orb
        const glowRad = p.radius * 3.5;
        const radGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRad);
        radGrad.addColorStop(
          0,
          p.hue === 38
            ? `rgba(251, 191, 36, ${currentAlpha})`
            : `rgba(249, 115, 22, ${currentAlpha})`,
        );
        radGrad.addColorStop(
          0.4,
          p.hue === 38
            ? `rgba(217, 119, 6, ${currentAlpha * 0.45})`
            : `rgba(234, 88, 12, ${currentAlpha * 0.45})`,
        );
        radGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.beginPath();
        ctx.arc(p.x, p.y, glowRad, 0, Math.PI * 2);
        ctx.fillStyle = radGrad;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 247, 237, ${Math.min(1, currentAlpha * 1.4)})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      if (parent) {
        parent.removeEventListener("pointermove", onPointerMove);
        parent.removeEventListener("pointerleave", onPointerLeave);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-particle-canvas" aria-hidden="true" />;
});

/**
 * HeroFlowRibbon:
 * Infinite animated marquee flow ribbon showcasing Kumchop specialties,
 * steaming delights, and signature Akungba vibes seamlessly gliding across the hero base.
 */
export function HeroFlowRibbon() {
  const items = [
    { title: "Smoky Firewood Jollof", note: "Signature Recipe" },
    { title: "Char-Grilled Asun Grills", note: "Spiced Goat Meat" },
    { title: "Crispy Shawarma Supreme", note: "Double Sausage" },
    { title: "Pounded Yam & Egusi", note: "Authentic Swallow" },
    { title: "Piping Hot Delivery", note: "Akungba & Campus" },
    { title: "Fresh Chilled Drinks", note: "Ice Cold" },
    { title: "Every Taste Feels Good...", note: "Kumchop Express" },
  ];

  return (
    <div className="hero-flow-ribbon-bar" aria-label="Signature Highlights">
      <div className="hero-flow-ribbon-track">
        {/* Double repeated sequence for infinite smooth loop */}
        {[...items, ...items].map((item, idx) => (
          <div key={`${item.title}-${idx}`} className="hero-flow-ribbon-item">
            <span className="ribbon-spark">✦</span>
            <span className="ribbon-title">{item.title}</span>
            <span className="ribbon-note">{item.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * HeroFloatingWaveDecor:
 * Ambient kinetic wave ribbons and floating accent badges that add depth
 * and fluid kinetic motion directly into the hero section space.
 */
export function HeroFloatingWaveDecor() {
  return (
    <div className="hero-floating-decor-layer" aria-hidden="true">
      {/* Fluid animated ambient light rays */}
      <div className="hero-ambient-flow-ray ray-1" />
      <div className="hero-ambient-flow-ray ray-2" />

      {/* Floating kinetic badge 1 */}
      <div className="hero-flow-badge badge-top-right">
        <Sparkles size={13} className="text-primary" />
        <span className="badge-text">Authentic Akungba Taste</span>
      </div>

      {/* Floating kinetic badge 2 */}
      <div className="hero-flow-badge badge-mid-left">
        <Flame size={13} className="text-amber-500" />
        <span className="badge-text">Woodfire Flame Steamed</span>
      </div>
    </div>
  );
}
