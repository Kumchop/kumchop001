import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import {
  MessageCircle,
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  MapPin,
  Clock,
  Sparkles,
  ShoppingBag,
  PackageCheck,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/restaurant/cart";
import {
  findItem,
  lineTotal,
  cartSubtotal,
  orderTotal,
  deliveryFee,
  money,
  restaurant,
  whatsappUrl,
  canSubmitOrder,
  pageHead,
  type OrderDetails,
} from "@/lib/menu";
import { itemRequiresTakeaway, TAKEAWAY_PACK_FEE_KOBO } from "@/lib/menu-custom";
import { getDeliveryAreas, type DeliveryArea } from "@/lib/delivery";
import { PaymentModal, type PaymentSuccessData } from "@/components/restaurant/payment-modal";
import { saveOrder, type RestaurantOrder } from "@/lib/orders";

export const Route = createFileRoute("/checkout")({
  head: () =>
    pageHead(
      "Checkout",
      "Enter your details and send your Kumchop order on WhatsApp for confirmation.",
    ),
  component: Checkout,
});

export function validateOrder(o: OrderDetails) {
  const e: Record<string, string> = {};
  if (o.name.trim().length < 2) e["name"] = "Please enter your full name.";
  if (!/^\+?[0-9 ()-]{7,20}$/.test(o.phone.trim()) || o.phone.replace(/\D/g, "").length < 10)
    e["phone"] = "Enter a valid phone number, e.g. 0803 000 0000.";
  if (o.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o.email))
    e["email"] = "Enter a valid email or leave it blank.";
  if (o.orderType === "delivery" && (o.address ?? "").trim().length < 8)
    e["address"] = "Enter your delivery address with a landmark.";
  return e;
}

function Checkout() {
  const { lines, clear } = useCart();
  const [type, setType] = useState<"pickup" | "delivery">("pickup");
  const [areas, setAreas] = useState<DeliveryArea[]>(() => getDeliveryAreas());
  const [selectedAreaId, setSelectedAreaId] = useState<string>(
    () => getDeliveryAreas()[0]?.id ?? "aaua-campus",
  );
  const [paymentChoice, setPaymentChoice] = useState<"online" | "whatsapp">("online");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<RestaurantOrder | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    time: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [waUrl, setWaUrl] = useState<string | null>(null);

  useEffect(() => {
    const list = getDeliveryAreas();
    setAreas(list);
    if (list.length > 0 && !selectedAreaId) {
      setSelectedAreaId(list[0]?.id ?? "aaua-campus");
    }
  }, [selectedAreaId]);

  // Check if any cart item requires compulsory takeaway packaging (foods like rice, beans, swallow, soups)
  const isTakeawayCompulsory = lines.some((l) => {
    const it = findItem(l.id);
    return it ? itemRequiresTakeaway(it) : false;
  });

  // For snacks, user can optionally pick takeaway packaging; for cooked foods, it is compulsory
  const [takeawaySelected, setTakeawaySelected] = useState<boolean>(true);

  // If compulsory, it is always enforced
  const hasTakeawayPackaging = isTakeawayCompulsory ? true : takeawaySelected;
  const takeawayFee = hasTakeawayPackaging ? TAKEAWAY_PACK_FEE_KOBO : 0;

  const selectedArea = areas.find((a) => a.id === selectedAreaId) ?? areas[0];
  const areaFee = type === "delivery" ? (selectedArea?.feeKobo ?? 50000) : 0;
  const currentTotal = orderTotal(lines, type, areaFee, takeawayFee);
  const fee = deliveryFee(type, areaFee);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getValidatedOrderData = (): OrderDetails | null => {
    const o: OrderDetails = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      orderType: type,
      deliveryArea: type === "delivery" ? selectedArea?.name : undefined,
      deliveryFeeKobo: type === "delivery" ? areaFee : 0,
      takeawayFeeKobo: takeawayFee,
      hasTakeawayPackaging,
      isTakeawayCompulsory,
      address: formData.address.trim() || undefined,
      time: formData.time.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    };
    const errs = validateOrder(o);
    if (isTakeawayCompulsory && !hasTakeawayPackaging) {
      errs["takeaway"] = "Takeaway food packaging is compulsory for meals in your order.";
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return null;
    return o;
  };

  const handleProceedPayment = (ev: FormEvent) => {
    ev.preventDefault();
    const orderData = getValidatedOrderData();
    if (!orderData) return;

    if (paymentChoice === "online") {
      setPaymentModalOpen(true);
    } else {
      // WhatsApp Order
      if (sentAt && Date.now() - sentAt < 5000) return;
      const url = whatsappUrl(lines, orderData);
      if (!url) return;

      const newOrder: RestaurantOrder = {
        id: `KUM-${Date.now().toString().slice(-4)}`,
        createdAt: new Date().toISOString(),
        customerName: orderData.name,
        customerPhone: orderData.phone,
        ...(orderData.email ? { customerEmail: orderData.email } : {}),
        orderType: orderData.orderType,
        ...(selectedArea
          ? { deliveryAreaId: selectedArea.id, deliveryAreaName: selectedArea.name }
          : {}),
        ...(orderData.address ? { deliveryAddress: orderData.address } : {}),
        ...(orderData.time ? { preferredTime: orderData.time } : {}),
        ...(orderData.notes ? { notes: orderData.notes } : {}),
        items: lines
          .map((l) => {
            const item = findItem(l.id);
            return item
              ? {
                  id: l.id,
                  name: item.name,
                  quantity: l.quantity,
                  priceKobo: item.priceKobo,
                }
              : null;
          })
          .filter((x): x is NonNullable<typeof x> => x !== null),
        subtotalKobo: cartSubtotal(lines),
        deliveryFeeKobo: orderData.orderType === "delivery" ? areaFee : 0,
        takeawayFeeKobo: takeawayFee,
        hasTakeawayPackaging,
        totalKobo: currentTotal,
        paymentMethod: "whatsapp",
        paymentStatus: "pending",
        orderStatus: "pending",
      };

      saveOrder(newOrder);
      setSentAt(Date.now());
      setWaUrl(url);

      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  const handlePaymentSuccess = (payment: PaymentSuccessData) => {
    const orderData = getValidatedOrderData();
    if (!orderData) return;

    const orderId = `KUM-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: RestaurantOrder = {
      id: orderId,
      createdAt: new Date().toISOString(),
      customerName: orderData.name,
      customerPhone: orderData.phone,
      ...(orderData.email ? { customerEmail: orderData.email } : {}),
      orderType: orderData.orderType,
      ...(selectedArea
        ? { deliveryAreaId: selectedArea.id, deliveryAreaName: selectedArea.name }
        : {}),
      ...(orderData.address ? { deliveryAddress: orderData.address } : {}),
      ...(orderData.time ? { preferredTime: orderData.time } : {}),
      ...(orderData.notes ? { notes: orderData.notes } : {}),
      items: lines
        .map((l) => {
          const item = findItem(l.id);
          return item
            ? {
                id: l.id,
                name: item.name,
                quantity: l.quantity,
                priceKobo: item.priceKobo,
              }
            : null;
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
      subtotalKobo: cartSubtotal(lines),
      deliveryFeeKobo: orderData.orderType === "delivery" ? areaFee : 0,
      takeawayFeeKobo: takeawayFee,
      hasTakeawayPackaging,
      totalKobo: currentTotal,
      paymentMethod: payment.method,
      paymentStatus: "paid",
      paymentReference: payment.reference,
      orderStatus: "preparing",
    };

    saveOrder(newOrder);
    setPaymentModalOpen(false);
    setConfirmedOrder(newOrder);
    clear();
  };

  const err = (k: string) =>
    errors[k] && (
      <span className="field-error" role="alert">
        {errors[k]}
      </span>
    );

  // If order confirmed, show order receipt
  if (confirmedOrder) {
    const waReceiptUrl = whatsappUrl(
      confirmedOrder.items.map((i) => ({ id: i.id, quantity: i.quantity })),
      {
        name: confirmedOrder.customerName,
        phone: confirmedOrder.customerPhone,
        email: confirmedOrder.customerEmail,
        orderType: confirmedOrder.orderType,
        deliveryArea: confirmedOrder.deliveryAreaName,
        deliveryFeeKobo: confirmedOrder.deliveryFeeKobo,
        address: confirmedOrder.deliveryAddress,
        time: confirmedOrder.preferredTime,
        notes: confirmedOrder.notes,
        paymentMethod: confirmedOrder.paymentMethod,
        paymentStatus: "paid",
        paymentReference: confirmedOrder.paymentReference,
      },
    );

    return (
      <>
        <div className="site-container page-top text-center">
          <span className="eyebrow justify-center">PAYMENT CONFIRMED</span>
          <h1 className="text-4xl md:text-5xl">Order #{confirmedOrder.id} Placed!</h1>
          <p className="mx-auto max-w-xl text-muted-foreground mt-3">
            Thank you, {confirmedOrder.customerName}. Your payment was confirmed and our kitchen in
            Akungba is already preparing your hot meal.
          </p>
        </div>

        <section className="site-container page-body max-w-2xl mx-auto">
          <div className="receipt-box">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/40">
              <img
                src="/assets/aistudio/06Oct24_Anis_Free_Upload_b9819ce2.png"
                alt="Kumchop"
                className="h-10 w-auto object-contain"
              />
              <div className="text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Official Receipt
                </span>
                <p className="text-[11px] text-muted-foreground">Kumchop Restaurant · Akungba</p>
              </div>
            </div>

            <div className="receipt-header">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 size={20} />
                <span>PAID VIA {confirmedOrder.paymentMethod.toUpperCase()}</span>
              </div>
              <span className="receipt-ref">Ref: {confirmedOrder.paymentReference}</span>
            </div>

            <div className="receipt-status-banner">
              <div className="flex items-center gap-3">
                <div className="receipt-pulse" />
                <div>
                  <h3 className="text-sm font-semibold">Kitchen Status: Preparing</h3>
                  <p className="text-xs text-muted-foreground">Estimated time: 20 – 35 minutes</p>
                </div>
              </div>
              <span className="receipt-badge">Live in Kitchen Queue</span>
            </div>

            <div className="receipt-details">
              <h4>Order Breakdown</h4>
              {confirmedOrder.items.map((it) => (
                <div key={it.id} className="summary-row">
                  <span>
                    {it.quantity} × {it.name}
                  </span>
                  <span>{money(it.priceKobo * it.quantity)}</span>
                </div>
              ))}
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{money(confirmedOrder.subtotalKobo)}</span>
              </div>
              {confirmedOrder.takeawayFeeKobo && confirmedOrder.takeawayFeeKobo > 0 ? (
                <div className="summary-row">
                  <span>Takeaway Food Packaging</span>
                  <span>{money(confirmedOrder.takeawayFeeKobo)}</span>
                </div>
              ) : (
                <div className="summary-row text-xs text-muted-foreground">
                  <span>Takeaway Packaging</span>
                  <span>Not included (Snacks only)</span>
                </div>
              )}
              {confirmedOrder.orderType === "delivery" && (
                <div className="summary-row">
                  <span>Delivery ({confirmedOrder.deliveryAreaName ?? "Akungba Area"})</span>
                  <span>{money(confirmedOrder.deliveryFeeKobo)}</span>
                </div>
              )}
              <div className="summary-row summary-total">
                <span>Total Paid</span>
                <span className="text-primary">{money(confirmedOrder.totalKobo)}</span>
              </div>
            </div>

            <div className="receipt-delivery-info">
              <div>
                <strong>Customer:</strong> {confirmedOrder.customerName} (
                {confirmedOrder.customerPhone})
              </div>
              <div>
                <strong>Service:</strong>{" "}
                {confirmedOrder.orderType === "delivery"
                  ? `Delivery to ${confirmedOrder.deliveryAddress}`
                  : "Pickup at Kumchop counter (Opp. Bovas)"}
              </div>
              {confirmedOrder.notes && (
                <div>
                  <strong>Notes:</strong> {confirmedOrder.notes}
                </div>
              )}
            </div>

            <div className="receipt-actions">
              {waReceiptUrl && (
                <Button asChild size="lg" className="w-full">
                  <a href={waReceiptUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle /> Send Receipt to Kumchop on WhatsApp
                  </a>
                </Button>
              )}
              <div className="flex gap-3 mt-3">
                <Button variant="outline" asChild className="flex-1">
                  <Link to="/order">
                    <ShoppingBag size={16} /> Order More Food
                  </Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link to="/dashboard">View in Kitchen Dashboard</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <div className="site-container page-top">
        <span className="eyebrow">READY TO EAT</span>
        <h1>Checkout.</h1>
      </div>

      <section className="site-container page-body">
        {lines.length === 0 ? (
          <div className="empty-state">
            <h2>Your cart is empty.</h2>
            <Button asChild className="mt-6">
              <Link to="/order">Order Online</Link>
            </Button>
          </div>
        ) : (
          <div className="cart-layout">
            <div>
              <form className="form-grid" noValidate onSubmit={handleProceedPayment}>
                <label>
                  Full name *
                  <input
                    name="name"
                    autoComplete="name"
                    placeholder="e.g. Damilola Adebayo"
                    value={formData.name}
                    onChange={handleInputChange}
                    aria-invalid={!!errors["name"]}
                  />
                  {err("name")}
                </label>

                <label>
                  Phone number *
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    placeholder="0803 000 0000"
                    value={formData.phone}
                    onChange={handleInputChange}
                    aria-invalid={!!errors["phone"]}
                  />
                  {err("phone")}
                </label>

                <label className="form-wide">
                  Email (optional)
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  {err("email")}
                </label>

                {/* Pickup vs Delivery */}
                <fieldset className="form-wide order-type">
                  <legend>Service Type *</legend>
                  {(["pickup", "delivery"] as const).map((t) => (
                    <label key={t} className={type === t ? "active" : ""}>
                      <input
                        type="radio"
                        name="orderType"
                        value={t}
                        checked={type === t}
                        onChange={() => setType(t)}
                      />
                      {t === "pickup" ? "Pickup at Restaurant" : "Home / Hostel Delivery"}
                    </label>
                  ))}
                </fieldset>

                {/* Delivery Area Selection */}
                {type === "delivery" && (
                  <div className="form-wide area-selection-box">
                    <label>
                      <span className="flex items-center gap-1.5 font-semibold text-primary">
                        <MapPin size={16} /> Select Delivery Area *
                      </span>
                      <select
                        value={selectedAreaId}
                        onChange={(e) => setSelectedAreaId(e.target.value)}
                        className="mt-1.5"
                      >
                        {areas.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} — {money(a.feeKobo)}
                          </option>
                        ))}
                      </select>
                      {selectedArea && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {selectedArea.description}
                        </p>
                      )}
                    </label>
                  </div>
                )}

                {type === "delivery" && (
                  <label className="form-wide">
                    Specific Hostel / House Address & Landmark *
                    <textarea
                      name="address"
                      autoComplete="street-address"
                      placeholder="e.g. Peace Villa Lodge, Flat 3B, Small Gate, opposite Bovas filling station"
                      value={formData.address}
                      onChange={handleInputChange}
                      aria-invalid={!!errors["address"]}
                    />
                    {err("address")}
                  </label>
                )}

                <label className="form-wide">
                  Preferred delivery/pickup time (optional)
                  <input
                    name="time"
                    placeholder="e.g. As soon as possible, or 7:30 PM"
                    value={formData.time}
                    onChange={handleInputChange}
                  />
                </label>

                <label className="form-wide">
                  Special cooking notes / allergy instructions (optional)
                  <textarea
                    name="notes"
                    placeholder="e.g. Extra spicy, no onions, package drinks separately..."
                    value={formData.notes}
                    onChange={handleInputChange}
                  />
                </label>

                {/* Takeaway / Packaging Option */}
                <div className="form-wide takeaway-packaging-box">
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <span className="flex items-center gap-1.5 font-semibold text-primary">
                      <PackageCheck size={18} /> Takeaway Food Packaging Option *
                    </span>
                    {isTakeawayCompulsory ? (
                      <span className="takeaway-badge compulsory">COMPULSORY FOR FOODS</span>
                    ) : (
                      <span className="takeaway-badge optional">OPTIONAL FOR SNACKS</span>
                    )}
                  </div>

                  {isTakeawayCompulsory ? (
                    <div className="takeaway-card compulsory-state">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={true}
                          readOnly
                          className="mt-1 accent-primary"
                          id="takeaway-compulsory-input"
                          aria-label="Takeaway packaging is compulsory for cooked meals"
                        />
                        <label htmlFor="takeaway-compulsory-input" className="cursor-pointer">
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong>
                              Takeaway Packaging Pack (+{money(TAKEAWAY_PACK_FEE_KOBO)})
                            </strong>
                            <span className="text-[11px] bg-primary/20 text-primary font-semibold px-2 py-0.5 rounded">
                              Required
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Takeaway packaging is <strong>compulsory</strong> for foods like rice,
                            beans, swallow and soups in your order to guarantee safe, sealed food
                            packaging.
                          </p>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="takeaway-card optional-state">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={takeawaySelected}
                          onChange={(e) => setTakeawaySelected(e.target.checked)}
                          className="mt-1 accent-primary"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong>
                              Add Takeaway Packaging Container (+{money(TAKEAWAY_PACK_FEE_KOBO)})
                            </strong>
                          </div>
                          <span className="text-xs text-muted-foreground block mt-1">
                            Optional underneath: Snacks and pastries do not need compulsory
                            packaging. You can checkout without picking the takeaway option.
                          </span>
                        </div>
                      </label>
                    </div>
                  )}
                  {err("takeaway")}
                </div>

                {/* Payment Selection */}
                <fieldset className="form-wide payment-choice-field">
                  <legend>Payment Option *</legend>
                  <div className="payment-options-grid">
                    <label className={`payment-tile ${paymentChoice === "online" ? "active" : ""}`}>
                      <input
                        type="radio"
                        name="paymentChoice"
                        value="online"
                        checked={paymentChoice === "online"}
                        onChange={() => setPaymentChoice("online")}
                      />
                      <div className="payment-tile-content">
                        <div className="flex items-center gap-2">
                          <CreditCard className="text-primary" size={20} />
                          <strong>Pay Online Now (Recommended)</strong>
                          <span className="recommended-tag">Instant Queue</span>
                        </div>
                        <p>
                          Pay securely with Debit Card, Bank Transfer, or USSD. Your order is
                          instantly placed in the kitchen preparation queue.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`payment-tile ${paymentChoice === "whatsapp" ? "active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="paymentChoice"
                        value="whatsapp"
                        checked={paymentChoice === "whatsapp"}
                        onChange={() => setPaymentChoice("whatsapp")}
                      />
                      <div className="payment-tile-content">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="text-emerald-400" size={20} />
                          <strong>Send via WhatsApp</strong>
                        </div>
                        <p>
                          Message your order to Kumchop ({restaurant.primaryOrderingNumber}). Pay
                          after restaurant confirms food availability.
                        </p>
                      </div>
                    </label>
                  </div>
                </fieldset>

                <div className="form-wide pt-2">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={!canSubmitOrder(lines)}
                    className="w-full text-base font-semibold"
                  >
                    {paymentChoice === "online" ? (
                      <>
                        <Sparkles size={18} />
                        Proceed to Pay {money(currentTotal)}
                      </>
                    ) : (
                      <>
                        <MessageCircle size={18} />
                        Send Order to WhatsApp ({money(currentTotal)})
                      </>
                    )}
                  </Button>

                  <p className="fine-print">
                    {paymentChoice === "online"
                      ? "Protected by 256-bit encryption. Card, Bank Transfer & USSD supported."
                      : `Your order is sent directly to Kumchop's primary ordering desk.`}
                  </p>

                  {sentAt && paymentChoice === "whatsapp" && (
                    <p role="status" className="form-feedback">
                      WhatsApp should open with your order. Tap send in WhatsApp, then wait for
                      Kumchop to confirm.
                      {waUrl && (
                        <>
                          {" "}
                          Not opened?{" "}
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline font-semibold"
                          >
                            Tap here to open WhatsApp
                          </a>
                          .
                        </>
                      )}
                    </p>
                  )}
                </div>
              </form>

              <Button variant="link" asChild className="mt-5">
                <Link to="/cart">
                  <ArrowLeft />
                  Back to cart
                </Link>
              </Button>
            </div>

            {/* Sidebar Summary */}
            <aside className="cart-summary sticky top-24">
              <h3>Order summary</h3>
              <div className="summary-items-list max-h-72 overflow-y-auto">
                {lines.map((l) => {
                  const it = findItem(l.id);
                  return it ? (
                    <div key={l.id} className="summary-row">
                      <div className="flex items-center gap-2">
                        {it.image && !it.imageRemoved ? (
                          <img
                            src={it.image}
                            alt={it.name}
                            className="w-9 h-9 rounded object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded bg-secondary flex items-center justify-center text-muted-foreground border border-border">
                            <UtensilsCrossed size={14} />
                          </div>
                        )}
                        <span>
                          {l.quantity} × {it.name}
                        </span>
                      </div>
                      <span className="font-medium">{money(lineTotal(l))}</span>
                    </div>
                  ) : null;
                })}
              </div>

              <div className="summary-row pt-3">
                <span>Subtotal</span>
                <span>{money(cartSubtotal(lines))}</span>
              </div>

              <div className="summary-row">
                <span>Takeaway Packaging</span>
                <span className={takeawayFee > 0 ? "font-medium" : "text-xs text-muted-foreground"}>
                  {takeawayFee > 0 ? money(takeawayFee) : "None (Optional for snacks)"}
                </span>
              </div>

              {type === "delivery" && (
                <div className="summary-row">
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-primary" />
                    Delivery: {selectedArea?.name?.split("(")[0]?.trim()}
                  </span>
                  <span>{fee === null ? "To be confirmed" : money(fee)}</span>
                </div>
              )}

              <div className="summary-row summary-total text-xl">
                <span>Total</span>
                <span className="text-primary">{money(currentTotal)}</span>
              </div>

              <div className="delivery-time-callout mt-4">
                <Clock size={16} className="text-primary" />
                <span>Standard Akungba Prep & Delivery: 25–40 mins</span>
              </div>
            </aside>
          </div>
        )}
      </section>

      {/* Online Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        totalKobo={currentTotal}
        customerName={formData.name}
        customerPhone={formData.phone}
        customerEmail={formData.email}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}
