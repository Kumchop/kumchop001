import { createServerFn } from "@tanstack/react-start";

export interface PaymentConfigResult {
  paystackConfigured: boolean;
  paystackPublicKey: string;
  paystackMode: "live" | "test" | "none";
  flutterwaveConfigured: boolean;
  flutterwavePublicKey: string;
  flutterwaveMode: "live" | "test" | "none";
  settlementBank: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    whatsappNumber: string;
  };
}

/**
 * Returns public payment configuration without leaking server secret keys.
 */
export const getPublicPaymentConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<PaymentConfigResult> => {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY || "";
    const paystackPublic =
      process.env.VITE_PAYSTACK_PUBLIC_KEY || process.env.PAYSTACK_PUBLIC_KEY || "";

    const flutterwaveSecret = process.env.FLUTTERWAVE_SECRET_KEY || "";
    const flutterwavePublic =
      process.env.VITE_FLUTTERWAVE_PUBLIC_KEY || process.env.FLUTTERWAVE_PUBLIC_KEY || "";

    const isPaystackLive =
      paystackSecret.startsWith("sk_live_") || paystackPublic.startsWith("pk_live_");
    const isPaystackTest =
      paystackSecret.startsWith("sk_test_") || paystackPublic.startsWith("pk_test_");

    const isFlwLive =
      flutterwaveSecret.startsWith("FLWSECK_LIVE") || flutterwavePublic.startsWith("FLWPUBK_LIVE");
    const isFlwTest =
      flutterwaveSecret.startsWith("FLWSECK_TEST") || flutterwavePublic.startsWith("FLWPUBK_TEST");

    return {
      paystackConfigured: Boolean(paystackSecret || paystackPublic),
      paystackPublicKey: paystackPublic,
      paystackMode: isPaystackLive ? "live" : isPaystackTest ? "test" : "none",
      flutterwaveConfigured: Boolean(flutterwaveSecret || flutterwavePublic),
      flutterwavePublicKey: flutterwavePublic,
      flutterwaveMode: isFlwLive ? "live" : isFlwTest ? "test" : "none",
      settlementBank: {
        bankName: "Moniepoint Microfinance Bank",
        accountNumber: "8067730012",
        accountName: "Kumchop Food Express Akungba",
        whatsappNumber: "+234 806 773 0012",
      },
    };
  },
);

/**
 * Initializes a real Paystack transaction linked to Kumchop's merchant account.
 */
export const initializePaystackPayment = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      email: string;
      amountKobo: number;
      reference: string;
      customerName: string;
      customerPhone: string;
      callbackUrl?: string;
    }) => {
      if (!d.reference || d.amountKobo <= 0) {
        throw new Error("Invalid payment parameters.");
      }
      return d;
    },
  )
  .handler(async ({ data }) => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const publicKey = process.env.VITE_PAYSTACK_PUBLIC_KEY || process.env.PAYSTACK_PUBLIC_KEY || "";

    if (!secretKey) {
      return {
        success: false,
        requiresClientFallback: Boolean(publicKey),
        publicKey,
        message:
          "PAYSTACK_SECRET_KEY is not set in server environment. Client fallback or Moniepoint transfer available.",
      };
    }

    try {
      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email || `${data.reference.toLowerCase()}@kumchop.com.ng`,
          amount: data.amountKobo,
          reference: data.reference,
          callback_url: data.callbackUrl || undefined,
          metadata: {
            customer_name: data.customerName,
            customer_phone: data.customerPhone,
            merchant: "Kumchop Food Express Akungba",
            settlement_account: "Moniepoint MFB - 8067730012",
          },
          channels: ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer"],
        }),
      });

      const resData = (await response.json()) as {
        status: boolean;
        message: string;
        data?: {
          authorization_url: string;
          access_code: string;
          reference: string;
        };
      };

      if (!resData.status || !resData.data) {
        return {
          success: false,
          requiresClientFallback: Boolean(publicKey),
          publicKey,
          message: resData.message || "Failed to initialize Paystack transaction.",
        };
      }

      return {
        success: true,
        authorizationUrl: resData.data.authorization_url,
        accessCode: resData.data.access_code,
        reference: resData.data.reference,
      };
    } catch (err) {
      console.error("Paystack Init Error:", err);
      return {
        success: false,
        requiresClientFallback: Boolean(publicKey),
        publicKey,
        message: err instanceof Error ? err.message : "Network error contacting Paystack API.",
      };
    }
  });

/**
 * Verifies Paystack transaction status on the server.
 */
export const verifyPaystackPayment = createServerFn({ method: "POST" })
  .inputValidator((d: { reference: string }) => {
    if (!d.reference) throw new Error("Reference is required.");
    return d;
  })
  .handler(async ({ data }) => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return {
        verified: false,
        message: "PAYSTACK_SECRET_KEY not configured on server.",
      };
    }

    try {
      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(data.reference)}`,
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
          },
        },
      );

      const resData = (await response.json()) as {
        status: boolean;
        message: string;
        data?: {
          status: string;
          amount: number;
          reference: string;
          channel: string;
          paid_at: string;
          customer?: { email: string };
        };
      };

      if (resData.status && resData.data?.status === "success") {
        return {
          verified: true,
          status: resData.data.status,
          amountKobo: resData.data.amount,
          reference: resData.data.reference,
          channel: resData.data.channel,
          paidAt: resData.data.paid_at,
        };
      }

      return {
        verified: false,
        status: resData.data?.status || "failed",
        message: resData.message || "Transaction not verified.",
      };
    } catch (err) {
      console.error("Paystack Verify Error:", err);
      return {
        verified: false,
        message: err instanceof Error ? err.message : "Error verifying Paystack transaction.",
      };
    }
  });

/**
 * Initializes a real Flutterwave transaction linked to Kumchop's merchant account.
 */
export const initializeFlutterwavePayment = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      email: string;
      amountKobo: number;
      reference: string;
      customerName: string;
      customerPhone: string;
      redirectUrl?: string;
    }) => {
      if (!d.reference || d.amountKobo <= 0) {
        throw new Error("Invalid payment parameters.");
      }
      return d;
    },
  )
  .handler(async ({ data }) => {
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    const publicKey =
      process.env.VITE_FLUTTERWAVE_PUBLIC_KEY || process.env.FLUTTERWAVE_PUBLIC_KEY || "";

    if (!secretKey) {
      return {
        success: false,
        requiresClientFallback: Boolean(publicKey),
        publicKey,
        message: "FLUTTERWAVE_SECRET_KEY is not configured in server environment.",
      };
    }

    try {
      const amountNaira = Math.round(data.amountKobo / 100);
      const response = await fetch("https://api.flutterwave.com/v3/payments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tx_ref: data.reference,
          amount: amountNaira,
          currency: "NGN",
          redirect_url: data.redirectUrl || undefined,
          customer: {
            email: data.email || `${data.reference.toLowerCase()}@kumchop.com.ng`,
            phonenumber: data.customerPhone,
            name: data.customerName,
          },
          customizations: {
            title: "Kumchop Food Express",
            description: "Direct Settlement to Kumchop Moniepoint Account",
            logo: "https://kumchop.com.ng/assets/logo.png",
          },
          meta: {
            settlement_account: "Moniepoint MFB - 8067730012",
            restaurant: "Kumchop Food Express Akungba",
          },
        }),
      });

      const resData = (await response.json()) as {
        status: string;
        message: string;
        data?: {
          link: string;
        };
      };

      if (resData.status !== "success" || !resData.data?.link) {
        return {
          success: false,
          requiresClientFallback: Boolean(publicKey),
          publicKey,
          message: resData.message || "Failed to initialize Flutterwave payment link.",
        };
      }

      return {
        success: true,
        paymentLink: resData.data.link,
        reference: data.reference,
      };
    } catch (err) {
      console.error("Flutterwave Init Error:", err);
      return {
        success: false,
        requiresClientFallback: Boolean(publicKey),
        publicKey,
        message: err instanceof Error ? err.message : "Network error contacting Flutterwave API.",
      };
    }
  });

/**
 * Verifies Flutterwave transaction on server.
 */
export const verifyFlutterwavePayment = createServerFn({ method: "POST" })
  .inputValidator((d: { transactionId: string }) => {
    if (!d.transactionId) throw new Error("Transaction ID is required.");
    return d;
  })
  .handler(async ({ data }) => {
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secretKey) {
      return {
        verified: false,
        message: "FLUTTERWAVE_SECRET_KEY not configured on server.",
      };
    }

    try {
      const response = await fetch(
        `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(data.transactionId)}/verify`,
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
          },
        },
      );

      const resData = (await response.json()) as {
        status: string;
        message: string;
        data?: {
          status: string;
          amount: number;
          tx_ref: string;
          payment_type: string;
          created_at: string;
        };
      };

      if (resData.status === "success" && resData.data?.status === "successful") {
        return {
          verified: true,
          status: resData.data.status,
          amountNaira: resData.data.amount,
          reference: resData.data.tx_ref,
          paymentType: resData.data.payment_type,
        };
      }

      return {
        verified: false,
        status: resData.data?.status || "failed",
        message: resData.message || "Flutterwave transaction could not be verified.",
      };
    } catch (err) {
      console.error("Flutterwave Verify Error:", err);
      return {
        verified: false,
        message: err instanceof Error ? err.message : "Error verifying Flutterwave transaction.",
      };
    }
  });
