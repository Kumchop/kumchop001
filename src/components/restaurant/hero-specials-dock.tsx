import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Check, Clock, Flame, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "./cart";
import { money } from "@/lib/menu";
import feastImg from "@/assets/kumchop-feast.jpg";
import shawarmaImg from "@/assets/shawarma.jpg";
import grillImg from "@/assets/grill.jpg";

interface SpecialDish {
  id: string;
  name: string;
  category: string;
  priceKobo: number;
  prepTime: string;
  image: string;
  desc: string;
}

const SIGNATURE_DISHES: SpecialDish[] = [
  {
    id: "jollof-rice",
    name: "Smoky Firewood Jollof & Chicken",
    category: "Signature Feast",
    priceKobo: 300000,
    prepTime: "15–20 min",
    image: feastImg,
    desc: "Slow-steamed in sweet plum tomato, scotch bonnet broth & char-grilled poultry",
  },
  {
    id: "shawarma-supreme",
    name: "Artisan Double Sausage Shawarma",
    category: "Campus Favorite",
    priceKobo: 250000,
    prepTime: "10–15 min",
    image: shawarmaImg,
    desc: "Shredded spiced chicken, dual sausage & toasted garlic cream wrap",
  },
  {
    id: "asun-fried-rice",
    name: "Peppered Asun Fried Rice",
    category: "Spicy Grill",
    priceKobo: 160000,
    prepTime: "12–18 min",
    image: grillImg,
    desc: "Tender fire-roasted goat meat tossed with fragrant wok rice & sweet peppers",
  },
];

export function HeroSpecialsDock() {
  const { add, setDrawerOpen } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);

  const handleQuickAdd = (e: React.MouseEvent, dish: SpecialDish) => {
    e.preventDefault();
    e.stopPropagation();
    add(dish.id);
    setAddedId(dish.id);

    toast.success(`${dish.name} added to your tray!`, {
      description: `${money(dish.priceKobo)} · Ready in ${dish.prepTime}`,
      action: {
        label: "View Tray",
        onClick: () => setDrawerOpen(true),
      },
    });

    setTimeout(() => {
      setAddedId((curr) => (curr === dish.id ? null : curr));
    }, 1800);
  };

  return (
    <div className="hero-specials-dock" aria-label="Today's Signature Kitchen Feasts">
      {/* Dock Header */}
      <div className="hero-specials-header">
        <div>
          <span className="specials-kicker">EXCLUSIVELY CRAFTED AT KUMCHOP</span>
          <h3 className="specials-title">Today's Kitchen Signatures</h3>
        </div>
        <div className="specials-status-indicator">
          <span className="pulse-dot-amber" />
          <span className="status-caption">Steaming Now</span>
        </div>
      </div>

      {/* Signature Dish List */}
      <div className="hero-specials-list">
        {SIGNATURE_DISHES.map((dish) => {
          const isAdded = addedId === dish.id;
          return (
            <div key={dish.id} className="hero-special-item">
              <div className="special-thumbnail-wrap">
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="special-thumbnail"
                  loading="eager"
                  width={72}
                  height={72}
                />
              </div>

              <div className="special-details">
                <div className="special-meta-row">
                  <span className="special-tag">{dish.category}</span>
                  <span className="special-time">
                    <Clock size={11} className="text-muted-foreground" />
                    {dish.prepTime}
                  </span>
                </div>
                <h4 className="special-name">{dish.name}</h4>
                <p className="special-desc">{dish.desc}</p>
                <div className="special-price-row">
                  <strong className="special-price">{money(dish.priceKobo)}</strong>
                </div>
              </div>

              <div className="special-action-col">
                <Button
                  size="sm"
                  variant={isAdded ? "default" : "outline"}
                  className={`special-add-btn ${isAdded ? "btn-added" : ""}`}
                  onClick={(e) => handleQuickAdd(e, dish)}
                  aria-label={`Add ${dish.name} to order`}
                >
                  {isAdded ? (
                    <>
                      <Check size={13} className="stroke-[3]" /> Added
                    </>
                  ) : (
                    <>
                      <Plus size={13} /> Order
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dock Footer Strip */}
      <div className="hero-specials-footer">
        <div className="footer-dispatch-info">
          <span className="dispatch-icon">🛵</span>
          <span>Fast AAUA Campus & Akungba Town Delivery</span>
        </div>
        <Link to="/menu" className="specials-view-all">
          Full Menu <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
