import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Highlights,
  Favourites,
  StorySection,
  SpecialsBanner,
  GalleryPreview,
  Reviews,
  StoryButton,
} from "@/components/restaurant/sections";
import { pageHead } from "@/lib/menu";
import { CravingFinder } from "@/components/restaurant/craving-finder";
import {
  HeroParallax,
  Reveal,
  Interactive3DPlatter,
  TasteDimension,
} from "@/components/restaurant/motion";
import { HeroParticleFlowCanvas, HeroFlowRibbon } from "@/components/restaurant/hero-flow";
import { HeroSpecialsDock } from "@/components/restaurant/hero-specials-dock";
import interior from "@/assets/kumchop-interior-clear.jpg";
export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Every Taste Feels Good",
      "Discover Kumchop in Akungba Akoko. Delicious meals, snacks, shawarma, grills, desserts and drinks for every craving.",
    ),
  component: Index,
});
function Index() {
  return (
    <>
      <section className="hero">
        <img
          className="hero-image"
          src={interior}
          width={896}
          height={1200}
          alt="Inside Kumchop Restaurant in Akungba Akoko: warm amber ceiling lighting, cozy booth seating, and modern dining room"
          fetchPriority="high"
        />
        {/* Ambient buoyant particle flow canvas */}
        <HeroParticleFlowCanvas />

        <div className="site-container hero-content">
          <div className="hero-grid-exclusive">
            <div className="hero-copy">
              <div className="hero-status-tag hero-eyebrow-anim">
                <span className="hero-pulse-dot" />
                <span className="hero-status-text">
                  Open Today 8:00 AM – 10:00 PM · Akungba Express Delivery Active
                </span>
              </div>
              <span className="eyebrow hero-eyebrow-anim">
                FINE AFRICAN CUISINE · GRILLS · ARTISAN SHAWARMA
              </span>
              <h1 className="hero-title-anim">
                Kumchop<span className="hero-tagline">Every Taste Feels Good...</span>
              </h1>
              <p className="hero-description hero-desc-anim">
                A warm culinary sanctuary in Akungba Akoko. Firewood jollof, spicy grills, crispy
                shawarma, and comforting traditional swallow — slow-cooked with fresh local farm
                ingredients for students, travellers, and dining families.
              </p>
              <div className="hero-buttons hero-buttons-anim">
                <Button asChild size="lg">
                  <Link to="/menu">
                    Explore Our Menu <ArrowUpRight />
                  </Link>
                </Button>
                <StoryButton />
                <span className="hero-table-note">Your table is waiting.</span>
              </div>
              <div className="hero-trust-strip hero-desc-anim">
                <div className="hero-trust-item">
                  <span className="trust-number">4.9 ★</span>
                  <span className="trust-label">1,200+ Diners</span>
                </div>
                <div className="hero-trust-divider" />
                <div className="hero-trust-item">
                  <span className="trust-number">15–25m</span>
                  <span className="trust-label">Campus Delivery</span>
                </div>
                <div className="hero-trust-divider" />
                <div className="hero-trust-item">
                  <span className="trust-number">100%</span>
                  <span className="trust-label">Fresh Local Spices</span>
                </div>
              </div>
            </div>

            <div className="hero-dock-column hero-desc-anim">
              <HeroSpecialsDock />
            </div>
          </div>
        </div>

        <HeroParallax />

        {/* Animated continuous kinetic flow ribbon */}
        <HeroFlowRibbon />
      </section>
      <CravingFinder />
      <Reveal>
        <Interactive3DPlatter />
      </Reveal>
      <Reveal>
        <Highlights />
      </Reveal>
      <Reveal>
        <Favourites />
      </Reveal>
      <Reveal>
        <TasteDimension />
      </Reveal>
      <Reveal>
        <StorySection />
      </Reveal>
      <Reveal>
        <SpecialsBanner />
      </Reveal>
      <Reveal>
        <GalleryPreview />
      </Reveal>
      <Reveal>
        <Reviews />
      </Reveal>
    </>
  );
}
