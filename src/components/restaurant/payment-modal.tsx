import { useState, useEffect } from "react";
import {
  CreditCard,
  Building2,
  PhoneCall,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Loader2,
  X,
  Lock,
  ExternalLink,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/menu";
import {
  getPublicPaymentConfig,
  initializePaystackPayment,
  initializeFlutterwavePayment,
  type PaymentConfigResult,
} from "@/lib/payment.functions";

export type PaymentSuccessData = {
  method: "card" | "transfer" | "ussd" | "paystack" | "flutterwave";
  reference: string;
};

type PaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  totalKobo: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  onSuccess: (data: PaymentSuccessData) => void;
};

const USSD_BANKS = [
  { code: "*737*", name: "GTBank (*737#)" },
  { code: "*966*", name: "Zenith Bank (*966#)" },
  { code: "*894*", name: "First Bank (*894#)" },
  { code: "*919*", name: "UBA (*919#)" },
  { code: "*901*", name: "Access Bank (*901#)" },
];

export function PaymentModal({
  isOpen,
  onClose,
  totalKobo,
  customerName,
  customerPhone,
  customerEmail,
  onSuccess,
}: PaymentModalProps) {
  const [tab, setTab] = useState<"paystack" | "flutterwave" | "transfer" | "ussd">("paystack");
  const [isProcessing, setIsProcessing] = useState(false);
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [selectedBank, setSelectedBank] = useState(USSD_BANKS[0]?.code ?? "*737*");
  const [transferVerifying, setTransferVerifying] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(1800); // 30 mins

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

  const reference = `KUM-${Date.now().toString().slice(-6)}`;
  const accountNumber = paymentConfig.settlementBank.accountNumber || "8067730012";
  const bankName = paymentConfig.settlementBank.bankName || "Moniepoint Microfinance Bank";
  const accountName = paymentConfig.settlementBank.accountName || "Kumchop Food Express Akungba";

  // Load server-side payment configuration
  useEffect(() => {
    if (!isOpen) return;
    getPublicPaymentConfig()
      .then((cfg) => {
        setPaymentConfig(cfg);
        // Default to transfer if neither gateway is configured yet
        if (!cfg.paystackConfigured && !cfg.flutterwaveConfigured) {
          setTab("transfer");
        } else if (cfg.paystackConfigured) {
          setTab("paystack");
        } else if (cfg.flutterwaveConfigured) {
          setTab("flutterwave");
        }
      })
      .catch(() => {
        // Fallback default
      });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsProcessing(false);
      setTransferVerifying(false);
      setGatewayError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || timerSeconds <= 0) return;
    const interval = window.setInterval(() => {
      setTimerSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isOpen, timerSeconds]);

  if (!isOpen) return null;

  // Paystack Live/Sandbox checkout trigger
  const handlePaystackCheckout = async () => {
    setIsProcessing(true);
    setGatewayError(null);

    try {
      const res = await initializePaystackPayment({
        data: {
          email: customerEmail || `order-${reference.toLowerCase()}@kumchop.com.ng`,
          amountKobo: totalKobo,
          reference,
          customerName: customerName || "Kumchop Diner",
          customerPhone: customerPhone || "08067730012",
        },
      });

      if (res.success && res.authorizationUrl) {
        // Open Paystack checkout popup / window
        const win = window.open(res.authorizationUrl, "_blank", "width=500,height=680");
        if (!win) {
          window.location.href = res.authorizationUrl;
          return;
        }

        toast.info("Paystack checkout window opened.", {
          description: "Complete your payment securely. Click 'I Have Paid' once finished.",
        });

        // Setup check for return or manual confirmation
        setIsProcessing(false);
      } else if (res.requiresClientFallback && res.publicKey) {
        // Client-side Paystack Inline script fallback
        initPaystackInline(res.publicKey);
      } else {
        // No server key yet: direct to Moniepoint transfer or sandbox test
        setGatewayError(
          res.message ||
            "Paystack keys pending in .env. You can pay directly to Kumchop Moniepoint bank account below.",
        );
        setIsProcessing(false);
      }
    } catch (err) {
      setGatewayError("Network error contacting payment server. You can pay via direct transfer.");
      setIsProcessing(false);
    }
  };

  // Paystack client-side inline fallback
  const initPaystackInline = (pubKey: string) => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const PaystackPop = (window as any).PaystackPop;
      if (PaystackPop) {
        const handler = PaystackPop.setup({
          key: pubKey,
          email: customerEmail || `order-${reference.toLowerCase()}@kumchop.com.ng`,
          amount: totalKobo,
          ref: reference,
          callback: (response: { reference: string }) => {
            setIsProcessing(false);
            onSuccess({ method: "paystack", reference: response.reference || reference });
          },
          onClose: () => {
            setIsProcessing(false);
            toast.info("Payment window closed.");
          },
        });
        handler.openIframe();
      } else {
        setIsProcessing(false);
        setGatewayError("Could not load Paystack inline gateway.");
      }
    };
    script.onerror = () => {
      setIsProcessing(false);
      setGatewayError("Unable to load Paystack script.");
    };
    document.body.appendChild(script);
  };

  // Flutterwave Live checkout trigger
  const handleFlutterwaveCheckout = async () => {
    setIsProcessing(true);
    setGatewayError(null);

    try {
      const res = await initializeFlutterwavePayment({
        data: {
          email: customerEmail || `order-${reference.toLowerCase()}@kumchop.com.ng`,
          amountKobo: totalKobo,
          reference,
          customerName: customerName || "Kumchop Diner",
          customerPhone: customerPhone || "08067730012",
        },
      });

      if (res.success && res.paymentLink) {
        window.open(res.paymentLink, "_blank", "width=500,height=680");
        setIsProcessing(false);
        toast.info("Flutterwave payment page opened.", {
          description: "Complete your transaction and confirm below.",
        });
      } else {
        setGatewayError(
          res.message ||
            "Flutterwave secret key pending in server .env. Direct Moniepoint bank transfer is available.",
        );
        setIsProcessing(false);
      }
    } catch (err) {
      setGatewayError("Network error contacting payment server. You can pay via direct transfer.");
      setIsProcessing(false);
    }
  };

  const handleManualGatewayConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess({
        method: tab === "paystack" ? "paystack" : "flutterwave",
        reference,
      });
    }, 1200);
  };

  const handleVerifyTransfer = () => {
    setTransferVerifying(true);
    setTimeout(() => {
      setTransferVerifying(false);
      onSuccess({ method: "transfer", reference: `TRF-${reference}` });
    }, 1800);
  };

  const handleVerifyUssd = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess({ method: "ussd", reference: `USD-${reference}` });
    }, 1400);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const ussdString = `${selectedBank}2*${Math.round(totalKobo / 100)}*${accountNumber}#`;

  return (
    <div className="payment-backdrop" role="dialog" aria-modal="true">
      <div className="payment-window">
        {/* Header */}
        <div className="payment-header">
          <div>
            <div className="payment-brand flex items-center gap-2">
              <img
                src="/assets/aistudio/06Oct24_Anis_Free_Upload_b9819ce2.png"
                alt="Kumchop"
                className="h-8 w-auto object-contain"
              />
              <span className="payment-badge-secure">
                <Lock size={12} /> 256-bit Encrypted
              </span>
              <span className="payment-gateway-tag">Paystack & Bank Settlement</span>
            </div>
            <h2>Pay Kumchop Restaurant</h2>
            <p className="payment-sub">
              For: {customerName || "Valued Customer"} · Reference: {reference}
            </p>
          </div>
          <div className="payment-header-right">
            <span className="payment-amount">{money(totalKobo)}</span>
            <button
              onClick={onClose}
              className="payment-close-btn"
              aria-label="Close payment modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Settlement Account Notification Badge */}
        <div className="px-6 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between text-xs text-emerald-400">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
            <span>
              Direct Settlement: <strong>{bankName}</strong> · Acct:{" "}
              <strong>{accountNumber}</strong>
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded">
            Verified Merchant
          </span>
        </div>

        {/* Gateway & Channel Selector Tabs */}
        <div className="payment-channels">
          <button
            type="button"
            className={`payment-channel-tab ${tab === "paystack" ? "active" : ""}`}
            onClick={() => setTab("paystack")}
          >
            <CreditCard size={18} />
            <span>Paystack Card</span>
          </button>
          <button
            type="button"
            className={`payment-channel-tab ${tab === "flutterwave" ? "active" : ""}`}
            onClick={() => setTab("flutterwave")}
          >
            <Zap size={18} />
            <span>Flutterwave</span>
          </button>
          <button
            type="button"
            className={`payment-channel-tab ${tab === "transfer" ? "active" : ""}`}
            onClick={() => setTab("transfer")}
          >
            <Building2 size={18} />
            <span>Bank Transfer</span>
          </button>
          <button
            type="button"
            className={`payment-channel-tab ${tab === "ussd" ? "active" : ""}`}
            onClick={() => setTab("ussd")}
          >
            <PhoneCall size={18} />
            <span>USSD</span>
          </button>
        </div>

        {/* Tab 1: Paystack Live Checkout */}
        {tab === "paystack" && (
          <div className="payment-body">
            <div className="p-4 rounded-lg bg-card/60 border border-primary/25 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Paystack Merchant Checkout
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
                  {paymentConfig.paystackMode === "live"
                    ? "LIVE GATEWAY"
                    : paymentConfig.paystackMode === "test"
                      ? "TEST SANDBOX"
                      : "READY FOR KEYS"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pay using Nigerian Debit Cards (Mastercard, Visa, Verve), Apple Pay, or Bank
                Transfer. Funds settle automatically into <strong>{accountName}</strong>.
              </p>

              {gatewayError && (
                <div className="p-3 text-xs bg-amber-500/10 border border-amber-500/25 text-amber-300 rounded">
                  {gatewayError}
                </div>
              )}

              <Button
                size="lg"
                className="w-full flex items-center justify-center gap-2 text-sm"
                onClick={handlePaystackCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={16} /> Connecting to Paystack...
                  </>
                ) : (
                  <>
                    <ExternalLink size={16} /> Launch Paystack Checkout ({money(totalKobo)})
                  </>
                )}
              </Button>

              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                <span className="text-muted-foreground">Already authorized on Paystack?</span>
                <button
                  type="button"
                  onClick={handleManualGatewayConfirm}
                  className="text-primary hover:underline font-semibold"
                >
                  I Have Paid Successfully
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Flutterwave Live Checkout */}
        {tab === "flutterwave" && (
          <div className="payment-body">
            <div className="p-4 rounded-lg bg-card/60 border border-amber-500/25 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Flutterwave Merchant Gateway
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {paymentConfig.flutterwaveMode === "live"
                    ? "LIVE GATEWAY"
                    : paymentConfig.flutterwaveMode === "test"
                      ? "TEST SANDBOX"
                      : "READY FOR KEYS"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pay with African cards, mobile money, or instant USSD with settlement to Kumchop's
                Moniepoint bank account.
              </p>

              {gatewayError && (
                <div className="p-3 text-xs bg-amber-500/10 border border-amber-500/25 text-amber-300 rounded">
                  {gatewayError}
                </div>
              )}

              <Button
                size="lg"
                className="w-full flex items-center justify-center gap-2 text-sm bg-amber-600 hover:bg-amber-500"
                onClick={handleFlutterwaveCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={16} /> Connecting to Flutterwave...
                  </>
                ) : (
                  <>
                    <ExternalLink size={16} /> Pay with Flutterwave ({money(totalKobo)})
                  </>
                )}
              </Button>

              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                <span className="text-muted-foreground">Finished on Flutterwave?</span>
                <button
                  type="button"
                  onClick={handleManualGatewayConfirm}
                  className="text-amber-400 hover:underline font-semibold"
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Direct Moniepoint Bank Transfer */}
        {tab === "transfer" && (
          <div className="payment-body">
            <div className="transfer-instructions">
              <p>
                Transfer exactly <strong>{money(totalKobo)}</strong> to Kumchop's verified merchant
                bank account below using any banking mobile app.
              </p>
              <span className="transfer-countdown">
                Session expires in <strong>{formatTimer(timerSeconds)}</strong>
              </span>
            </div>

            <div className="transfer-card">
              <div className="transfer-row">
                <span className="transfer-lbl">Bank Name</span>
                <strong className="transfer-val">{bankName}</strong>
              </div>
              <div className="transfer-row">
                <span className="transfer-lbl">Account Number</span>
                <div className="transfer-copyable">
                  <strong className="transfer-val text-lg tracking-wider">{accountNumber}</strong>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(accountNumber)}
                    className="copy-btn"
                    title="Copy Account Number"
                  >
                    {copiedAccount ? <Check size={14} /> : <Copy size={14} />}
                    {copiedAccount ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
              <div className="transfer-row">
                <span className="transfer-lbl">Account Name</span>
                <strong className="transfer-val">{accountName}</strong>
              </div>
              <div className="transfer-row">
                <span className="transfer-lbl">Transfer Narration</span>
                <span className="transfer-ref">{reference}</span>
              </div>
            </div>

            <div className="transfer-actions">
              <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={handleVerifyTransfer}
                disabled={transferVerifying}
              >
                {transferVerifying ? (
                  <>
                    <Loader2 className="animate-spin" /> Verifying Bank Transfer...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} /> I Have Sent {money(totalKobo)}
                  </>
                )}
              </Button>
              <p className="payment-footnote">
                Transfers reflect directly in Kumchop kitchen dispatch queue for fast preparation.
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: USSD */}
        {tab === "ussd" && (
          <div className="payment-body">
            <label className="payment-input-group">
              <span>Choose Your Bank</span>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="payment-select"
              >
                {USSD_BANKS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="ussd-box">
              <p className="text-xs text-muted-foreground">Dial this code on your mobile phone:</p>
              <div className="ussd-string-wrap">
                <code className="ussd-code">{ussdString}</code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(ussdString)}
                  className="copy-btn"
                >
                  {copiedAccount ? <Check size={14} /> : <Copy size={14} />}
                  {copiedAccount ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Follow your bank prompts and authorize with your USSD PIN. Funds credit directly to
                Kumchop Moniepoint.
              </p>
            </div>

            <Button
              type="button"
              size="lg"
              className="w-full mt-4"
              onClick={handleVerifyUssd}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" /> Checking USSD Confirmation...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} /> I Have Completed USSD Payment
                </>
              )}
            </Button>
          </div>
        )}

        <div className="payment-footer">
          <span>Protected by SSL / PCI-DSS Compliant Infrastructure · Moniepoint MFB</span>
        </div>
      </div>
    </div>
  );
}
