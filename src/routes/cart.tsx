import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/restaurant/cart";
import { CartLines } from "@/components/restaurant/cart-drawer";
import { money, cartSubtotal, pageHead } from "@/lib/menu";
import { getDeliveryAreas, type DeliveryArea } from "@/lib/delivery";

export const Route = createFileRoute("/cart")({
  head: () =>
    pageHead(
      "Your Cart",
      "Review your Kumchop order, update quantities and see your total with delivery fees before checkout.",
    ),
  component: Cart,
});

function Cart() {
  const { lines, clear, count } = useCart();
  const [orderType, setOrderType] = useState<"pickup" | "delivery">("delivery");
  const [areas] = useState<DeliveryArea[]>(() => getDeliveryAreas());
  const [selectedAreaId, setSelectedAreaId] = useState<string>(
    () => getDeliveryAreas()[0]?.id ?? "aaua-campus",
  );

  const selectedArea = areas.find((a) => a.id === selectedAreaId) ?? areas[0];
  const deliveryFeeKobo = orderType === "delivery" ? (selectedArea?.feeKobo ?? 50000) : 0;
  const subtotal = cartSubtotal(lines);
  const total = subtotal + deliveryFeeKobo;

  return (
    <>
      <div className="site-container page-top">
        <span className="eyebrow">A LITTLE OF WHAT YOU LOVE</span>
        <h1>
          Your <em>Cart.</em>
        </h1>
      </div>
      <section className="site-container page-body">
        {lines.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={40} />
            <h2>Your next good meal starts here.</h2>
            <p>Your cart is empty.</p>
            <Button asChild>
              <Link to="/order">
                Order Online <ArrowRight />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="cart-layout">
            <div>
              <CartLines />
              <div className="flex flex-wrap gap-3 mt-5">
                <Button variant="link" asChild>
                  <Link to="/order">
                    Continue shopping <ArrowRight />
                  </Link>
                </Button>
                <Button variant="ghost" onClick={clear}>
                  Clear cart
                </Button>
              </div>
            </div>
            <aside className="cart-summary drop-motion-soft">
              <h3>Order summary</h3>

              {/* Service Type Switch */}
              <div className="flex gap-2 p-1 bg-secondary rounded-md my-3">
                <button
                  type="button"
                  onClick={() => setOrderType("delivery")}
                  className={`flex-1 py-1.5 px-2 rounded text-xs font-semibold transition-colors ${
                    orderType === "delivery"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType("pickup")}
                  className={`flex-1 py-1.5 px-2 rounded text-xs font-semibold transition-colors ${
                    orderType === "pickup"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Pickup (₦0)
                </button>
              </div>

              {/* Area select if delivery */}
              {orderType === "delivery" && (
                <div className="mb-4">
                  <label className="text-xs text-muted-foreground block mb-1 flex items-center gap-1">
                    <MapPin size={12} className="text-primary" /> Delivery Area
                  </label>
                  <select
                    value={selectedAreaId}
                    onChange={(e) => setSelectedAreaId(e.target.value)}
                    className="w-full text-xs p-2 bg-secondary border border-border rounded"
                  >
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} — {money(a.feeKobo)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="summary-row">
                <span>Items</span>
                <span>{count}</span>
              </div>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery</span>
                <span className={orderType === "pickup" ? "text-green-500 font-semibold" : ""}>
                  {orderType === "pickup" ? "Free (Pickup)" : money(deliveryFeeKobo)}
                </span>
              </div>
              <div className="summary-row summary-total text-xl">
                <span>Total</span>
                <span className="text-primary">{money(total)}</span>
              </div>
              <p className="fine-print">
                {orderType === "delivery"
                  ? `Delivery fee of ${money(deliveryFeeKobo)} included in total.`
                  : "Pickup from restaurant counter opposite Bovas."}
              </p>
              <Button asChild size="lg" className="w-full mt-2">
                <Link to="/checkout">
                  Proceed to Checkout <ArrowRight />
                </Link>
              </Button>
            </aside>
          </div>
        )}
      </section>
    </>
  );
}
