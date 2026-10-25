import { Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, UtensilsCrossed } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { findItem, money, lineTotal, cartSubtotal } from "@/lib/menu";
import { useCart } from "./cart";

export function CartLines({ compact = false }: { compact?: boolean }) {
  const { lines, change, remove } = useCart();
  return (
    <>
      {lines.map((line, idx) => {
        const item = findItem(line.id);
        if (!item) return null;
        return (
          <article
            className={`cart-line drop-motion-soft ${compact ? "compact" : ""}`}
            key={line.id}
            style={{ "--drop-delay": `${idx * 40}ms` } as React.CSSProperties}
          >
            {item.image && !item.imageRemoved ? (
              <img src={item.image} width={80} height={80} alt={item.name} loading="lazy" />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-secondary rounded flex flex-col items-center justify-center text-muted-foreground border border-border">
                <UtensilsCrossed size={18} />
              </div>
            )}
            <div>
              <h3>{item.name}</h3>
              <p>{money(item.priceKobo)} each</p>
              <div className="quantity">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => change(line.id, -1)}
                  aria-label={`Decrease ${item.name}`}
                >
                  <Minus />
                </Button>
                <span aria-label={`${item.name} quantity`}>{line.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => change(line.id, 1)}
                  aria-label={`Increase ${item.name}`}
                >
                  <Plus />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(line.id)}
                  aria-label={`Remove ${item.name}`}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
            <div className="line-total">{money(lineTotal(line))}</div>
          </article>
        );
      })}
    </>
  );
}

export function CartDrawer() {
  const { lines, drawerOpen, setDrawerOpen, count } = useCart();
  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent className="cart-drawer">
        <SheetHeader>
          <SheetTitle>Your cart ({count})</SheetTitle>
          <SheetDescription>Review your selections before checkout.</SheetDescription>
        </SheetHeader>
        {lines.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={34} />
            <p>Your cart is empty.</p>
          </div>
        ) : (
          <>
            <div className="drawer-lines">
              <CartLines compact />
            </div>
            <div className="drawer-foot">
              <div className="summary-row summary-total">
                <span>Subtotal</span>
                <span>{money(cartSubtotal(lines))}</span>
              </div>
              <Button asChild size="lg" onClick={() => setDrawerOpen(false)}>
                <Link to="/checkout">
                  Proceed to Checkout <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline" onClick={() => setDrawerOpen(false)}>
                <Link to="/cart">View full cart</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
