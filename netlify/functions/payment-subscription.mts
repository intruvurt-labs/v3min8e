import type { Context, Config } from "@netlify/functions";

interface PaymentSubscription {
  wallet: string;
  txHash: string;
  amount: number; // SOL amount
  duration: number; // days
  expiresAt: string;
  createdAt: string;
  status: "pending" | "confirmed" | "expired";
}

// In-memory storage - in production use database
const subscriptions = new Map<string, PaymentSubscription>();
const pendingPayments = new Map<string, any>();

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { action, wallet, txHash, amount } = await req.json();

    switch (action) {
      case "createPayment":
        return await createPayment(wallet, amount);

      case "confirmPayment":
        return await confirmPayment(wallet, txHash);

      case "checkSubscription":
        return await checkSubscription(wallet);

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("Payment API error:", error);
    return new Response(
      JSON.stringify({
        error: "Payment processing failed",
        success: false,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

async function createPayment(wallet: string, amount: number) {
  // Validate amount (0.1 SOL for monthly access)
  if (amount !== 0.1) {
    return new Response(
      JSON.stringify({
        error: "Invalid payment amount. Monthly access costs 0.1 SOL",
        success: false,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Generate payment instruction
  const paymentAddress = "4XygsJdgpKRqvAuyyyXczDQRDxuSeumns7RA3Ak1RZpf"; // Platform wallet
  const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Store pending payment
  pendingPayments.set(paymentId, {
    wallet,
    amount,
    paymentAddress,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min expiry
  });

  return new Response(
    JSON.stringify({
      success: true,
      paymentId,
      paymentAddress,
      amount,
      message: `Monthly Scanner Access - ${wallet.slice(0, 8)}...`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

async function confirmPayment(wallet: string, txHash: string) {
  try {
    // Verify transaction on Solana
    const isValid = await verifyTransaction(txHash, wallet);

    if (!isValid) {
      return new Response(
        JSON.stringify({
          error: "Transaction verification failed",
          success: false,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Create/update subscription
    const subscription: PaymentSubscription = {
      wallet,
      txHash,
      amount: 0.1,
      duration: 30, // 30 days
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      status: "confirmed",
    };

    subscriptions.set(wallet, subscription);

    return new Response(
      JSON.stringify({
        success: true,
        subscription,
        message: "Payment confirmed. 30-day scanner access activated!",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Payment confirmation error:", error);
    return new Response(
      JSON.stringify({
        error: "Payment confirmation failed",
        success: false,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

async function checkSubscription(wallet: string) {
  const subscription = subscriptions.get(wallet);

  if (!subscription) {
    return new Response(
      JSON.stringify({
        success: true,
        hasSubscription: false,
        message: "No active subscription found",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Check if subscription is expired
  const isExpired = new Date(subscription.expiresAt) < new Date();

  if (isExpired) {
    subscription.status = "expired";
    subscriptions.set(wallet, subscription);
  }

  return new Response(
    JSON.stringify({
      success: true,
      hasSubscription: !isExpired,
      subscription,
      daysRemaining: isExpired
        ? 0
        : Math.ceil(
            (new Date(subscription.expiresAt).getTime() - Date.now()) /
              (24 * 60 * 60 * 1000),
          ),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

async function verifyTransaction(
  txHash: string,
  wallet: string,
): Promise<boolean> {
  try {
    // Verify transaction on Solana blockchain
    const response = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTransaction",
        params: [
          txHash,
          { encoding: "json", maxSupportedTransactionVersion: 0 },
        ],
      }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    if (!data.result) {
      return false;
    }

    const transaction = data.result;

    // Verify transaction details
    const meta = transaction.meta;
    if (!meta || meta.err) {
      return false;
    }

    // Check if transaction involves the correct wallet and amount
    const preBalances = meta.preBalances;
    const postBalances = meta.postBalances;
    const accounts = transaction.transaction.message.accountKeys;

    // Find wallet in accounts and verify SOL transfer
    const walletIndex = accounts.findIndex((acc: string) => acc === wallet);
    if (walletIndex === -1) {
      return false;
    }

    // Check if 0.1 SOL (100,000,000 lamports) was transferred
    const lamportsDiff = preBalances[walletIndex] - postBalances[walletIndex];
    const expectedLamports = 0.1 * 1000000000; // 0.1 SOL in lamports

    // Allow some tolerance for transaction fees
    return Math.abs(lamportsDiff - expectedLamports) < 10000000; // 0.01 SOL tolerance
  } catch (error) {
    console.error("Transaction verification error:", error);
    return false;
  }
}

export const config: Config = {
  path: "/api/payment/subscription",
};
