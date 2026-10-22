export type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";
export type PaymentMethod = "whatsapp" | "card" | "transfer" | "ussd";
export type PaymentStatus = "pending" | "paid";

export type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  priceKobo: number;
};

export type RestaurantOrder = {
  id: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderType: "pickup" | "delivery";
  deliveryAreaId?: string;
  deliveryAreaName?: string;
  deliveryAddress?: string;
  preferredTime?: string;
  notes?: string;
  items: OrderItem[];
  subtotalKobo: number;
  deliveryFeeKobo: number;
  totalKobo: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  orderStatus: OrderStatus;
};

const ORDERS_KEY = "kumchop-restaurant-orders";
const INVENTORY_KEY = "kumchop-inventory-overrides";

export const INITIAL_ORDERS: RestaurantOrder[] = [
  {
    id: "KUM-1042",
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    customerName: "Damilola Adebayo",
    customerPhone: "0803 456 7891",
    customerEmail: "damilola.a@aaua.edu.ng",
    orderType: "delivery",
    deliveryAreaId: "aaua-campus",
    deliveryAreaName: "AAUA Main Campus (Hostels & Faculties)",
    deliveryAddress: "ETF Hostel Block B, Room 14, AAUA Main Campus",
    preferredTime: "Immediate lunch",
    notes: "Please add extra fried plantain if possible.",
    items: [
      { id: "kumchop-jollof-rice", name: "Kumchop Jollof Rice", quantity: 2, priceKobo: 50000 },
      { id: "cripsy-fried-chicken", name: "Crispy Chicken", quantity: 1, priceKobo: 400000 },
      { id: "coke", name: "Coke", quantity: 2, priceKobo: 80000 },
    ],
    subtotalKobo: 660000,
    deliveryFeeKobo: 40000,
    totalKobo: 700000,
    paymentMethod: "card",
    paymentStatus: "paid",
    paymentReference: "PSK_991823719",
    orderStatus: "preparing",
  },
  {
    id: "KUM-1041",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    customerName: "Blessing Oladipo",
    customerPhone: "0814 222 3456",
    orderType: "delivery",
    deliveryAreaId: "small-gate-medview",
    deliveryAreaName: "Small Gate & Medview (Permanent Site)",
    deliveryAddress: "Peace Villa Lodge, 2nd floor, Small Gate",
    items: [
      {
        id: "pounded-yam-combo-2beefs-and-soup",
        name: "Pounded Yam Combo (2Beefs and Soup)",
        quantity: 1,
        priceKobo: 290000,
      },
      { id: "malt", name: "Malt", quantity: 1, priceKobo: 70000 },
    ],
    subtotalKobo: 360000,
    deliveryFeeKobo: 50000,
    totalKobo: 410000,
    paymentMethod: "transfer",
    paymentStatus: "paid",
    paymentReference: "MNP_88192003",
    orderStatus: "ready",
  },
  {
    id: "KUM-1039",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    customerName: "Femi Alabi",
    customerPhone: "0906 111 8899",
    orderType: "pickup",
    preferredTime: "Pick up at counter",
    items: [
      { id: "sharwama", name: "Sharwama", quantity: 2, priceKobo: 300000 },
      { id: "hollandia-youghurt", name: "Hollandia Youghurt", quantity: 1, priceKobo: 250000 },
    ],
    subtotalKobo: 850000,
    deliveryFeeKobo: 0,
    totalKobo: 850000,
    paymentMethod: "whatsapp",
    paymentStatus: "pending",
    orderStatus: "completed",
  },
];

export function getStoredOrders(): RestaurantOrder[] {
  if (typeof window === "undefined") return INITIAL_ORDERS;
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    const parsed = JSON.parse(raw) as RestaurantOrder[];
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Local storage read fallback
  }
  return INITIAL_ORDERS;
}

export function saveOrder(order: RestaurantOrder): void {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredOrders();
    const updated = [order, ...current];
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("kumchop-orders-updated"));
  } catch {
    // Local storage write fallback
  }
}

export function updateOrderStatus(orderId: string, status: OrderStatus): void {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredOrders();
    const updated = current.map((o) => (o.id === orderId ? { ...o, orderStatus: status } : o));
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("kumchop-orders-updated"));
  } catch {
    // Storage fallback
  }
}

export function deleteOrder(orderId: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredOrders();
    const updated = current.filter((o) => o.id !== orderId);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("kumchop-orders-updated"));
  } catch {
    // Storage fallback
  }
}

// Live dish sold-out inventory overrides
export function getInventoryOverrides(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(INVENTORY_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function setDishSoldOut(dishId: string, soldOut: boolean): void {
  if (typeof window === "undefined") return;
  try {
    const current = getInventoryOverrides();
    current[dishId] = soldOut;
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event("kumchop-inventory-updated"));
  } catch {
    // Storage fallback
  }
}

export function isDishSoldOutLive(dishId: string, defaultSoldOut: boolean): boolean {
  if (typeof window === "undefined") return defaultSoldOut;
  const overrides = getInventoryOverrides();
  if (dishId in overrides) {
    return overrides[dishId] ?? defaultSoldOut;
  }
  return defaultSoldOut;
}
