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
          src="/assets/aistudio/IMG-20261017-WA0082_b0a8601d.jpg"
          width={809}
          height={1080}
          alt="Inside Kumchop Restaurant in Akungba Akoko: warm amber ceiling lighting, cozy booth seating, and modern dining room"
          fetchPriority="high"
        />
        <div className="site-container hero-content">
          <div className="hero-copy">
            <div className="hero-live-badge">
              <span className="pulse-dot" />
              <span>Open for Dine-In & Fast Delivery</span>
              <span className="pill-separator">·</span>
              <span>Akungba & AAUA</span>
            </div>
            <span className="eyebrow hero-eyebrow-anim">GOOD FOOD. GREAT MOMENTS.</span>
            <h1 className="hero-title-anim">
              Delicious Meals
              <br />
              <em>For Every Craving.</em>
            </h1>
            <p className="hero-description hero-desc-anim">
              From hearty African dishes and smoky party jollof to loaded shawarma, crispy chicken,
              and cold refreshing drinks — Kumchop has something for everyone.
            </p>
            <div className="hero-buttons hero-buttons-anim">
              <Button asChild size="lg">
                <Link to="/menu">
                  Explore Our Menu <ArrowUpRight />
                </Link>
              </Button>
              <StoryButton />
            </div>
          </div>
        </div>
        <span className="hero-note hero-note-anim">Real Food. Real Flavour.</span>
      </section>
      <CravingFinder />
      <Highlights />
      <Favourites />
      <StorySection />
      <SpecialsBanner />
      <GalleryPreview />
      <Reviews />
    </>
  );
}
