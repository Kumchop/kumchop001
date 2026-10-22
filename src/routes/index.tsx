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
        <div className="site-container hero-content">
          <div className="hero-copy">
            <span className="eyebrow hero-eyebrow-anim">AKUNGBA AKOKO · GOOD FOOD. GREAT MOMENTS.</span>
            <h1 className="hero-title-anim">
              Kumchop<span className="hero-tagline">Every Taste Feels Good...</span>
            </h1>
            <p className="hero-description hero-desc-anim">
              A place to savour your favourites. African dishes, rice, shawarma and more — made for every craving.
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
         <span className="hero-note hero-note-anim">Your table is waiting.</span>
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
