import { useState } from "react";
import CyberGrid from "@/components/CyberGrid";
import CyberNav from "@/components/CyberNav";
import CyberFooter from "@/components/CyberFooter";
import { ContactFormData, ContactResponse } from "@shared/api";

export default function Contact() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "feedback",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
    ticketId?: string;
  }>({ type: null, message: "" });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result: ContactResponse = await response.json();

      if (result.success) {
        setSubmitStatus({
          type: "success",
          message: result.message,
          ticketId: result.ticketId,
        });
        // Reset form on success
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
          category: "feedback",
        });
      } else {
        setSubmitStatus({
          type: "error",
          message: result.message,
        });
      }
    } catch (error) {
      console.error(
        "Contact form submission error:",
        error instanceof Error ? error.message : error,
      );
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Network error. Please check your connection and try again.";

      setSubmitStatus({
        type: "error",
        message: errorMessage,
      });

      // Alert for immediate user notification
      alert(`Submission Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-foreground relative overflow-hidden">
      <CyberGrid intensity="low" animated={true} />
      <CyberNav />

      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="terminal mb-8 inline-block">
              <span className="text-cyber-green font-mono text-sm">
                Opening secure communication channel...
              </span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-cyber font-black text-cyber-green mb-6 neon-glow">
              CONTACT
            </h1>
            <p className="text-xl text-cyber-blue font-mono mb-4">
              Secure Channel for Feedback & Questions
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-cyber-green via-cyber-blue to-cyber-orange mx-auto animate-cyber-scan"></div>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-8">
              <div className="border border-cyber-green/30 p-6 bg-cyber-green/5 neon-border">
                <h2 className="text-xl font-cyber font-bold text-cyber-green mb-4 flex items-center">
                  <span className="text-2xl mr-3">📧</span>
                  DIRECT CONTACT
                </h2>
                <div className="space-y-3 text-gray-300 font-mono text-sm">
                  <p>
                    <strong className="text-cyber-green">Email:</strong>
                    <br />
                    <a
                      href="mailto:verm@nimrev.xyz"
                      className="text-cyber-blue hover:text-cyber-green transition-colors"
                    >
                      verm@nimrev.xyz
                    </a>
                  </p>
                  <p>
                    <strong className="text-cyber-green">Response Time:</strong>
                    <br />
                    Usually within 24 hours
                  </p>
                  <p>
                    <strong className="text-cyber-green">Encryption:</strong>
                    <br />
                    PGP available upon request
                  </p>
                </div>
              </div>

              <div className="border border-cyber-blue/30 p-6 bg-cyber-blue/5">
                <h3 className="text-lg font-cyber font-bold text-cyber-blue mb-4">
                  SUPPORT CATEGORIES
                </h3>
                <ul className="space-y-2 text-gray-300 font-mono text-sm">
                  <li>• General feedback & suggestions</li>
                  <li>• Technical support requests</li>
                  <li>• Partnership opportunities</li>
                  <li>• Security vulnerability reports</li>
                  <li>• Media & press inquiries</li>
                </ul>
              </div>

              <div className="border border-cyber-orange/30 p-6 bg-cyber-orange/5">
                <h3 className="text-lg font-cyber font-bold text-cyber-orange mb-4">
                  SECURITY NOTICE
                </h3>
                <p className="text-gray-300 font-mono text-sm leading-relaxed">
                  For sensitive security issues, please use our encrypted
                  channels or contact us directly for PGP keys before
                  disclosure.
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="border border-cyber-green/30 p-8 bg-dark-bg/50 neon-border">
                <h2 className="text-2xl font-cyber font-bold text-cyber-green mb-6 flex items-center">
                  <span className="text-3xl mr-3">💬</span>
                  SEND MESSAGE
                </h2>

                {/* Status Messages */}
                {submitStatus.type && (
                  <div
                    className={`mb-6 p-4 border ${
                      submitStatus.type === "success"
                        ? "border-cyber-green bg-cyber-green/10 text-cyber-green"
                        : "border-destructive bg-destructive/10 text-destructive"
                    }`}
                  >
                    <div className="font-mono text-sm">
                      {submitStatus.message}
                      {submitStatus.ticketId && (
                        <div className="mt-2">
                          <strong>Ticket ID:</strong> {submitStatus.ticketId}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name and Email Row */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-cyber-green font-mono font-bold mb-2"
                      >
                        NAME *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-dark-bg border border-cyber-green/30 text-gray-300 font-mono focus:border-cyber-green focus:outline-none transition-all duration-300"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-cyber-green font-mono font-bold mb-2"
                      >
                        EMAIL *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-dark-bg border border-cyber-green/30 text-gray-300 font-mono focus:border-cyber-green focus:outline-none transition-all duration-300"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label
                      htmlFor="category"
                      className="block text-cyber-green font-mono font-bold mb-2"
                    >
                      CATEGORY *
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-dark-bg border border-cyber-green/30 text-gray-300 font-mono focus:border-cyber-green focus:outline-none transition-all duration-300"
                    >
                      <option value="feedback">General Feedback</option>
                      <option value="support">Technical Support</option>
                      <option value="partnership">Partnership Inquiry</option>
                      <option value="security">Security Report</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Subject */}
                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-cyber-green font-mono font-bold mb-2"
                    >
                      SUBJECT *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-dark-bg border border-cyber-green/30 text-gray-300 font-mono focus:border-cyber-green focus:outline-none transition-all duration-300"
                      placeholder="Brief description of your inquiry"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-cyber-green font-mono font-bold mb-2"
                    >
                      MESSAGE *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 bg-dark-bg border border-cyber-green/30 text-gray-300 font-mono focus:border-cyber-green focus:outline-none transition-all duration-300 resize-none"
                      placeholder="Detailed message... Please include as much relevant information as possible."
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-between">
                    <p className="text-gray-400 font-mono text-xs">
                      * Required fields. We'll respond within 24 hours.
                    </p>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-8 py-4 font-mono font-bold tracking-wider transition-all duration-300 neon-border ${
                        isSubmitting
                          ? "bg-gray-600 border-gray-600 text-gray-400 cursor-not-allowed"
                          : "bg-cyber-green/20 border-2 border-cyber-green text-cyber-green hover:bg-cyber-green hover:text-dark-bg animate-pulse-glow"
                      }`}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                          SENDING...
                        </span>
                      ) : (
                        "SEND MESSAGE"
                      )}
                    </button>
                  </div>

                  <div className="mt-4 p-4 bg-cyber-blue/10 border border-cyber-blue/30 text-center">
                    <p className="text-cyber-blue font-mono text-sm">
                      🤖 You'll receive an automated confirmation email with
                      your ticket ID
                    </p>
                  </div>
                </form>
              </div>

              {/* Additional Info */}
              <div className="mt-8 grid md:grid-cols-2 gap-6">
                <div className="border border-cyber-blue/30 p-6 bg-cyber-blue/5">
                  <h3 className="text-lg font-cyber font-bold text-cyber-blue mb-3">
                    RESPONSE EXPECTATIONS
                  </h3>
                  <ul className="space-y-2 text-gray-300 font-mono text-sm">
                    <li>• Feedback: 24-48 hours</li>
                    <li>• Support: Within 24 hours</li>
                    <li>• Partnerships: 2-5 business days</li>
                    <li>• Security: Immediate review</li>
                  </ul>
                </div>
                <div className="border border-cyber-purple/30 p-6 bg-cyber-purple/5">
                  <h3 className="text-lg font-cyber font-bold text-cyber-purple mb-3">
                    AUTO-REPLY SYSTEM
                  </h3>
                  <div className="space-y-2 text-gray-300 font-mono text-sm">
                    <p>• Instant confirmation email with ticket ID</p>
                    <p>• Detailed submission summary</p>
                    <p>• Response timeline information</p>
                    <p>• Direct contact details for urgent matters</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CyberFooter />
    </div>
  );
}
