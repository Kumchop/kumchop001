import type { MenuItem } from "./menu";
import { menuItems } from "./menu";

export const CUSTOM_DISHES_KEY = "kumchop-custom-dishes";
export const REMOVED_IMAGES_KEY = "kumchop-removed-dish-images";
export const CUSTOM_IMAGES_KEY = "kumchop-custom-dish-images";

export const TAKEAWAY_PACK_FEE_KOBO = 20000; // ₦200 packaging container fee

/**
 * Returns true if a dish requires compulsory takeaway packaging.
 * Cooked meals (rice, swallow, soups, African dishes, beans, porridge, pasta, combos)
 * require packaging. Snacks, pastries, drinks, and ice cream do NOT.
 */
export function itemRequiresTakeaway(item: {
  id?: string;
  name?: string;
  category?: string;
  categories?: string[];
  requiresTakeaway?: boolean;
}): boolean {
  if (item.requiresTakeaway !== undefined) {
    return item.requiresTakeaway;
  }
  const n = (item.name ?? "").toLowerCase();
  const cat = (item.category ?? "").toLowerCase();
  const cats = (item.categories ?? [cat]).map((c) => c.toLowerCase());

  // Snacks and drinks do not need compulsory food packaging
  const isOnlySnackOrDrink = cats.every(
    (c) => c === "snacks" || c === "drinks" || c === "ice-cream",
  );
  if (isOnlySnackOrDrink) {
    // If it mentions rice, swallow, beans, soup or pasta, it's a meal
    const hasMealWord = /rice|swallow|soup|beans|porridge|amala|egusi|spag|pasta|yam/.test(n);
    if (!hasMealWord) return false;
  }

  // Baked pastries, snacks, drinks
  if (
    /pie|roll|doughnut|cupcake|bread|shawarma|sharwama|biscuit|cookie|coke|fanta|sprite|pepsi|water|drink|juice|shake|parfait|ice cream/.test(
      n,
    ) &&
    !/rice|swallow|soup|beans|porridge|amala|egusi|spag|pasta|yam|jollof|stew/.test(n)
  ) {
    return false;
  }

  // All cooked meals require food packaging
  return true;
}

/**
 * Check if the current cart contains any dishes that make takeaway packaging compulsory.
 */
export function cartHasCompulsoryTakeaway(lines: { id: string }[], allItems: MenuItem[]): boolean {
  return lines.some((line) => {
    const item = allItems.find((i) => i.id === line.id);
    return item ? itemRequiresTakeaway(item) : false;
  });
}

/**
 * Image removal tracking: Admin can remove images from the menu.
 */
export function getRemovedImageMap(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(REMOVED_IMAGES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function isDishImageRemoved(dishId: string): boolean {
  const map = getRemovedImageMap();
  return Boolean(map[dishId]);
}

export function setDishImageRemoved(dishId: string, removed: boolean): void {
  if (typeof window === "undefined") return;
  try {
    const map = getRemovedImageMap();
    if (removed) {
      map[dishId] = true;
    } else {
      delete map[dishId];
    }
    localStorage.setItem(REMOVED_IMAGES_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event("kumchop-menu-updated"));
  } catch {
    // storage fallback
  }
}

/**
 * Custom uploaded images per dish
 */
export function getCustomImageMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CUSTOM_IMAGES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export function setDishCustomImage(dishId: string, imageUri: string): void {
  if (typeof window === "undefined") return;
  try {
    const map = getCustomImageMap();
    map[dishId] = imageUri;
    localStorage.setItem(CUSTOM_IMAGES_KEY, JSON.stringify(map));
    // Also ensure removed status is cleared if user uploads a new image
    setDishImageRemoved(dishId, false);
    window.dispatchEvent(new Event("kumchop-menu-updated"));
  } catch {
    // storage fallback
  }
}

/**
 * Custom dishes created by Admin
 */
export function getStoredCustomDishes(): MenuItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_DISHES_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as MenuItem[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveCustomDish(data: {
  name: string;
  category: string;
  priceKobo: number;
  image: string;
  requiresTakeaway?: boolean;
}): MenuItem {
  const id = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const categoriesList = [data.category];
  if (data.category === "swallow" || data.category === "rice" || data.category === "soup") {
    categoriesList.unshift("african-dish");
  }

  const newDish: MenuItem = {
    id,
    name: data.name.trim(),
    category: data.category,
    categories: Array.from(new Set(categoriesList)),
    priceKobo: data.priceKobo,
    soldOut: false,
    image: data.image,
    requiresTakeaway: data.requiresTakeaway ?? itemRequiresTakeaway(data),
  };

  if (typeof window !== "undefined") {
    try {
      const current = getStoredCustomDishes();
      const updated = [newDish, ...current];
      localStorage.setItem(CUSTOM_DISHES_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("kumchop-menu-updated"));
    } catch {
      // storage fallback
    }
  }

  return newDish;
}

export function deleteCustomDish(dishId: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredCustomDishes();
    const updated = current.filter((d) => d.id !== dishId);
    localStorage.setItem(CUSTOM_DISHES_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("kumchop-menu-updated"));
  } catch {
    // storage fallback
  }
}

/**
 * Returns all active menu items combining base records + custom dishes,
 * with any removed images and custom image overrides applied.
 */
export function getFullActiveMenu(): MenuItem[] {
  const customDishes = getStoredCustomDishes();
  const removedMap = getRemovedImageMap();
  const customImages = getCustomImageMap();

  const combined = [...customDishes, ...menuItems];

  return combined.map((dish) => {
    const isRemoved = Boolean(removedMap[dish.id]);
    const customImg = customImages[dish.id];
    return {
      ...dish,
      image: isRemoved ? "" : (customImg ?? dish.image),
      imageRemoved: isRemoved,
      requiresTakeaway: itemRequiresTakeaway(dish),
    };
  });
}
