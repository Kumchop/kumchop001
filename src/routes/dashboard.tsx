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
  ImageOff,
  Image,
  Upload,
  Trash2,
  X,
  PackageCheck,
  CreditCard,
  ShieldCheck,
  ExternalLink,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { menuItems, money, categories, pageHead, MenuItem } from "@/lib/menu";
import { getPublicPaymentConfig, type PaymentConfigResult } from "@/lib/payment.functions";
import {
  getFullActiveMenu,
  saveCustomDish,
  deleteCustomDish,
  setDishImageRemoved,
  setDishCustomImage,
  itemRequiresTakeaway,
} from "@/lib/menu-custom";
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

const DEFAULT_PIN = "@Kumchop##";

function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const [activeTab, setActiveTab] = useState<"orders" | "inventory" | "delivery" | "payments">(
    "orders",
  );
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfigResult>({
    paystackConfigured: false,
    paystackPublicKey: "",
    paystackMode: "none",
    flutterwaveConfigured: false,
    flutterwavePublicKey: "",
    flutterwaveMode: "none",
    settlementBank: {
      bankName: "Moniepoint Microfinance Bank",
      accountNumber: "8067730012",
      accountName: "Kumchop Food Express Akungba",
      whatsappNumber: "+234 806 773 0012",
    },
  });
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [orderSearch, setOrderSearch] = useState("");

  const [inventoryOverrides, setOverrides] = useState<Record<string, boolean>>({});
  const [dishSearch, setDishSearch] = useState("");
  const [dishCategory, setDishCategory] = useState("all");

  // All menu dishes (combining base records + custom dishes with removed images applied)
  const [allMenuDishes, setAllMenuDishes] = useState<MenuItem[]>(() =>
    typeof window !== "undefined" ? getFullActiveMenu() : menuItems,
  );

  // New Dish form state
  const [showAddDish, setShowAddDish] = useState(false);
  const [newDishName, setNewDishName] = useState("");
  const [newDishCategory, setNewDishCategory] = useState("rice");
  const [newDishPriceNaira, setNewDishPriceNaira] = useState("");
  const [newDishImage, setNewDishImage] = useState(
    "/src/assets/images/jollof_rice_platter_1792355346443.jpg",
  );
  const [newDishRequiresTakeaway, setNewDishRequiresTakeaway] = useState(true);

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
    setAllMenuDishes(getFullActiveMenu());
    getPublicPaymentConfig()
      .then(setPaymentConfig)
      .catch(() => {});
  };

  useEffect(() => {
    refreshData();
    const handleOrderUpdate = () => setOrders(getStoredOrders());
    const handleInvUpdate = () => setOverrides(getInventoryOverrides());
    const handleAreaUpdate = () => setDeliveryAreas(getDeliveryAreas());
    const handleMenuUpdate = () => setAllMenuDishes(getFullActiveMenu());

    window.addEventListener("kumchop-orders-updated", handleOrderUpdate);
    window.addEventListener("kumchop-inventory-updated", handleInvUpdate);
    window.addEventListener("kumchop-areas-updated", handleAreaUpdate);
    window.addEventListener("kumchop-menu-updated", handleMenuUpdate);

    return () => {
      window.removeEventListener("kumchop-orders-updated", handleOrderUpdate);
      window.removeEventListener("kumchop-inventory-updated", handleInvUpdate);
      window.removeEventListener("kumchop-areas-updated", handleAreaUpdate);
      window.removeEventListener("kumchop-menu-updated", handleMenuUpdate);
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === DEFAULT_PIN) {
      setIsAuthenticated(true);
      sessionStorage.setItem("kumchop-staff-auth", "true");
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    refreshData();
  };

  const handleCategorySelect = (catId: string) => {
    setNewDishCategory(catId);
    if (catId === "snacks" || catId === "drinks" || catId === "ice-cream") {
      setNewDishRequiresTakeaway(false);
    } else {
      setNewDishRequiresTakeaway(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setNewDishImage(reader.result);
          toast.success("Cover image selected!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateDish = (e: React.FormEvent) => {
    e.preventDefault();
    const naira = parseInt(newDishPriceNaira.replace(/\D/g, ""), 10);
    if (!newDishName.trim()) {
      toast.error("Please enter a dish name.");
      return;
    }
    if (isNaN(naira) || naira <= 0) {
      toast.error("Please enter a valid price in Naira.");
      return;
    }

    saveCustomDish({
      name: newDishName.trim(),
      category: newDishCategory,
      priceKobo: naira * 100,
      image: newDishImage,
      requiresTakeaway: newDishRequiresTakeaway,
    });

    toast.success(`"${newDishName}" added to the Kumchop menu!`);
    setNewDishName("");
    setNewDishPriceNaira("");
    setShowAddDish(false);
    refreshData();
  };

  const handleToggleDishImage = (dishId: string, remove: boolean) => {
    setDishImageRemoved(dishId, remove);
    if (remove) {
      toast.info("Image removed from menu for this dish.");
    } else {
      toast.success("Image restored to menu for this dish.");
    }
    refreshData();
  };

  const handleUploadDishCover = (dishId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setDishCustomImage(dishId, reader.result);
          toast.success("Cover image updated for this dish!");
          refreshData();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteCustomDish = (dishId: string, dishName: string) => {
    if (confirm(`Remove "${dishName}" permanently from the menu?`)) {
      deleteCustomDish(dishId);
      toast.info(`Removed "${dishName}" from menu.`);
      refreshData();
    }
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

  const soldOutCount = allMenuDishes.filter((i) => getEffectiveSoldOut(i)).length;

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
              <label className="text-xs font-semibold block text-left mb-1.5">Staff Passcode</label>
              <input
                type="password"
                placeholder="Enter admin passcode"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="text-center text-lg tracking-wider font-mono"
                autoFocus
              />
              {pinError && (
                <p className="text-xs text-destructive mt-1 text-left">
                  Incorrect passcode. Please try again.
                </p>
              )}
            </div>

            <Button type="submit" size="lg" className="w-full">
              <Unlock size={16} /> Unlock Dashboard
            </Button>
          </form>
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
          <button
            className={`dashboard-tab-btn ${activeTab === "payments" ? "active" : ""}`}
            onClick={() => setActiveTab("payments")}
          >
            <CreditCard size={17} /> Bank & Gateway Settlements
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
                              Subtotal: {money(order.subtotalKobo)}
                              {order.takeawayFeeKobo && order.takeawayFeeKobo > 0
                                ? ` + Pack ${money(order.takeawayFeeKobo)}`
                                : ""}
                              {order.deliveryFeeKobo > 0
                                ? ` + Delivery ${money(order.deliveryFeeKobo)}`
                                : ""}
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

        {/* ===================== TAB 2: INVENTORY & DISH MANAGEMENT ===================== */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            <div className="dashboard-intro-banner flex-wrap items-center justify-between">
              <div className="flex gap-3 items-start flex-1 min-w-[280px]">
                <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h4>Live Dish Availability & Menu Controls</h4>
                  <p>
                    Manage dishes, add new items with cover images, remove images from the menu, or
                    toggle stock availability.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <Button
                  size="sm"
                  onClick={() => setShowAddDish(!showAddDish)}
                  className="gap-1.5 flex-shrink-0"
                >
                  {showAddDish ? <X size={15} /> : <Plus size={15} />}
                  {showAddDish ? "Close Form" : "Add New Dish"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    allMenuDishes.forEach((i) => {
                      if (i.id !== "5-alive") setDishSoldOut(i.id, false);
                    });
                    refreshData();
                    toast.success("Restocked all dishes to In Stock!");
                  }}
                  className="border-emerald-600 text-emerald-400 hover:bg-emerald-500/10 flex-shrink-0"
                >
                  <CheckCircle2 size={15} /> Restock All Dishes
                </Button>
              </div>
            </div>

            {/* Add New Dish Form */}
            {showAddDish && (
              <form onSubmit={handleCreateDish} className="dashboard-form-card space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Add New Dish to Kumchop Menu
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Enter dish name, naira price, category, cover photo and packaging rules.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddDish(false)}
                  >
                    <X size={16} />
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1.5 text-foreground">
                      Dish Name *
                    </label>
                    <input
                      placeholder="e.g. Ofada Rice & Assorted Ayamase"
                      value={newDishName}
                      onChange={(e) => setNewDishName(e.target.value)}
                      required
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1.5 text-foreground">
                      Category *
                    </label>
                    <select
                      value={newDishCategory}
                      onChange={(e) => handleCategorySelect(e.target.value)}
                      className="w-full"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1.5 text-foreground">
                      Price in Naira (₦) *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2500"
                      value={newDishPriceNaira}
                      onChange={(e) => setNewDishPriceNaira(e.target.value)}
                      required
                      min={50}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Packaging Requirement checkbox */}
                <div className="p-3 rounded-md bg-secondary/80 border border-border">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newDishRequiresTakeaway}
                      onChange={(e) => setNewDishRequiresTakeaway(e.target.checked)}
                      className="mt-0.5 accent-primary"
                    />
                    <div>
                      <strong className="text-xs block text-foreground">
                        Require Compulsory Takeaway Packaging at Checkout
                      </strong>
                      <span className="text-[11px] text-muted-foreground block mt-0.5">
                        {newDishRequiresTakeaway
                          ? "Yes — this is a cooked meal (e.g. rice, swallow, soup, beans). Customers must pick the takeaway packaging pack."
                          : "No — this is a snack, drink or pastry. Customers can checkout without picking takeaway packaging."}
                      </span>
                    </div>
                  </label>
                </div>

                {/* Cover Image Selection */}
                <div>
                  <label className="text-xs font-semibold block mb-2 text-foreground">
                    Cover Photo (Choose Preset or Upload Custom Image) *
                  </label>
                  <div className="grid gap-3 sm:grid-cols-4 items-center">
                    <div className="flex flex-col items-center gap-1.5 p-2 bg-secondary rounded border border-border">
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        Active Preview
                      </span>
                      <img
                        src={newDishImage}
                        alt="Preview"
                        className="w-20 h-20 rounded object-cover border border-border"
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded cursor-pointer hover:bg-primary/90 transition-colors">
                          <Upload size={14} /> Upload Cover from Device
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                        </label>
                        <span className="text-xs text-muted-foreground">
                          or select a food photo preset below:
                        </span>
                      </div>

                      <div className="flex gap-2 overflow-x-auto pb-1 pt-1">
                        {[
                          {
                            label: "Jollof Rice",
                            url: "/src/assets/images/jollof_rice_platter_1792355346443.jpg",
                          },
                          {
                            label: "Pounded Yam",
                            url: "/src/assets/images/pounded_yam_egusi_1792355347234.jpg",
                          },
                          {
                            label: "Amala & Ewedu",
                            url: "/src/assets/images/dark_amala_ewedu_1792356311794.jpg",
                          },
                          {
                            label: "Pepper Soup",
                            url: "/src/assets/images/goat_meat_pepper_soup_1792356311651.jpg",
                          },
                          {
                            label: "Peppered Fish",
                            url: "/src/assets/images/peppered_fish_grill_1792355348130.jpg",
                          },
                          {
                            label: "Shawarma",
                            url: "/src/assets/images/fresh_shawarma_wrap_1792355347438.jpg",
                          },
                          {
                            label: "Meat Pie",
                            url: "/src/assets/images/nigerian_meat_pie_1792356310065.jpg",
                          },
                          {
                            label: "Parfait",
                            url: "/src/assets/images/layered_yogurt_parfait_1792356311845.jpg",
                          },
                        ].map((preset) => (
                          <button
                            type="button"
                            key={preset.label}
                            onClick={() => setNewDishImage(preset.url)}
                            className={`flex flex-col items-center gap-1 p-1 rounded border transition-all flex-shrink-0 ${newDishImage === preset.url ? "border-primary ring-2 ring-primary/40" : "border-border/60 hover:border-border"}`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.label}
                              className="w-12 h-12 rounded object-cover"
                            />
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {preset.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-border/40">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddDish(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="gap-1.5 font-semibold">
                    <Plus size={15} /> Save Dish to Menu
                  </Button>
                </div>
              </form>
            )}

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
              {allMenuDishes
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
                      className={`inventory-card ${isSoldOut ? "is-sold-out" : ""} ${dish.imageRemoved ? "is-image-removed" : ""}`}
                    >
                      {dish.image && !dish.imageRemoved ? (
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="inventory-thumb"
                          loading="lazy"
                        />
                      ) : (
                        <div className="inventory-thumb-placeholder">
                          <ImageOff size={16} />
                          <span>No Image</span>
                        </div>
                      )}

                      <div className="inventory-info">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inventory-cat">{dish.category}</span>
                          {dish.id.startsWith("custom-") && (
                            <span className="text-[9px] bg-primary/20 text-primary font-bold px-1.5 py-0.2 rounded">
                              CUSTOM
                            </span>
                          )}
                          {dish.requiresTakeaway ? (
                            <span
                              className="text-[9px] bg-amber-500/15 text-amber-300 px-1 py-0.2 rounded"
                              title="Takeaway pack compulsory at checkout"
                            >
                              Pack Req.
                            </span>
                          ) : (
                            <span
                              className="text-[9px] text-muted-foreground/80 px-1 py-0.2 rounded"
                              title="Takeaway pack optional at checkout"
                            >
                              Pack Optional
                            </span>
                          )}
                        </div>

                        <h4>{dish.name}</h4>
                        <strong className="text-sm">{money(dish.priceKobo)}</strong>

                        {/* Image Management Actions */}
                        <div className="inventory-image-strip">
                          {!dish.imageRemoved ? (
                            <button
                              type="button"
                              onClick={() => handleToggleDishImage(dish.id, true)}
                              className="text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                              title="Remove image from menu display"
                            >
                              <ImageOff size={12} /> Remove image
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-amber-400 font-medium">
                                Image removed
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleDishImage(dish.id, false)}
                                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                                title="Restore original image"
                              >
                                <Image size={12} /> Restore
                              </button>
                            </div>
                          )}
                          <label className="text-[11px] text-primary/80 hover:text-primary cursor-pointer flex items-center gap-1 ml-auto">
                            <Upload size={11} />
                            Change
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleUploadDishCover(dish.id, e)}
                            />
                          </label>
                          {dish.id.startsWith("custom-") && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomDish(dish.id, dish.name)}
                              className="text-[11px] text-destructive/80 hover:text-destructive flex items-center gap-1"
                              title="Delete this custom dish"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
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

        {/* ===================== TAB 4: BANK & GATEWAYS ===================== */}
        {activeTab === "payments" && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h3 className="text-xl font-bold">Bank Accounts & Merchant Gateways</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Overview of Kumchop's settlement bank account and live Paystack / Flutterwave
                merchant integrations.
              </p>
            </div>

            {/* 1. Verified Settlement Account */}
            <div className="bg-card border border-emerald-500/30 rounded-lg p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-bl">
                Primary Settlement Account
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-base text-foreground">
                    {paymentConfig.settlementBank.bankName}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    All customer card payments, Flutterwave checkouts & direct transfers credit
                    here.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
                <div className="p-3 bg-secondary/50 rounded border border-border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Account Number
                  </span>
                  <strong className="text-lg font-mono text-emerald-400 block mt-1">
                    {paymentConfig.settlementBank.accountNumber}
                  </strong>
                </div>
                <div className="p-3 bg-secondary/50 rounded border border-border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Account Beneficiary
                  </span>
                  <strong className="text-sm font-semibold text-foreground block mt-1">
                    {paymentConfig.settlementBank.accountName}
                  </strong>
                </div>
                <div className="p-3 bg-secondary/50 rounded border border-border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    WhatsApp Proof Line
                  </span>
                  <strong className="text-sm font-semibold text-foreground block mt-1">
                    {paymentConfig.settlementBank.whatsappNumber}
                  </strong>
                </div>
              </div>
            </div>

            {/* 2. Merchant Gateways Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Paystack Gateway Card */}
              <div className="bg-card border border-border rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard size={18} className="text-primary" />
                    <h4 className="font-bold text-sm">Paystack Gateway</h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${
                      paymentConfig.paystackMode === "live"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : paymentConfig.paystackMode === "test"
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : "bg-secondary text-muted-foreground border-border"
                    }`}
                  >
                    {paymentConfig.paystackMode === "live"
                      ? "LIVE GATEWAY"
                      : paymentConfig.paystackMode === "test"
                        ? "TEST SANDBOX"
                        : "CONFIG VIA .ENV"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Processes Visa, Mastercard, Verve, USSD & Apple Pay. Payments payout directly to
                  Kumchop Moniepoint (8067730012).
                </p>
                <div className="p-3 bg-secondary/50 rounded text-xs space-y-1 font-mono">
                  <div className="text-[11px] text-muted-foreground">Env Keys Required:</div>
                  <div className="text-primary">PAYSTACK_SECRET_KEY=sk_live_...</div>
                  <div className="text-primary">VITE_PAYSTACK_PUBLIC_KEY=pk_live_...</div>
                </div>
                <a
                  href="https://dashboard.paystack.com/#/settings/developer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold"
                >
                  Paystack Developer Dashboard <ExternalLink size={12} />
                </a>
              </div>

              {/* Flutterwave Gateway Card */}
              <div className="bg-card border border-border rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap size={18} className="text-amber-500" />
                    <h4 className="font-bold text-sm">Flutterwave Gateway</h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${
                      paymentConfig.flutterwaveMode === "live"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : paymentConfig.flutterwaveMode === "test"
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : "bg-secondary text-muted-foreground border-border"
                    }`}
                  >
                    {paymentConfig.flutterwaveMode === "live"
                      ? "LIVE GATEWAY"
                      : paymentConfig.flutterwaveMode === "test"
                        ? "TEST SANDBOX"
                        : "CONFIG VIA .ENV"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enables African cards, mobile money, and instant transfer checkouts. Settles
                  directly into Moniepoint MFB.
                </p>
                <div className="p-3 bg-secondary/50 rounded text-xs space-y-1 font-mono">
                  <div className="text-[11px] text-muted-foreground">Env Keys Required:</div>
                  <div className="text-amber-400">FLUTTERWAVE_SECRET_KEY=FLWSECK_LIVE-...</div>
                  <div className="text-amber-400">VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_LIVE-...</div>
                </div>
                <a
                  href="https://dashboard.flutterwave.com/settings/apis"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:underline font-semibold"
                >
                  Flutterwave API Keys Dashboard <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Bank Linking Guide */}
            <div className="p-5 bg-secondary/70 border border-border rounded-lg space-y-2">
              <h4 className="font-bold text-sm text-foreground">
                How Payments Settle into Kumchop Moniepoint Account
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When customers pay online using Paystack or Flutterwave on this website, funds are
                authorized through your merchant credentials and automatically settled directly into
                your linked Moniepoint Microfinance Bank account (Account:{" "}
                <strong>8067730012</strong>, Name: <strong>Kumchop Food Express Akungba</strong>).
                Customers who select direct bank transfer transfer directly to this account with
                their order reference.
              </p>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
