import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  ArrowRight,
  Leaf,
  Utensils,
  CookingPot,
  Bike,
  Play,
  ChevronLeft,
  ChevronRight,
  Star,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories } from "@/lib/menu";
import feast from "@/assets/kumchop-feast.jpg";

export function Highlights() {
  return (
    <div className="highlights">
      <div className="site-container highlight-grid">
        {[
          { Icon: Leaf, title: "Fresh Ingredients", copy: "Quality you can taste." },
          { Icon: Utensils, title: "Wide Variety", copy: "Meals, snacks, desserts & more." },
          { Icon: Bike, title: "Fast & Reliable", copy: "Your food, on time." },
          { Icon: CookingPot, title: "Great Experience", copy: "Good food. Great moments." },
        ].map(({ Icon, title, copy }) => (
          <div className="highlight" key={title}>
            <Icon />
            <div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export function Favourites() {
  return (
    <section className="section site-container">
      <div className="section-heading">
        <div>
          <span className="eyebrow">OUR MENU</span>
          <h2>
            Explore Our <em>Favourites</em>
          </h2>
        </div>
        <Button variant="link" asChild>
          <Link to="/menu">
            View Full Menu <ArrowUpRight />
          </Link>
        </Button>
      </div>
      <div className="category-grid">
        {categories.map((c) => (
          <Link to="/menu" search={{ category: c.id }} className="category-card" key={c.id}>
            <div className="category-photo">
              <img src={c.image} alt={c.name} width={512} height={512} loading="lazy" />
            </div>
            <div className="category-info">
              <h3>{c.name}</h3>
              <p>{c.description}</p>
              <span className="category-arrow">
                <ArrowUpRight size={19} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
export function StorySection({ full = false }: { full?: boolean }) {
  return (
    <section className="section story-section">
      <div className="site-container story-grid">
        <div className="story-photo">
          <img
            src="/assets/aistudio/IMG-20261017-WA0082_b0a8601d.jpg"
            alt="Inside Kumchop: warm lighting, comfortable seating and welcoming dining tables"
            width={809}
            height={1080}
            loading="lazy"
          />
          <span className="photo-caption">Your table is waiting. Akungba Akoko.</span>
        </div>
        <div className="story-copy">
          <span className="eyebrow">OUR STORY</span>
          <h2>
            More Than Just
            <br />a <em>Restaurant</em>
          </h2>
          <p>
            At Kumchop, we believe good food brings people together. From satisfying everyday meals
            to delightful snacks, desserts and refreshing drinks, we're here to make every visit
            memorable.
          </p>
          <p>Whatever you're craving, there's something to enjoy.</p>
          {full ? (
            <p className="location-note">
              Find us at Akungba Akoko. Come for the food. Stay for the feeling.
            </p>
          ) : (
            <Button variant="outline" size="lg" asChild>
              <Link to="/about">
                A little more about us <ArrowRight />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
export function SpecialsBanner() {
  return (
    <section className="specials-band">
      <img
        src={feast}
        width={1920}
        height={1024}
        loading="lazy"
        alt="Illustrative rice, grilled chicken and plantain platter"
      />
      <div className="site-container">
        <span className="eyebrow">A LITTLE MORE TO LOVE</span>
        <h2>
          Tasty Deals,
          <br />
          <em>Bigger Smiles.</em>
        </h2>
        <p>Discover delicious combinations and special offers made for you.</p>
        <Button size="lg" asChild>
          <Link to="/specials">
            View Specials <ArrowUpRight />
          </Link>
        </Button>
      </div>
    </section>
  );
}
export function GalleryPreview() {
  return (
    <section className="section site-container">
      <div className="section-heading">
        <div>
          <span className="eyebrow">GOOD FOOD, UP CLOSE</span>
          <h2>
            From Our <em>Kitchen</em>
          </h2>
        </div>
        <Button variant="link" asChild>
          <Link to="/gallery">
            Explore Gallery <ArrowUpRight />
          </Link>
        </Button>
      </div>
      <div className="gallery-preview">
        {categories.slice(1, 5).map((c) => (
          <Link key={c.id} to="/gallery">
            <img src={c.image} alt={c.name} width={512} height={512} loading="lazy" />
          </Link>
        ))}
      </div>
      <p className="fine-print">
        Food photography is illustrative. Our actual dishes and photographs are coming soon.
      </p>
    </section>
  );
}

const customerReviews = [
  {
    id: 1,
    name: "Dr. Taiwo Adebayo",
    role: "AAUA Faculty Lecturer · Akungba",
    avatar: "TA",
    tag: "Regular Dine-in",
    rating: 5,
    text: "The smoky party jollof and tender grilled turkey are unmatched in Akungba. The restaurant ambience is calm, air-conditioned, and perfect for meetings or unwinding after lectures.",
  },
  {
    id: 2,
    name: "Chidinma Eze",
    role: "Final Year Student, AAUA",
    avatar: "CE",
    tag: "Hostel Delivery",
    rating: 5,
    text: "Super fast delivery straight to our hostel gate! Their chicken shawarma is juicy, generously loaded with sausage and beef, and arrives piping hot every single time.",
  },
  {
    id: 3,
    name: "Segun Oladipo",
    role: "Local Business Owner · Akungba",
    avatar: "SO",
    tag: "Verified Customer",
    rating: 5,
    text: "The fresh catfish pepper soup and pounded yam will bless your soul. Generous portions, authentic spices, and very polite and attentive staff.",
  },
  {
    id: 4,
    name: "Folake Adeleke",
    role: "Frequent AAUA Visitor",
    avatar: "FA",
    tag: "Weekend Dinners",
    rating: 5,
    text: "The new restaurant interior is gorgeous — warm ambient lighting, comfy seating, and clean facilities. When you taste the food, you understand why Kumchop is the number one choice.",
  },
];

export function Reviews() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % customerReviews.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [paused]);

  const current = customerReviews[active];
  const prev = () => setActive((i) => (i - 1 + customerReviews.length) % customerReviews.length);
  const next = () => setActive((i) => (i + 1) % customerReviews.length);

  return (
    <section
      className="review-section section"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="site-container">
        <span className="eyebrow">THE PEOPLE AT OUR TABLE</span>
        <h2>
          What Our <em>Customers Say</em>
        </h2>

        <div className="review-carousel-container">
          <div className="review-card-wrapper" key={current.id}>
            <div className="review-stars">
              {[...Array(current.rating)].map((_, i) => (
                <Star key={i} size={18} fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <p className="review-text">“{current.text}”</p>
            <div className="review-author-row">
              <div className="review-author-info">
                <div className="review-avatar">{current.avatar}</div>
                <div>
                  <div className="review-name">{current.name}</div>
                  <div className="review-role">{current.role}</div>
                </div>
              </div>
              <span className="review-verified-badge">
                <CheckCircle2 size={13} /> {current.tag}
              </span>
            </div>
          </div>

          <div className="carousel-controls">
            <button
              onClick={prev}
              className="carousel-nav-btn"
              aria-label="Previous review"
              type="button"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="carousel-dots">
              {customerReviews.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => setActive(i)}
                  className={`carousel-dot ${i === active ? "active" : ""}`}
                  aria-label={`Go to review ${i + 1}`}
                  type="button"
                />
              ))}
            </div>
            <button
              onClick={next}
              className="carousel-nav-btn"
              aria-label="Next review"
              type="button"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
export function StoryButton() {
  return (
    <Button variant="ghost" size="lg" asChild>
      <Link to="/about">
        <span className="play-circle">
          <Play size={14} fill="currentColor" />
        </span>
        Watch Our Story
      </Link>
    </Button>
  );
}
