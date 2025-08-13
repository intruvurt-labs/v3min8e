import type { Context, Config } from "@netlify/functions";

interface VermBalance {
  balance: number;
  usdValue: number;
  qualified: boolean;
  network: string;
}

// Contract addresses for wrapped VERM tokens (1:1 with Solana supply)
const VERM_CONTRACTS = {
  solana: "EdabwrorVWrqix5zhY9FpEBuBR1bqLRtcMvnGrnJ8ePp", // Main VERM contract
  base: "0x1234567890123456789012345678901234567890", // Wrapped VERM on Base
  bnb: "0x2345678901234567890123456789012345678901", // Wrapped VERM on BSC
  xrp: "rVermToken1234567890123456789012345678", // Wrapped VERM on XRP
  blast: "0x3456789012345678901234567890123456789012", // Wrapped VERM on Blast
};

const VERM_PRICE_USD = 0.0245; // Mock price - would be fetched from price API

// Creator wallet gets free access to all features
const CREATOR_WALLET = "4XygsJdgpKRqvAuyyyXczDQRDxuSeumns7RA3Ak1RZpf";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { wallet, networks } = await req.json();

    if (!wallet || !networks) {
      return new Response(
        JSON.stringify({ error: "Missing wallet or networks parameter" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Creator wallet gets automatic free access
    if (wallet === CREATOR_WALLET) {
      return new Response(
        JSON.stringify({
          success: true,
          balances: [
            {
              balance: 999999,
              usdValue: 24499.75, // > $25 minimum
              qualified: true,
              network: "creator",
            },
          ],
          totalUsdValue: 24499.75,
          qualified: true,
          priceUsd: VERM_PRICE_USD,
          isCreator: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const balances: VermBalance[] = [];

    // Check balance on each requested network
    for (const network of networks) {
      try {
        let balance = 0;

        switch (network) {
          case "solana":
            balance = await getSolanaVermBalance(wallet);
            break;
          case "base":
            balance = await getEVMVermBalance(wallet, "base");
            break;
          case "bnb":
            balance = await getEVMVermBalance(wallet, "bnb");
            break;
          case "xrp":
            balance = await getXRPVermBalance(wallet);
            break;
          case "blast":
            balance = await getEVMVermBalance(wallet, "blast");
            break;
          default:
            continue;
        }

        const usdValue = balance * VERM_PRICE_USD;

        balances.push({
          balance,
          usdValue,
          qualified: balance >= 11010, // 11010 VERM minimum
          network,
        });
      } catch (error) {
        console.error(`Error checking ${network} balance:`, error);
        // Continue with other networks even if one fails
      }
    }

    const totalUsdValue = balances.reduce((sum, b) => sum + b.usdValue, 0);
    const totalVermBalance = balances.reduce((sum, b) => sum + b.balance, 0);
    const qualified = totalVermBalance >= 11010; // 11010 VERM minimum

    return new Response(
      JSON.stringify({
        success: true,
        balances,
        totalUsdValue,
        totalVermBalance,
        qualified,
        priceUsd: VERM_PRICE_USD,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error checking VERM balance:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to check VERM balance",
        success: false,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

async function getSolanaVermBalance(wallet: string): Promise<number> {
  try {
    // Use public Solana RPC for now
    const rpcUrl = "https://api.mainnet-beta.solana.com";

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountsByOwner",
        params: [
          wallet,
          { mint: VERM_CONTRACTS.solana },
          { encoding: "jsonParsed" },
        ],
      }),
    });

    const data = await response.json();

    if (data.result?.value?.[0]) {
      const tokenAccount = data.result.value[0];
      const balance = parseFloat(
        tokenAccount.account.data.parsed.info.tokenAmount.uiAmount || "0",
      );
      return balance;
    }

    return 0;
  } catch (error) {
    console.error("Error fetching Solana VERM balance:", error);
    return 0;
  }
}

async function getEVMVermBalance(
  wallet: string,
  network: string,
): Promise<number> {
  try {
    let rpcUrl = "";

    switch (network) {
      case "base":
        rpcUrl = "https://mainnet.base.org";
        break;
      case "bnb":
        rpcUrl = "https://bsc-dataseed.binance.org";
        break;
      case "blast":
        rpcUrl = "https://rpc.blast.io";
        break;
      default:
        return 0;
    }

    const contractAddress =
      VERM_CONTRACTS[network as keyof typeof VERM_CONTRACTS];

    // ERC-20 balanceOf function call
    const data = `0x70a08231${wallet.slice(2).padStart(64, "0")}`;

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_call",
        params: [
          {
            to: contractAddress,
            data: data,
          },
          "latest",
        ],
        id: 1,
      }),
    });

    const result = await response.json();

    if (result.result && result.result !== "0x") {
      const balance = parseInt(result.result, 16) / 1e18; // Assuming 18 decimals
      return balance;
    }

    return 0;
  } catch (error) {
    console.error(`Error fetching ${network} VERM balance:`, error);
    return 0;
  }
}

async function getXRPVermBalance(wallet: string): Promise<number> {
  try {
    // XRP Ledger API call for token balance
    const response = await fetch("https://xrplcluster.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "account_lines",
        params: [
          {
            account: wallet,
            ledger_index: "validated",
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.result?.lines) {
      const vermLine = data.result.lines.find(
        (line: any) =>
          line.currency === "VERM" || line.account === VERM_CONTRACTS.xrp,
      );

      if (vermLine) {
        return parseFloat(vermLine.balance || "0");
      }
    }

    return 0;
  } catch (error) {
    console.error("Error fetching XRP VERM balance:", error);
    return 0;
  }
}

export const config: Config = {
  path: "/api/check-verm-balance",
};
