import { z } from "zod";

// Environment validation schema
const EnvSchema = z.object({
  // Blockchain RPCs
  HELIUS_RPC_URL: z.string().url().optional(),
  SOLANA_NETWORK: z
    .enum(["mainnet-beta", "devnet", "testnet"])
    .default("mainnet-beta"),
  ALCHEMY_API_KEY: z.string().optional(),
  INFURA_PROJECT_ID: z.string().optional(),

  // Contract addresses
  VERM_TOKEN_MINT: z.string().min(32),
  VERM_STAKING_PROGRAM: z.string().min(32),

  // API Keys (masked in logs)
  COINGECKO_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // Database
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),

  // Security
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().length(32),

  // Bot configuration
  TELEGRAM_BOT_TOKEN: z.string().optional(),

  // Feature flags
  ENABLE_ML_SCANNING: z
    .string()
    .transform((val) => val === "true")
    .default("true"),
  ENABLE_VIRAL_DETECTION: z
    .string()
    .transform((val) => val === "true")
    .default("true"),
  ENABLE_ALPHA_SIGNALS: z
    .string()
    .transform((val) => val === "true")
    .default("true"),

  // Rate limits
  VERM_MINIMUM_USD: z.string().transform(Number).default("25"),
  RATE_LIMIT_DEMO: z.string().transform(Number).default("3"),
  RATE_LIMIT_VERM: z.string().transform(Number).default("100"),
  RATE_LIMIT_PREMIUM: z.string().transform(Number).default("500"),

  // Blockchain monitoring
  DEFAULT_BLOCKCHAIN: z
    .enum(["solana", "base", "bnb", "xrp", "blast"])
    .default("solana"),

  // Deployment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DOMAIN: z.string().default("localhost"),
});

type EnvType = z.infer<typeof EnvSchema>;

class EnvManager {
  private env: EnvType;
  private sensitiveKeys = [
    "HELIUS_RPC_URL",
    "ALCHEMY_API_KEY",
    "COINGECKO_API_KEY",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "DATABASE_URL",
    "REDIS_URL",
    "JWT_SECRET",
    "ENCRYPTION_KEY",
    "TELEGRAM_BOT_TOKEN",
  ];

  constructor() {
    try {
      this.env = EnvSchema.parse(process.env);
      this.validateCriticalKeys();
    } catch (error) {
      console.error("❌ Environment validation failed:", error);
      process.exit(1);
    }
  }

  private validateCriticalKeys() {
    const criticalKeys = ["VERM_TOKEN_MINT", "JWT_SECRET", "ENCRYPTION_KEY"];
    const missing = criticalKeys.filter(
      (key) => !this.env[key as keyof EnvType],
    );

    if (missing.length > 0) {
      throw new Error(
        `Critical environment variables missing: ${missing.join(", ")}`,
      );
    }
  }

  get<K extends keyof EnvType>(key: K): EnvType[K] {
    return this.env[key];
  }

  getSecure<K extends keyof EnvType>(key: K): EnvType[K] | null {
    const value = this.env[key];
    if (!value && this.sensitiveKeys.includes(key as string)) {
      console.warn(`⚠️ Sensitive key ${key} not configured`);
      return null;
    }
    return value;
  }

  maskSensitive(value: string): string {
    if (value.length <= 8) return "***";
    return value.slice(0, 4) + "***" + value.slice(-4);
  }

  logConfig() {
    console.log("🔧 Environment Configuration:");
    console.log(`   Default Blockchain: ${this.env.DEFAULT_BLOCKCHAIN.toUpperCase()}`);
    console.log(`   Solana Network: ${this.env.SOLANA_NETWORK}`);
    console.log(`   Domain: ${this.env.DOMAIN}`);
    console.log(`   Node Env: ${this.env.NODE_ENV}`);
    console.log(`   ML Scanning: ${this.env.ENABLE_ML_SCANNING ? "✅" : "❌"}`);
    console.log(
      `   Viral Detection: ${this.env.ENABLE_VIRAL_DETECTION ? "✅" : "❌"}`,
    );
    console.log(
      `   Alpha Signals: ${this.env.ENABLE_ALPHA_SIGNALS ? "✅" : "❌"}`,
    );

    // Log masked sensitive values
    if (this.env.HELIUS_RPC_URL) {
      console.log(`   Helius: ${this.maskSensitive(this.env.HELIUS_RPC_URL)}`);
    }
    if (this.env.DATABASE_URL) {
      console.log(`   Database: ${this.maskSensitive(this.env.DATABASE_URL)}`);
    }
  }

  isProduction(): boolean {
    return this.env.NODE_ENV === "production";
  }

  isDevelopment(): boolean {
    return this.env.NODE_ENV === "development";
  }
}

// Singleton instance
export const envManager = new EnvManager();

// Helper functions for common patterns
export const getEnv = <K extends keyof EnvType>(key: K): EnvType[K] =>
  envManager.get(key);
export const getSecureEnv = <K extends keyof EnvType>(
  key: K,
): EnvType[K] | null => envManager.getSecure(key);
export const isProduction = () => envManager.isProduction();
export const isDevelopment = () => envManager.isDevelopment();

// Log configuration on startup
if (isDevelopment()) {
  envManager.logConfig();
}

export default envManager;
