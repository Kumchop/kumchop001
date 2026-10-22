import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  UtensilsCrossed,
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Lock,
  Unlock,
  Phone,
  MessageCircle,
  Plus,
  RefreshCw,
  ShoppingBag,
  DollarSign,
  MapPin,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { menuItems, money, categories, pageHead, MenuItem } from "@/lib/menu";
import {
  getStoredOrders,
  updateOrderStatus,
  deleteOrder,
  saveOrder,
  getInventoryOverrides,
  setDishSoldOut,
  type RestaurantOrder,
  type OrderStatus,
} from "@/lib/orders";
import {
  getDeliveryAreas,
  saveDeliveryAreas,
  DEFAULT_DELIVERY_AREAS,
  type DeliveryArea,
} from "@/lib/delivery";

export const Route = createFileRoute("/dashboard")({
  head: () =>
    pageHead(
      "Kitchen & Order Dashboard",
      "Private Kumchop management dashboard to manage live orders, dish availability and delivery fees.",
    ),
  component: DashboardPage,
});

const DEFAULT_PIN = "2026";

function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const [activeTab, setActiveTab] = useState<"orders" | "inventory" | "delivery">("orders");
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [orderSearch, setOrderSearch] = useState("");

  const [inventoryOverrides, setOverrides] = useState<Record<string, boolean>>({});
  const [dishSearch, setDishSearch] = useState("");
  const [dishCategory, setDishCategory] = useState("all");

  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([]);
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editFeeNaira, setEditFeeNaira] = useState("");

  // New Area form
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaDesc, setNewAreaDesc] = useState("");
  const [newAreaFeeNaira, setNewAreaFeeNaira] = useState("");
  const [showAddArea, setShowAddArea] = useState(false);

  // Check session unlock
  useEffect(() => {
    if (sessionStorage.getItem("kumchop-staff-auth") === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const refreshData = () => {
    setOrders(getStoredOrders());
    setOverrides(getInventoryOverrides());
    setDeliveryAreas(getDeliveryAreas());
  };

  useEffect(() => {
    refreshData();
    const handleOrderUpdate = () => setOrders(getStoredOrders());
    const handleInvUpdate = () => setOverrides(getInventoryOverrides());
    const handleAreaUpdate = () => setDeliveryAreas(getDeliveryAreas());

    window.addEventListener("kumchop-orders-updated", handleOrderUpdate);
    window.addEventListener("kumchop-inventory-updated", handleInvUpdate);
    window.addEventListener("kumchop-areas-updated", handleAreaUpdate);

    return () => {
      window.removeEventListener("kumchop-orders-updated", handleOrderUpdate);
      window.removeEventListener("kumchop-inventory-updated", handleInvUpdate);
      window.removeEventListener("kumchop-areas-updated", handleAreaUpdate);
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === DEFAULT_PIN || pinInput.trim() === "kumchop") {
      setIsAuthenticated(true);
      sessionStorage.setItem("kumchop-staff-auth", "true");
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleQuickUnlock = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem("kumchop-staff-auth", "true");
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    refreshData();
  };

  const handleToggleDishStock = (dishId: string, currentSoldOut: boolean) => {
    setDishSoldOut(dishId, !currentSoldOut);
    refreshData();
  };

  const handleSaveAreaFee = (areaId: string) => {
    const naira = parseInt(editFeeNaira.replace(/\D/g, ""), 10);
    if (!isNaN(naira) && naira >= 0) {
      const updated = deliveryAreas.map((a) =>
        a.id === areaId ? { ...a, feeKobo: naira * 100 } : a,
      );
      saveDeliveryAreas(updated);
      setEditingAreaId(null);
      refreshData();
    }
  };

  const handleCreateArea = (e: React.FormEvent) => {
    e.preventDefault();
    const naira = parseInt(newAreaFeeNaira.replace(/\D/g, ""), 10);
    if (!newAreaName.trim() || isNaN(naira)) return;

    const newArea: DeliveryArea = {
      id: `area-${Date.now()}`,
      name: newAreaName.trim(),
      description: newAreaDesc.trim() || "Akungba delivery zone",
      feeKobo: naira * 100,
    };
    const updated = [...deliveryAreas, newArea];
    saveDeliveryAreas(updated);
    setNewAreaName("");
    setNewAreaDesc("");
    setNewAreaFeeNaira("");
    setShowAddArea(false);
    refreshData();
  };

  const handleSimulateNewOrder = () => {
    const testOrder: RestaurantOrder = {
      id: `KUM-${Math.floor(2000 + Math.random() * 8000)}`,
      createdAt: new Date().toISOString(),
      customerName: "Ayomide Ojo",
      customerPhone: "0816 789 0123",
      customerEmail: "ayomide@aaua.edu.ng",
      orderType: "delivery",
      deliveryAreaId: "aaua-campus",
      deliveryAreaName: "AAUA Main Campus (Hostels & Faculties)",
      deliveryAddress: "Kudirat Hall, Ground Floor, Room 06",
      preferredTime: "Warm lunch delivery",
      items: [
        { id: "asun-fried-rice", name: "Asun Fried Rice", quantity: 1, priceKobo: 160000 },
        { id: "turkey", name: "Turkey", quantity: 1, priceKobo: 400000 },
        { id: "coke", name: "Coke", quantity: 1, priceKobo: 80000 },
      ],
      subtotalKobo: 640000,
      deliveryFeeKobo: 40000,
      totalKobo: 680000,
      paymentMethod: "card",
      paymentStatus: "paid",
      paymentReference: `PSK_${Date.now().toString().slice(-6)}`,
      orderStatus: "pending",
    };
    saveOrder(testOrder);
    refreshData();
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === "all" || o.orderStatus === statusFilter;
    const q = orderSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      o.id.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      (o.deliveryAddress ?? "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  // Calculate stats
  const totalRevenueKobo = orders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.totalKobo, 0);
  const activeOrdersCount = orders.filter(
    (o) => o.orderStatus === "pending" || o.orderStatus === "preparing",
  ).length;

  const getEffectiveSoldOut = (item: MenuItem) => {
    if (item.id in inventoryOverrides) {
      return inventoryOverrides[item.id] ?? item.soldOut;
    }
    return item.soldOut;
  };

  const soldOutCount = menuItems.filter((i) => getEffectiveSoldOut(i)).length;

  if (!isAuthenticated) {
    return (
      <div className="site-container page-top min-h-[70vh] flex items-center justify-center">
        <div className="dashboard-login-card">
          <div className="dashboard-login-icon">
            <Lock size={32} />
          </div>
          <h2>Kumchop Staff Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-2 mb-6">
            Private kitchen controls for managing live customer orders, dish availability and
            delivery fees.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold block text-left mb-1.5">
                Staff PIN (Default: 2026)
              </label>
              <input
                type="password"
                placeholder="Enter 4-digit PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="text-center text-lg tracking-widest font-mono"
                autoFocus
              />
              {pinError && (
                <p className="text-xs text-destructive mt-1 text-left">
                  Incorrect PIN. Please use 2026.
                </p>
              )}
            </div>

            <Button type="submit" size="lg" className="w-full">
              <Unlock size={16} /> Unlock Dashboard
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleQuickUnlock}
              className="w-full text-xs"
            >
              1-Click Instant Staff Access
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="site-container page-top pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="eyebrow">RESTAURANT MANAGEMENT</span>
            <h1 className="text-3xl md:text-5xl font-display">Kitchen & Orders</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSimulateNewOrder}>
              <Plus size={15} /> Simulate Test Order
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAuthenticated(false);
                sessionStorage.removeItem("kumchop-staff-auth");
              }}
            >
              <Lock size={15} /> Lock
            </Button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="dashboard-stats-grid mt-6">
          <div className="dashboard-stat-card">
            <div className="stat-icon bg-amber-500/10 text-amber-500">
              <ChefHat size={22} />
            </div>
            <div>
              <span className="stat-label">Active in Kitchen</span>
              <strong className="stat-val">{activeOrdersCount}</strong>
            </div>
          </div>

          <div className="dashboard-stat-card">
            <div className="stat-icon bg-emerald-500/10 text-emerald-500">
              <DollarSign size={22} />
            </div>
            <div>
              <span className="stat-label">Paid Revenue</span>
              <strong className="stat-val">{money(totalRevenueKobo)}</strong>
            </div>
          </div>

          <div className="dashboard-stat-card">
            <div className="stat-icon bg-blue-500/10 text-blue-500">
              <ShoppingBag size={22} />
            </div>
            <div>
              <span className="stat-label">Total Orders</span>
              <strong className="stat-val">{orders.length}</strong>
            </div>
          </div>

          <div className="dashboard-stat-card">
            <div className="stat-icon bg-red-500/10 text-red-500">
              <UtensilsCrossed size={22} />
            </div>
            <div>
              <span className="stat-label">Sold Out Dishes</span>
              <strong className="stat-val">{soldOutCount}</strong>
            </div>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <div className="dashboard-nav-tabs mt-8">
          <button
            className={`dashboard-tab-btn ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <ShoppingBag size={17} /> Live Orders ({orders.length})
          </button>
          <button
            className={`dashboard-tab-btn ${activeTab === "inventory" ? "active" : ""}`}
            onClick={() => setActiveTab("inventory")}
          >
            <UtensilsCrossed size={17} /> Menu & Sold-Out Switch ({soldOutCount} out)
          </button>
          <button
            className={`dashboard-tab-btn ${activeTab === "delivery" ? "active" : ""}`}
            onClick={() => setActiveTab("delivery")}
          >
            <MapPin size={17} /> Delivery Areas & Fees ({deliveryAreas.length})
          </button>
        </div>
      </div>

      <section className="site-container page-body pt-2">
        {/* ===================== TAB 1: ORDERS ===================== */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="dashboard-toolbar">
              <div className="search-field flex-1 max-w-md">
                <Search />
                <input
                  type="search"
                  placeholder="Search by customer, phone or order ID..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <Filter size={16} className="text-muted-foreground" />
                {(
                  [
                    { id: "all", label: "All" },
                    { id: "pending", label: "Pending" },
                    { id: "preparing", label: "Preparing" },
                    { id: "ready", label: "Ready" },
                    { id: "completed", label: "Completed" },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    className={`status-pill-filter ${statusFilter === f.id ? "active" : ""}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="empty-state">
                <Clock size={36} />
                <h2>No orders found in this view</h2>
                <p>Try resetting your search query or filter.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOrderSearch("");
                    setStatusFilter("all");
                  }}
                >
                  Reset filters
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredOrders.map((order) => {
                  const isPaid = order.paymentStatus === "paid";
                  const waCustomerUrl = `https://wa.me/234${order.customerPhone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(
                    `Hello ${order.customerName}! Update on your Kumchop order #${order.id}: Current status is ${order.orderStatus.toUpperCase()}. Thank you for choosing Kumchop!`,
                  )}`;

                  return (
                    <article key={order.id} className="order-admin-card">
                      <div className="order-admin-header">
                        <div>
                          <span className="order-admin-id">#{order.id}</span>
                          <span className="order-admin-time">
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <span className={`status-badge ${order.orderStatus}`}>
                          {order.orderStatus.toUpperCase()}
                        </span>
                      </div>

                      {/* Customer info */}
                      <div className="order-customer-box">
                        <strong className="text-sm block">{order.customerName}</strong>
                        <div className="flex items-center gap-2 mt-1">
                          <a
                            href={`tel:${order.customerPhone.replace(/\s/g, "")}`}
                            className="order-comm-btn"
                            title="Call Customer"
                          >
                            <Phone size={13} /> {order.customerPhone}
                          </a>
                          <a
                            href={waCustomerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="order-comm-btn wa"
                            title="WhatsApp Customer"
                          >
                            <MessageCircle size={13} /> Chat
                          </a>
                        </div>
                        <div className="order-admin-dest mt-2">
                          {order.orderType === "delivery" ? (
                            <p className="text-xs flex items-start gap-1 text-muted-foreground">
                              <MapPin size={13} className="text-primary flex-shrink-0 mt-0.5" />
                              <span>
                                <strong>{order.deliveryAreaName ?? "Akungba Area"}:</strong>{" "}
                                {order.deliveryAddress}
                              </span>
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <ShoppingBag size={13} className="text-primary" /> Counter Pickup
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Order items */}
                      <div className="order-items-scroll">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="order-item-row">
                            <span>
                              <strong>{item.quantity}×</strong> {item.name}
                            </span>
                            <span>{money(item.priceKobo * item.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      {order.notes && (
                        <div className="order-notes-tag">
                          <em>Note:</em> {order.notes}
                        </div>
                      )}

                      {/* Total & Payment details */}
                      <div className="order-card-foot">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs text-muted-foreground block">
                              Subtotal: {money(order.subtotalKobo)}{" "}
                              {order.deliveryFeeKobo > 0 &&
                                `+ Delivery ${money(order.deliveryFeeKobo)}`}
                            </span>
                            <strong className="text-base font-bold text-primary">
                              Total: {money(order.totalKobo)}
                            </strong>
                          </div>
                          <span
                            className={`payment-pill ${isPaid ? "paid" : "pending"}`}
                            title={order.paymentReference}
                          >
                            {isPaid ? `PAID (${order.paymentMethod.toUpperCase()})` : "UNPAID (WA)"}
                          </span>
                        </div>

                        {/* Status workflow triggers */}
                        <div className="order-actions-grid mt-3">
                          {order.orderStatus === "pending" && (
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => handleStatusChange(order.id, "preparing")}
                            >
                              <ChefHat size={14} /> Start Preparing
                            </Button>
                          )}
                          {order.orderStatus === "preparing" && (
                            <Button
                              size="sm"
                              className="w-full bg-emerald-600 hover:bg-emerald-500"
                              onClick={() => handleStatusChange(order.id, "ready")}
                            >
                              <CheckCircle2 size={14} /> Mark as Ready
                            </Button>
                          )}
                          {order.orderStatus === "ready" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => handleStatusChange(order.id, "completed")}
                            >
                              Complete / Delivered
                            </Button>
                          )}
                          {order.orderStatus !== "cancelled" &&
                            order.orderStatus !== "completed" && (
                              <button
                                type="button"
                                className="order-cancel-link"
                                onClick={() => handleStatusChange(order.id, "cancelled")}
                              >
                                Cancel order
                              </button>
                            )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 2: INVENTORY & SOLD-OUT ===================== */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            <div className="dashboard-intro-banner flex-wrap items-center justify-between">
              <div className="flex gap-3 items-start flex-1 min-w-[280px]">
                <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h4>Live Dish Availability</h4>
                  <p>
                    Most dishes were flagged as sold-out in the original site import. You can
                    restock all dishes with 1-click or toggle individual dishes below.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  menuItems.forEach((i) => {
                    if (i.id !== "5-alive") setDishSoldOut(i.id, false);
                  });
                  refreshData();
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white flex-shrink-0"
              >
                <CheckCircle2 size={15} /> Restock All Dishes to Available
              </Button>
            </div>

            <div className="dashboard-toolbar">
              <div className="search-field flex-1 max-w-md">
                <Search />
                <input
                  type="search"
                  placeholder="Search dish name to toggle stock..."
                  value={dishSearch}
                  onChange={(e) => setDishSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {[{ id: "all", name: "All Categories" }, ...categories].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setDishCategory(c.id)}
                    className={`status-pill-filter ${dishCategory === c.id ? "active" : ""}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="inventory-grid">
              {menuItems
                .filter((item) => {
                  const matchesCat =
                    dishCategory === "all" || item.categories.includes(dishCategory);
                  const q = dishSearch.toLowerCase().trim();
                  const matchesQuery = !q || item.name.toLowerCase().includes(q);
                  return matchesCat && matchesQuery;
                })
                .map((dish) => {
                  const isSoldOut = getEffectiveSoldOut(dish);

                  return (
                    <div
                      key={dish.id}
                      className={`inventory-card ${isSoldOut ? "is-sold-out" : ""}`}
                    >
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="inventory-thumb"
                        loading="lazy"
                      />
                      <div className="inventory-info">
                        <span className="inventory-cat">{dish.category}</span>
                        <h4>{dish.name}</h4>
                        <strong className="text-sm">{money(dish.priceKobo)}</strong>
                      </div>
                      <div className="inventory-action">
                        <span className={`inventory-state-tag ${isSoldOut ? "out" : "in"}`}>
                          {isSoldOut ? "Sold Out" : "In Stock"}
                        </span>
                        <Button
                          size="sm"
                          variant={isSoldOut ? "default" : "outline"}
                          onClick={() => handleToggleDishStock(dish.id, isSoldOut)}
                          className={isSoldOut ? "bg-emerald-600 hover:bg-emerald-500" : ""}
                        >
                          {isSoldOut ? "Restock Dish" : "Mark Sold Out"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ===================== TAB 3: DELIVERY AREAS ===================== */}
        {activeTab === "delivery" && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-xl font-bold">Akungba Delivery Zones & Fees</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Customers pick their delivery location at checkout. The fee below is automatically
                  added to their total.
                </p>
              </div>
              <Button size="sm" onClick={() => setShowAddArea(!showAddArea)}>
                <Plus size={15} /> {showAddArea ? "Cancel" : "Add Delivery Area"}
              </Button>
            </div>

            {/* Add Area Form */}
            {showAddArea && (
              <form onSubmit={handleCreateArea} className="dashboard-form-card">
                <h4 className="text-sm font-semibold mb-3">Add New Akungba Delivery Location</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Zone Name *</label>
                    <input
                      placeholder="e.g. AAUA Permanent Site Gate"
                      value={newAreaName}
                      onChange={(e) => setNewAreaName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">
                      Description & Landmark
                    </label>
                    <input
                      placeholder="e.g. Student lodges near Permanent Site"
                      value={newAreaDesc}
                      onChange={(e) => setNewAreaDesc(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">
                      Delivery Fee (₦) *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={newAreaFeeNaira}
                      onChange={(e) => setNewAreaFeeNaira(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button type="submit" size="sm">
                    Save New Zone
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddArea(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            <div className="delivery-zones-table">
              {deliveryAreas.map((area) => (
                <div key={area.id} className="delivery-zone-row">
                  <div className="flex-1">
                    <strong className="text-sm block">{area.name}</strong>
                    <span className="text-xs text-muted-foreground">{area.description}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {editingAreaId === area.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs">₦</span>
                        <input
                          type="number"
                          className="w-24 text-sm py-1"
                          value={editFeeNaira}
                          onChange={(e) => setEditFeeNaira(e.target.value)}
                          autoFocus
                        />
                        <Button size="sm" onClick={() => handleSaveAreaFee(area.id)}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingAreaId(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="text-base font-bold text-primary">
                          {money(area.feeKobo)}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingAreaId(area.id);
                            setEditFeeNaira(String(area.feeKobo / 100));
                          }}
                        >
                          Edit Fee
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-secondary rounded border border-border mt-6">
              <h4 className="text-sm font-semibold mb-1">Akungba Rider & Delivery Notes</h4>
              <p className="text-xs text-muted-foreground">
                All fees reflect standard motorcycle logistics rates across Akungba Akoko, from AAUA
                Campus to Ibaka and Medview quarters. Changes take effect on the customer checkout
                screen immediately.
              </p>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
