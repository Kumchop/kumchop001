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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/menu";

export type PaymentSuccessData = {
  method: "card" | "transfer" | "ussd";
  reference: string;
};

type PaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  totalKobo: number;
  customerName: string;
  customerPhone: string;
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
  customerPhone: _customerPhone,
  onSuccess,
}: PaymentModalProps) {
  const [tab, setTab] = useState<"card" | "transfer" | "ussd">("card");
  const [cardNo, setCardNo] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [selectedBank, setSelectedBank] = useState(USSD_BANKS[0]?.code ?? "*737*");
  const [transferVerifying, setTransferVerifying] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(1800); // 30 mins

  const reference = `KUM-${Date.now().toString().slice(-6)}`;
  const accountNumber = "8067730012";

  useEffect(() => {
    if (!isOpen) {
      setOtpStep(false);
      setIsProcessing(false);
      setTransferVerifying(false);
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

  const formatCard = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 16);
    return cleaned.replace(/(.{4})/g, "$1 ").trim();
  };

  const handleFillDemoCard = () => {
    setCardNo("5399 4100 8829 4402");
    setExpiry("08/28");
    setCvv("381");
  };

  const handlePayCard = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setOtpStep(true);
    }, 1200);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess({ method: "card", reference });
    }, 1400);
  };

  const handleVerifyTransfer = () => {
    setTransferVerifying(true);
    setTimeout(() => {
      setTransferVerifying(false);
      onSuccess({ method: "transfer", reference: `TRF-${reference}` });
    }, 2000);
  };

  const handleVerifyUssd = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess({ method: "ussd", reference: `USD-${reference}` });
    }, 1600);
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
            <div className="payment-brand">
              <span className="payment-badge-secure">
                <Lock size={12} /> 256-bit Encrypted
              </span>
              <span className="payment-gateway-tag">Paystack & Transfer Gateway</span>
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

        {/* Channels */}
        {!otpStep && (
          <div className="payment-channels">
            <button
              type="button"
              className={`payment-channel-tab ${tab === "card" ? "active" : ""}`}
              onClick={() => setTab("card")}
            >
              <CreditCard size={18} />
              <span>Card</span>
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
        )}

        {/* Tab 1: Card */}
        {tab === "card" && !otpStep && (
          <form onSubmit={handlePayCard} className="payment-body">
            <div className="payment-demo-strip">
              <span>Testing checkout?</span>
              <button type="button" onClick={handleFillDemoCard} className="payment-demo-btn">
                Click to Auto-fill Demo Card
              </button>
            </div>

            <label className="payment-input-group">
              <span>Card Number</span>
              <div className="payment-card-input-wrap">
                <input
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  value={cardNo}
                  onChange={(e) => setCardNo(formatCard(e.target.value))}
                  required
                />
                <div className="card-brand-pills">
                  <span>Mastercard</span>
                  <span>Visa</span>
                  <span>Verve</span>
                </div>
              </div>
            </label>

            <div className="payment-card-row">
              <label className="payment-input-group">
                <span>Valid Till (MM/YY)</span>
                <input
                  type="text"
                  placeholder="MM/YY"
                  maxLength={5}
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  required
                />
              </label>

              <label className="payment-input-group">
                <span>CVV</span>
                <input
                  type="password"
                  placeholder="123"
                  maxLength={4}
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  required
                />
              </label>
            </div>

            <Button type="submit" size="lg" className="w-full mt-4" disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" /> Authorizing Card...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} /> Pay {money(totalKobo)} Securely
                </>
              )}
            </Button>
          </form>
        )}

        {/* Card OTP Step */}
        {tab === "card" && otpStep && (
          <form onSubmit={handleVerifyOtp} className="payment-body payment-otp-step">
            <div className="payment-otp-box">
              <ShieldCheck size={36} className="payment-otp-icon" />
              <h3>Enter 3D-Secure Bank OTP</h3>
              <p>
                A test verification code has been simulated for your bank card. Use test OTP{" "}
                <strong>123456</strong> to approve.
              </p>
              <input
                type="text"
                placeholder="Enter 6-digit code (e.g. 123456)"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                required
                className="payment-otp-input"
              />
              <div className="flex gap-3 w-full mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOtpStep(false)}
                  disabled={isProcessing}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={isProcessing || !otpCode}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin" /> Confirming...
                    </>
                  ) : (
                    "Authorize & Complete Order"
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Bank Transfer */}
        {tab === "transfer" && (
          <div className="payment-body">
            <div className="transfer-instructions">
              <p>
                Transfer exactly <strong>{money(totalKobo)}</strong> to the Kumchop restaurant
                account below using your bank mobile app.
              </p>
              <span className="transfer-countdown">
                Expires in <strong>{formatTimer(timerSeconds)}</strong>
              </span>
            </div>

            <div className="transfer-card">
              <div className="transfer-row">
                <span className="transfer-lbl">Bank Name</span>
                <strong className="transfer-val">Moniepoint Microfinance Bank</strong>
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
                <span className="transfer-lbl">Beneficiary</span>
                <strong className="transfer-val">Kumchop Food Express Akungba</strong>
              </div>
              <div className="transfer-row">
                <span className="transfer-lbl">Payment Ref</span>
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
                Payments are automatically credited to your order queue immediately upon transfer.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: USSD */}
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
                Follow your bank prompts and authorize with your USSD PIN.
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
          <span>Protected by SSL / PCI-DSS Compliant Infrastructure</span>
        </div>
      </div>
    </div>
  );
}
