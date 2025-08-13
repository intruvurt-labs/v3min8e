import { useState, useEffect } from "react";
import { X, Wallet, Clock, Shield, Zap } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PaymentData {
  paymentId: string;
  paymentAddress: string;
  amount: number;
  expiresAt: string;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const { connected, publicKey, signTransaction } = useWallet();
  const [step, setStep] = useState<
    "plan" | "payment" | "confirming" | "success"
  >("plan");
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [txHash, setTxHash] = useState("");

  // Timer for payment expiry
  useEffect(() => {
    if (paymentData && step === "payment") {
      const updateTimer = () => {
        const now = Date.now();
        const expires = new Date(paymentData.expiresAt).getTime();
        const remaining = Math.max(0, Math.floor((expires - now) / 1000));
        setTimeLeft(remaining);

        if (remaining === 0) {
          setStep("plan");
          setPaymentData(null);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [paymentData, step]);

  const createPayment = async () => {
    try {
      const response = await fetch("/api/payment/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createPayment",
          wallet: publicKey,
          amount: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`Payment creation failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setPaymentData(data);
        setStep("payment");
      } else {
        throw new Error(data.error || "Payment creation failed");
      }
    } catch (error) {
      console.error("Payment creation error:", error);
      alert("Failed to create payment. Please try again.");
    }
  };

  const sendPayment = async () => {
    if (!paymentData || !connected) return;

    try {
      setStep("confirming");

      // Create a simple SOL transfer transaction
      // In a real implementation, you'd use @solana/web3.js
      const transaction = {
        recentBlockhash: "placeholder",
        feePayer: publicKey,
        instructions: [
          {
            programId: "11111111111111111111111111111111", // System program
            keys: [
              { pubkey: publicKey, isSigner: true, isWritable: true },
              {
                pubkey: paymentData.paymentAddress,
                isSigner: false,
                isWritable: true,
              },
            ],
            data: Buffer.from([2, 0, 0, 0, ...new Array(8).fill(0)]), // Transfer instruction
          },
        ],
      };

      // This would normally use @solana/web3.js to create and send the transaction
      // For demo, we'll simulate with a mock hash
      const mockTxHash = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setTxHash(mockTxHash);

      // Confirm payment with backend
      const confirmResponse = await fetch("/api/payment/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirmPayment",
          wallet: publicKey,
          txHash: mockTxHash,
        }),
      });

      if (confirmResponse.ok) {
        const confirmData = await confirmResponse.json();
        if (confirmData.success) {
          setStep("success");
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 3000);
        } else {
          throw new Error(confirmData.error || "Payment confirmation failed");
        }
      } else {
        throw new Error("Payment confirmation failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Please try again.");
      setStep("payment");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-bg border border-cyber-green/30 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-cyber font-bold text-cyber-green">
              Monthly Scanner Access
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-cyber-green transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === "plan" && (
            <div className="space-y-6">
              {/* Plan Details */}
              <div className="p-4 border border-cyber-orange/30 bg-cyber-orange/5 rounded">
                <h3 className="text-cyber-orange font-bold mb-3 flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  MONTHLY PREMIUM ACCESS
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="text-cyber-green font-bold">30 Days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price:</span>
                    <span className="text-cyber-orange font-bold">0.1 SOL</span>
                  </div>
                  <div className="flex justify-between">
                    <span>USD Value:</span>
                    <span className="text-gray-300">~$20-25</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <h4 className="text-cyber-blue font-bold">
                  INCLUDED FEATURES:
                </h4>
                <div className="grid gap-2 text-sm">
                  {[
                    "Unlimited NimRev Scans",
                    "Full Threat Detection",
                    "Alpha Signal Access",
                    "Viral Outbreak Alerts",
                    "Real-time Analytics",
                    "Priority Support",
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center text-gray-300">
                      <span className="text-cyber-green mr-2">✓</span>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Comparison */}
              <div className="p-4 border border-cyber-purple/30 bg-cyber-purple/5 rounded">
                <h4 className="text-cyber-purple font-bold mb-2">💡 PRO TIP</h4>
                <p className="text-xs text-gray-300">
                  For better value, consider buying & staking VERM tokens
                  instead. You get scanner access PLUS earn up to 36.9% APR
                  rewards!
                </p>
              </div>

              {/* Action */}
              <button
                onClick={createPayment}
                disabled={!connected}
                className="w-full py-3 bg-cyber-orange/20 border border-cyber-orange text-cyber-orange font-bold hover:bg-cyber-orange/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connected ? "PROCEED TO PAYMENT" : "CONNECT WALLET FIRST"}
              </button>
            </div>
          )}

          {step === "payment" && paymentData && (
            <div className="space-y-6">
              {/* Timer */}
              <div className="text-center p-4 border border-cyber-orange/30 bg-cyber-orange/5 rounded">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="w-4 h-4 mr-2 text-cyber-orange" />
                  <span className="text-cyber-orange font-bold">
                    Time Remaining
                  </span>
                </div>
                <div className="text-2xl font-mono font-bold text-cyber-orange">
                  {formatTime(timeLeft)}
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-cyber-green mb-2">
                    SEND TO ADDRESS:
                  </label>
                  <div className="p-3 bg-dark-bg border border-cyber-green/30 rounded">
                    <code className="text-cyber-green text-xs break-all">
                      {paymentData.paymentAddress}
                    </code>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-cyber-orange mb-2">
                    AMOUNT:
                  </label>
                  <div className="text-center p-3 bg-cyber-orange/10 border border-cyber-orange/30 rounded">
                    <span className="text-2xl font-bold text-cyber-orange">
                      0.1 SOL
                    </span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-4 border border-cyber-blue/30 bg-cyber-blue/5 rounded">
                <h4 className="text-cyber-blue font-bold mb-2">
                  PAYMENT INSTRUCTIONS:
                </h4>
                <ol className="text-xs space-y-1 text-gray-300">
                  <li>1. Copy the address above</li>
                  <li>2. Send exactly 0.1 SOL from your wallet</li>
                  <li>3. Click "I've Sent Payment" below</li>
                  <li>4. Wait for blockchain confirmation</li>
                </ol>
              </div>

              <button
                onClick={sendPayment}
                className="w-full py-3 bg-cyber-green/20 border border-cyber-green text-cyber-green font-bold hover:bg-cyber-green/30 transition-all duration-300"
              >
                I'VE SENT PAYMENT
              </button>
            </div>
          )}

          {step === "confirming" && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 border-4 border-cyber-green border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div>
                <h3 className="text-cyber-green font-bold mb-2">
                  CONFIRMING PAYMENT
                </h3>
                <p className="text-gray-300 text-sm">
                  Verifying transaction on blockchain...
                </p>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-cyber-green/20 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-cyber-green" />
              </div>
              <div>
                <h3 className="text-cyber-green font-bold mb-2">
                  PAYMENT CONFIRMED!
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  30-day premium access activated
                </p>
                {txHash && (
                  <div className="p-3 bg-cyber-green/10 border border-cyber-green/30 rounded">
                    <p className="text-xs text-gray-300 mb-1">
                      Transaction Hash:
                    </p>
                    <code className="text-cyber-green text-xs break-all">
                      {txHash}
                    </code>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
