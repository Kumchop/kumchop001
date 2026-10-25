import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  RotateCcw,
  Flame,
  Plus,
  Utensils,
  Check,
  Compass,
  ArrowRight,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "./cart";
import { money, findItem } from "@/lib/menu";
import feastImg from "@/assets/kumchop-feast.jpg";
import riceImg from "@/assets/rice.jpg";
import grillImg from "@/assets/grill.jpg";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Reveals children with a soft rise when they scroll into view.
 * Stagger siblings by passing `delay` (ms).
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  ...rest
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      el.classList.add("revealed");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * Wraps content in a 3D tactile tilt card.
 * The card rotates in 3D perspective and reflects a dynamic specular glare
 * following pointer coordinates. Children with [data-depth] pop forward in Z-space.
 */
export function TiltCard({
  children,
  className = "",
  max = 9,
  glare = true,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  glare?: boolean;
} & HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty("--tilt-x", `${(-py * max).toFixed(2)}deg`);
        el.style.setProperty("--tilt-y", `${(px * max).toFixed(2)}deg`);
        if (glare) {
          el.style.setProperty("--glare-x", `${((px + 0.5) * 100).toFixed(1)}%`);
          el.style.setProperty("--glare-y", `${((py + 0.5) * 100).toFixed(1)}%`);
        }
        el.classList.add("tilting");
      });
    };

    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.classList.remove("tilting");
      el.style.setProperty("--tilt-x", "0deg");
      el.style.setProperty("--tilt-y", "0deg");
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [max, glare]);

  return (
    <div ref={ref} className={`tilt ${className}`} {...rest}>
      {children}
    </div>
  );
}

/**
 * Attaches a gentle 3D parallax to the hero: the room photo drifts
 * with the pointer and eases back when the pointer leaves.
 */
export function HeroParallax() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(".hero");
    if (!hero || prefersReducedMotion()) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        hero.style.setProperty("--hero-px", px.toFixed(3));
        hero.style.setProperty("--hero-py", py.toFixed(3));
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      hero.style.setProperty("--hero-px", "0");
      hero.style.setProperty("--hero-py", "0");
    };

    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return null;
}

/**
 * DropMotion container: Staggers child elements with gravity drop animations.
 */
export function DropCascade({
  children,
  className = "",
  staggerMs = 70,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  staggerMs?: number;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`drop-cascade-container ${className}`}
      style={{ "--stagger-step": `${staggerMs}ms` } as CSSProperties}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * Interactive 3D Platter Showcase:
 * Real-time 3D interactive stage letting diners rotate, inspect, and drop
 * signature Kumchop feast ingredients onto a virtual dining platter.
 */
type PlatterHotspot = {
  id: string;
  name: string;
  xPercent: number; // 0 to 100 on platter
  yPercent: number; // 0 to 100 on platter
  tag: string;
  description: string;
  spiciness: string;
  linkedItemId?: string;
  priceKobo?: number;
};

const HOTSPOTS: PlatterHotspot[] = [
  {
    id: "jollof",
    name: "Smoky Firewood Jollof",
    xPercent: 32,
    yPercent: 48,
    tag: "Signature Grain",
    description:
      "Slow-steamed parboiled long grain steeped in rich plum tomato, scotch bonnet, and aromatic bay leaf broth.",
    spiciness: "Mild–Medium Warmth",
    linkedItemId: "jollof-rice",
    priceKobo: 120000,
  },
  {
    id: "chicken",
    name: "Char-Grilled Peppered Chicken",
    xPercent: 68,
    yPercent: 38,
    tag: "Tender Protein",
    description:
      "Marinated overnight in Akungba spices, flame-grilled and glazed in sweet caramelized pepper reduction.",
    spiciness: "Bold & Savory",
    linkedItemId: "grilled-chicken",
    priceKobo: 180000,
  },
  {
    id: "dodo",
    name: "Golden Plantain Medallions (Dodo)",
    xPercent: 52,
    yPercent: 70,
    tag: "Sweet Contrast",
    description:
      "Naturally ripened sweet plantains sliced thick and flash-crisped to deep golden perfection.",
    spiciness: "Naturally Sweet",
    linkedItemId: "fried-plantain",
    priceKobo: 40000,
  },
  {
    id: "pepper-sauce",
    name: "Ata Dindin Pepper Glaze",
    xPercent: 24,
    yPercent: 26,
    tag: "House Relish",
    description:
      "Coarse pounded habanero, sweet bell peppers, and slow-braised onions reduced in pure vegetable oil.",
    spiciness: "Spicy & Fiery",
    linkedItemId: "pepper-sauce",
    priceKobo: 30000,
  },
];

export function Interactive3DPlatter() {
  const cart = useCart();
  const stageRef = useRef<HTMLDivElement>(null);
  const [rotX, setRotX] = useState(14);
  const [rotY, setRotY] = useState(-10);
  const [isHovered, setIsHovered] = useState(false);
  const [activeSpot, setActiveSpot] = useState<PlatterHotspot | null>(HOTSPOTS[0]);
  const [autoRotate, setAutoRotate] = useState(false);
  const [droppedItem, setDroppedItem] = useState<string | null>(null);

  // Auto orbit effect when enabled
  useEffect(() => {
    if (!autoRotate || isHovered || prefersReducedMotion()) return;
    let angle = rotY;
    const interval = window.setInterval(() => {
      angle = (angle + 0.6) % 360;
      setRotY(angle);
      setRotX(12 + Math.sin((angle * Math.PI) / 180) * 6);
    }, 32);
    return () => window.clearInterval(interval);
  }, [autoRotate, isHovered, rotY]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) return;
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    // Clamp rotation for refined natural perspective
    setRotX(-py * 28 + 10);
    setRotY(px * 32);
  }, []);

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
    if (!autoRotate) {
      setRotX(14);
      setRotY(-10);
    }
  }, [autoRotate]);

  const handleDropToCart = (spot: PlatterHotspot) => {
    if (spot.linkedItemId) {
      const it = findItem(spot.linkedItemId);
      if (it) {
        cart.add(it.id);
        setDroppedItem(spot.id);
        setTimeout(() => setDroppedItem(null), 900);
        toast.success(`Dropped ${spot.name} into your order!`, {
          action: {
            label: "Open Cart",
            onClick: () => cart.setDrawerOpen(true),
          },
          duration: 3000,
        });
        return;
      }
    }
    // Fallback if custom item
    cart.add("jollof-rice");
    setDroppedItem(spot.id);
    setTimeout(() => setDroppedItem(null), 900);
    toast.success(`Added ${spot.name} to your order!`, {
      action: {
        label: "Open Cart",
        onClick: () => cart.setDrawerOpen(true),
      },
      duration: 3000,
    });
  };

  return (
    <section className="section platter-3d-section" aria-label="Interactive 3D Platter Explorer">
      <div className="site-container">
        {/* Section Header */}
        <div className="platter-header-row">
          <div>
            <span className="eyebrow flex items-center gap-1.5">
              <Compass size={14} className="text-primary animate-spin-slow" />
              INTERACTIVE 3D PLATTER
            </span>
            <h2 className="mt-1">
              Inspect Every <em>Layer</em> of Flavor
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
              Rotate this signature Kumchop feast in true 3D perspective. Tap any aroma hotspot to
              explore tasting notes and drop fresh ingredients straight into your order.
            </p>
          </div>
          <div className="platter-controls flex items-center gap-2">
            <Button
              variant={autoRotate ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRotate(!autoRotate)}
              aria-pressed={autoRotate}
              className="text-xs"
            >
              <RotateCcw size={13} className={autoRotate ? "animate-spin" : ""} />
              {autoRotate ? "Orbiting 3D" : "Auto Orbit"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRotX(14);
                setRotY(-10);
                setAutoRotate(false);
              }}
              className="text-xs"
            >
              Reset View
            </Button>
          </div>
        </div>

        {/* 3D Stage & Inspector Card Grid */}
        <div className="platter-interactive-grid mt-8">
          {/* Interactive 3D Canvas / Stage */}
          <div
            ref={stageRef}
            className="platter-stage-container"
            onPointerMove={handlePointerMove}
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={handlePointerLeave}
            role="region"
            aria-label="3D Platter interactive viewport. Move pointer to tilt dish."
          >
            {/* Ambient Lighting & Shadow */}
            <div className="platter-ambient-pedestal" />

            {/* The 3D Rotating Platter Disc */}
            <div
              className="platter-3d-disc"
              style={
                {
                  transform: `perspective(1100px) rotateX(${rotX.toFixed(1)}deg) rotateY(${rotY.toFixed(1)}deg)`,
                } as CSSProperties
              }
            >
              {/* Platter Plate Base Layer */}
              <div className="platter-plate-surface">
                <img
                  src={feastImg}
                  alt="Kumchop Signature Feast Platter: Smoky Jollof rice, peppered grilled chicken, and fried plantain"
                  className="platter-dish-image"
                  loading="lazy"
                />
                <div className="platter-rim-lighting" />
              </div>

              {/* 3D Hotspot Pins floating in Z space */}
              {HOTSPOTS.map((spot) => {
                const isActive = activeSpot?.id === spot.id;
                const isDropping = droppedItem === spot.id;
                return (
                  <button
                    key={spot.id}
                    type="button"
                    className={`platter-hotspot-pin ${isActive ? "active" : ""} ${
                      isDropping ? "dropping-pulse" : ""
                    }`}
                    style={
                      {
                        left: `${spot.xPercent}%`,
                        top: `${spot.yPercent}%`,
                        transform: `translate(-50%, -50%) translateZ(46px) ${
                          isActive ? "scale(1.2)" : "scale(1)"
                        }`,
                      } as CSSProperties
                    }
                    onClick={() => setActiveSpot(spot)}
                    aria-label={`Inspect ${spot.name}`}
                  >
                    <span className="hotspot-pulse-ring" />
                    <span className="hotspot-core-dot">
                      <Sparkles size={11} />
                    </span>
                    <span className="hotspot-label-pill">{spot.tag}</span>
                  </button>
                );
              })}
            </div>

            {/* Viewport Guidance Cue */}
            <div className="platter-drag-hint">
              <Eye size={13} className="text-primary" />
              <span>Drag or move cursor across platter to tilt in 3D</span>
            </div>
          </div>

          {/* Tasting Note & Drop-to-Order Inspector Panel */}
          {activeSpot && (
            <div className="platter-inspector-panel drop-motion-soft" key={activeSpot.id}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="eyebrow-accent flex items-center gap-1">
                  <Flame size={13} className="text-primary" />
                  {activeSpot.tag}
                </span>
                <span className="platter-spice-level">{activeSpot.spiciness}</span>
              </div>

              <h3 className="platter-spot-name mt-2 text-xl">{activeSpot.name}</h3>
              <p className="platter-spot-desc mt-2">{activeSpot.description}</p>

              <div className="platter-meta-strip mt-4">
                <div className="platter-meta-item">
                  <span className="text-xs text-muted-foreground">Preparation</span>
                  <strong>Fresh Daily in Akungba</strong>
                </div>
                <div className="platter-meta-item">
                  <span className="text-xs text-muted-foreground">Single Portion</span>
                  <strong className="text-primary">
                    {activeSpot.priceKobo ? money(activeSpot.priceKobo) : "Included in combo"}
                  </strong>
                </div>
              </div>

              {/* Drop to Order Command */}
              <div className="platter-action-box mt-6">
                <Button
                  size="lg"
                  className="w-full relative overflow-hidden group shadow-md"
                  onClick={() => handleDropToCart(activeSpot)}
                >
                  <Plus className="transition-transform group-hover:rotate-90 duration-300" />
                  Drop {activeSpot.name} into Cart
                </Button>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                  <span>✨ Freshly cooked upon order</span>
                  <Link
                    to="/menu"
                    className="hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    See full menu <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Interactive Taste Wheel / Flavour Dimension:
 * Dynamic 3D cards with drop animations for different craving profiles.
 */
export function TasteDimension() {
  const [selectedTaste, setSelectedTaste] = useState<number>(0);

  const tastes = [
    {
      title: "Woodfire & Smoke",
      tagline: "Slow-steamed rich party jollof with distinct firewood aroma",
      image: riceImg,
      badge: "Signature Flavor",
      dish: "Party Jollof Rice Special",
      priceKobo: 120000,
      linkCategory: "rice",
    },
    {
      title: "Flame & Spice",
      tagline: "Crispy skin, tender juicy chicken with Akungba dry rub and scotch bonnet",
      image: grillImg,
      badge: "Chef's Flame Grill",
      dish: "Flame-Grilled Quarter Chicken",
      priceKobo: 180000,
      linkCategory: "grill",
    },
    {
      title: "Golden & Sweet",
      tagline: "Caramelized ripe dodo, fluffy puff puff, and freshly baked meat pies",
      image: feastImg,
      badge: "Comfort Classics",
      dish: "Golden Fried Plantain & Pastries",
      priceKobo: 50000,
      linkCategory: "snacks",
    },
  ];

  return (
    <section className="section taste-dimension-section site-container">
      <div className="section-heading">
        <div>
          <span className="eyebrow">TASTE DIMENSIONS</span>
          <h2>
            Which <em>Experience</em> Are You Craving?
          </h2>
        </div>
      </div>

      <div className="taste-cards-grid mt-6">
        {tastes.map((item, idx) => (
          <TiltCard
            key={item.title}
            className={`taste-3d-card drop-motion ${selectedTaste === idx ? "active-taste" : ""}`}
            style={{ "--drop-delay": `${idx * 120}ms` } as CSSProperties}
            onClick={() => setSelectedTaste(idx)}
          >
            <div className="taste-card-image" data-depth="mid">
              <img src={item.image} alt={item.title} loading="lazy" />
              <span className="taste-badge" data-depth="high">
                {item.badge}
              </span>
            </div>
            <div className="taste-card-content" data-depth="high">
              <h3>{item.title}</h3>
              <p>{item.tagline}</p>
              <div className="taste-card-foot mt-4">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Highlight Dish</span>
                  <strong className="text-sm">{item.dish}</strong>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to="/menu" search={{ category: item.linkCategory }}>
                    Explore <ArrowRight size={13} />
                  </Link>
                </Button>
              </div>
            </div>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}
