export type PaymentSettings = {
  // Receiver bank transfer details (where direct transfers go)
  bankName: string;
  accountNumber: string;
  accountName: string;
  whatsappConfirmationPhone: string;
  transferNote: string;

  // Paystack debit card gateway (where debit card money settles)
  paystackPublicKey: string; // e.g. "pk_live_..." or "pk_test_..."
  paystackEnabled: boolean;

  // Payment channel toggles
  cardEnabled: boolean;
  transferEnabled: boolean;
  ussdEnabled: boolean;
};

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  bankName: "Moniepoint Microfinance Bank",
  accountNumber: "8067730012",
  accountName: "Kumchop Food Express Akungba",
  whatsappConfirmationPhone: "+234 806 773 0012",
  transferNote: "Include your order reference in the transfer narration for fast automatic matching.",
  paystackPublicKey: "", // Left blank by default until owner pastes their live or test key
  paystackEnabled: false,
  cardEnabled: true,
  transferEnabled: true,
  ussdEnabled: true,
};

const PAYMENT_SETTINGS_KEY = "kumchop-payment-settings";

export function getPaymentSettings(): PaymentSettings {
  if (typeof window === "undefined") return DEFAULT_PAYMENT_SETTINGS;
  try {
    const raw = localStorage.getItem(PAYMENT_SETTINGS_KEY);
    if (!raw) return DEFAULT_PAYMENT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PAYMENT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_PAYMENT_SETTINGS;
  }
}

export function savePaymentSettings(settings: PaymentSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PAYMENT_SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event("kumchop-payment-settings-updated"));
  } catch {
    // Storage fallback
  }
}

export function isPaystackLive(settings: PaymentSettings): boolean {
  return (
    settings.paystackEnabled &&
    typeof settings.paystackPublicKey === "string" &&
    settings.paystackPublicKey.trim().startsWith("pk_live_")
  );
}

export function isPaystackTest(settings: PaymentSettings): boolean {
  return (
    settings.paystackEnabled &&
    typeof settings.paystackPublicKey === "string" &&
    settings.paystackPublicKey.trim().startsWith("pk_test_")
  );
}

export function hasActivePaystack(settings: PaymentSettings): boolean {
  return (
    settings.paystackEnabled &&
    typeof settings.paystackPublicKey === "string" &&
    settings.paystackPublicKey.trim().length > 10
  );
}
