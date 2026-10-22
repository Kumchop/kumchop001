export type DeliveryArea = {
  id: string;
  name: string;
  description: string;
  feeKobo: number;
};

export const DEFAULT_DELIVERY_AREAS: DeliveryArea[] = [
  {
    id: "aaua-campus",
    name: "AAUA Main Campus (Hostels & Faculties)",
    description: "Adekunle Ajasin University campus halls and faculty gates",
    feeKobo: 40000, // ₦400
  },
  {
    id: "small-gate-medview",
    name: "Small Gate & Medview (Permanent Site)",
    description: "Student lodges around Small Gate, Medview and Bovas environs",
    feeKobo: 50000, // ₦500
  },
  {
    id: "chapel-guesthouse",
    name: "Chapel & University Guest House",
    description: "Chapel junction, senior staff quarters & guest houses",
    feeKobo: 50000, // ₦500
  },
  {
    id: "akungba-central",
    name: "Akungba Central & Market",
    description: "Major road, Akungba palace junction and market street",
    feeKobo: 60000, // ₦600
  },
  {
    id: "ibaka-oke-oyo",
    name: "Ibaka & Oke-Oyo",
    description: "Residential outskirts and Ibaka quarters",
    feeKobo: 80000, // ₦800
  },
  {
    id: "ikare-road",
    name: "Ikare Road & Border Environs",
    description: "Outer Akungba boundary towards Ikare road",
    feeKobo: 100000, // ₦1,000
  },
];

const STORAGE_KEY = "kumchop-delivery-areas";

export function getDeliveryAreas(): DeliveryArea[] {
  if (typeof window === "undefined") return DEFAULT_DELIVERY_AREAS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DELIVERY_AREAS;
    const parsed = JSON.parse(raw) as DeliveryArea[];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // Storage fallback
  }
  return DEFAULT_DELIVERY_AREAS;
}

export function saveDeliveryAreas(areas: DeliveryArea[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(areas));
    window.dispatchEvent(new Event("kumchop-areas-updated"));
  } catch {
    // Storage quota fallback
  }
}

export function getDeliveryFeeForArea(areaId?: string | null): number {
  if (!areaId) return DEFAULT_DELIVERY_AREAS[0]?.feeKobo ?? 50000;
  const areas = getDeliveryAreas();
  const match = areas.find((a) => a.id === areaId);
  return match ? match.feeKobo : (DEFAULT_DELIVERY_AREAS[0]?.feeKobo ?? 50000);
}
