import type { Context, Config } from "@netlify/functions";

// In-memory storage for demo - in production, use PostgreSQL/MongoDB
const userProfiles = new Map<string, any>();

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { profile } = await req.json();

    if (!profile || !profile.wallet) {
      return new Response(
        JSON.stringify({ error: "Valid profile data required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Validate and sanitize profile data
    const sanitizedProfile = await sanitizeProfile(profile);

    // Update profile in storage
    userProfiles.set(profile.wallet, sanitizedProfile);

    // Log profile update for analytics
    console.log(
      `Profile updated for wallet: ${profile.wallet.slice(0, 8)}...${profile.wallet.slice(-4)}`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        profile: sanitizedProfile,
        message: "Profile updated successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error updating user profile:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to update profile",
        success: false,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

async function sanitizeProfile(profile: any) {
  // Sanitize text inputs
  const sanitizedName = sanitizeText(profile.name, 50);
  const sanitizedBio = sanitizeText(profile.bio, 200);

  // Validate avatar URL or base64
  let avatarUrl = profile.avatar;
  if (profile.avatar && profile.avatar.startsWith("data:image/")) {
    // Handle base64 image upload
    avatarUrl = await uploadAvatar(profile.avatar, profile.wallet);
  }

  return {
    ...profile,
    name: sanitizedName,
    bio: sanitizedBio,
    avatar: avatarUrl,
    lastAction: {
      ...profile.lastAction,
      timestamp: new Date().toISOString(),
    },
    // Preserve critical data that shouldn't be user-editable
    wallet: profile.wallet,
    joinDate: profile.joinDate,
    totalScans: profile.totalScans,
    successfulScans: profile.successfulScans,
    threatsDetected: profile.threatsDetected,
    alphaSignalsFound: profile.alphaSignalsFound,
    reputation: profile.reputation,
    vermHoldings: profile.vermHoldings,
  };
}

function sanitizeText(text: string, maxLength: number): string {
  if (!text) return "";

  // Remove potentially dangerous characters
  const sanitized = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>&"']/g, (char) => {
      const entities: { [key: string]: string } = {
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&#x27;",
      };
      return entities[char];
    })
    .trim();

  return sanitized.slice(0, maxLength);
}

async function uploadAvatar(
  base64Data: string,
  wallet: string,
): Promise<string> {
  try {
    // In production, upload to CDN (AWS S3, Cloudinary, etc.)
    // For demo, we'll simulate a successful upload

    // Validate image format and size
    const [header, data] = base64Data.split(",");
    if (!header.includes("image/")) {
      throw new Error("Invalid image format");
    }

    // Calculate file size (base64 is ~33% larger than binary)
    const sizeInBytes = (data.length * 3) / 4;
    if (sizeInBytes > 2 * 1024 * 1024) {
      // 2MB limit
      throw new Error("Image too large");
    }

    // In production, upload to CDN and return URL
    // For now, return a placeholder that would represent the uploaded image
    const mockUploadedUrl = `https://cdn.nimrev.xyz/avatars/${wallet.slice(0, 8)}_${Date.now()}.jpg`;

    console.log(
      `Avatar uploaded for wallet: ${wallet.slice(0, 8)}...${wallet.slice(-4)}`,
    );

    // For demo purposes, return the original base64 (in production, return CDN URL)
    return base64Data;
  } catch (error) {
    console.error("Error uploading avatar:", error);
    // Return default avatar on error
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${wallet}&backgroundColor=00ff00`;
  }
}

export const config: Config = {
  path: "/api/user/profile/update",
};
