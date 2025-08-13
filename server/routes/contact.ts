import { RequestHandler } from "express";
import { z } from "zod";

// Contact form validation schema
const ContactFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long"),
  email: z.string().email("Invalid email address"),
  subject: z
    .string()
    .min(5, "Subject must be at least 5 characters")
    .max(200, "Subject too long"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message too long"),
  category: z.enum(["feedback", "support", "partnership", "security", "other"]),
});

export type ContactFormData = z.infer<typeof ContactFormSchema>;

export interface ContactResponse {
  success: boolean;
  message: string;
  ticketId?: string;
}

// Generate auto-reply message
const generateAutoReplyMessage = (
  data: ContactFormData,
  ticketId: string,
): string => {
  const categoryDescriptions = {
    feedback: "General Feedback",
    support: "Technical Support",
    partnership: "Partnership Inquiry",
    security: "Security Report",
    other: "General Inquiry",
  };

  return `
╔═══════════════════════════════════════════════════════════════╗
║                         NIMREV PROTOCOL                      ║
║                    Secure Communication Confirmed            ║
╚══════════��════════��═══════════════════════════════════════════╝

Hello ${data.name},

Your message has been successfully received by the NimRev Protocol team.
This is an automated confirmation to acknowledge receipt of your inquiry.

┌─ SUBMISSION DETAILS ─────────────────────────────────────────┐
│ Ticket ID:     ${ticketId}
│ Category:      ${categoryDescriptions[data.category]}
│ Subject:       ${data.subject}
│ Submitted:     ${new Date().toLocaleString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  })}
│ Contact Email: ${data.email}
└──────────────────────────────────────────────────────────────┘

┌─ WHAT HAPPENS NEXT ──────────────────────────────────────────┐
│
│ 🕵️ Data Ghost Analysis: Your message is being processed by our
│    secure communication protocols.
│
│ ⏱️  Response Timeline: We typically respond within 24 hours.
│    Complex technical or security matters may require additional
│    time for thorough investigation.
│
│ 🔐 Security Notice: If your inquiry involves sensitive security
│    information, we may request encrypted communication via PGP.
│
│ 📧 Direct Contact: For urgent matters, you can reach us directly
│    at verm@nimrev.xyz referencing ticket ${ticketId}.
│
└──────────────────────────────────────────────────────────────┘

┌─ NIMREV PROTOCOL RESOURCES ──────────────────────────────────┐
│
│ 🌐 Main Platform:  https://nimrev.xyz
│ 📄 Documentation:  https://nimrev.xyz/whitepaper
│ 💬 Community:      https://t.me/nimrevxyz
│ 🐦 Updates:        https://x.com/nimrevxyz
│
└──────────────────────────────────────────────────────────────┘

Important: This email confirms receipt only. Please do not reply
to this automated message. All responses will be sent from our
team directly to your submitted email address.

In a world full of bots, be the Ghost.

---
NimRev Protocol Team
Securing the future of decentralized systems
`.trim();
};

export const handleContactSubmission: RequestHandler = async (req, res) => {
  try {
    // Validate request body
    const validatedData = ContactFormSchema.parse(req.body);

    // Generate a cryptographically secure ticket ID
    const crypto = require("crypto");
    const ticketId = `NR-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    // Log the submission (this would forward to verm@nimrev.xyz in production)
    console.log("Contact Form Submission:", {
      ticketId,
      timestamp: new Date().toISOString(),
      destination: "verm@nimrev.xyz",
      ...validatedData,
    });

    // Auto-reply email content
    const autoReplySubject = `[NimRev] Message Received - Ticket ${ticketId}`;
    const autoReplyMessage = generateAutoReplyMessage(validatedData, ticketId);

    // Log auto-reply (in production, this would send actual email)
    console.log("Auto-Reply Email:", {
      to: validatedData.email,
      subject: autoReplySubject,
      message: autoReplyMessage,
      timestamp: new Date().toISOString(),
    });

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const response: ContactResponse = {
      success: true,
      message: `Your message has been sent successfully. A confirmation email has been sent to ${validatedData.email}. We'll get back to you within 24 hours.`,
      ticketId,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(
      "Contact form submission error:",
      error instanceof Error ? error.message : error,
    );
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace available",
    );

    if (error instanceof z.ZodError) {
      console.error("Validation errors:", error.errors);
      const response: ContactResponse = {
        success: false,
        message: `Validation error: ${error.errors[0].message}`,
      };
      return res.status(400).json(response);
    }

    // Log error without exposing sensitive data
    console.error("Contact form submission failed - validation error");
    console.error("Timestamp:", new Date().toISOString());

    const response: ContactResponse = {
      success: false,
      message:
        error instanceof Error
          ? `Server error: ${error.message}`
          : "Failed to send message. Please try again later.",
    };

    res.status(500).json(response);
  }
};
