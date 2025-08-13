import { createClient } from "@supabase/supabase-js";
import { getEnv } from "./env";

const supabaseUrl = getEnv("SUPABASE_URL");
const supabaseKey = getEnv("SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions for common operations
export class SupabaseHelper {
  static async ensureUserExists(
    telegramId?: number,
    discordId?: number,
    walletAddress?: string,
  ) {
    if (!telegramId && !discordId && !walletAddress) {
      throw new Error("At least one identifier required");
    }

    let query = supabase.from("verified_users").select("*");

    if (telegramId) {
      query = query.eq("telegram_id", telegramId);
    } else if (discordId) {
      query = query.eq("discord_id", discordId);
    } else if (walletAddress) {
      query = query.eq("wallet_address", walletAddress);
    }

    const { data: existingUser } = await query.single();

    if (existingUser) {
      return existingUser;
    }

    // Create new user
    const { data: newUser, error } = await supabase
      .from("verified_users")
      .insert({
        telegram_id: telegramId,
        discord_id: discordId,
        wallet_address: walletAddress,
        verification_status: "pending",
        api_key: this.generateApiKey(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return newUser;
  }

  static generateApiKey(): string {
    const crypto = require("crypto");
    return "nr_" + crypto.randomBytes(16).toString("hex");
  }

  static async getUserScanCredits(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from("verified_users")
      .select("scan_credits")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data?.scan_credits || 0;
  }

  static async consumeScanCredit(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("verified_users")
      .update({
        scan_credits: supabase.raw("scan_credits - 1"),
        last_active: new Date().toISOString(),
      })
      .eq("id", userId)
      .eq("scan_credits", supabase.raw("scan_credits > 0"))
      .select("scan_credits");

    return !error && data && data.length > 0;
  }

  static async logAlert(alertData: {
    alert_type: string;
    target_address: string;
    blockchain: string;
    risk_score?: number;
    alert_data: any;
    recipients: string[];
    scan_result_id?: string;
    watched_address_id?: string;
  }) {
    const { error } = await supabase.from("alerts_log").insert({
      ...alertData,
      delivery_status: {},
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to log alert:", error);
    }
  }

  static async updateAlertDeliveryStatus(
    alertId: string,
    recipient: string,
    status: "sent" | "failed",
    error?: string,
  ) {
    const { data: alert } = await supabase
      .from("alerts_log")
      .select("delivery_status")
      .eq("id", alertId)
      .single();

    if (alert) {
      const deliveryStatus = alert.delivery_status || {};
      deliveryStatus[recipient] = {
        status,
        error,
        timestamp: new Date().toISOString(),
      };

      await supabase
        .from("alerts_log")
        .update({
          delivery_status: deliveryStatus,
          delivered_at: new Date().toISOString(),
        })
        .eq("id", alertId);
    }
  }
}
