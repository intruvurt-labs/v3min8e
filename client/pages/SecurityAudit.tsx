import { useState, useEffect } from "react";
import {
  Shield,
  Upload,
  CreditCard,
  Bot,
  FileText,
  CheckCircle,
  Clock,
  Zap,
  Brain,
  Lock,
  Eye,
  DollarSign,
  RefreshCw,
  Target,
  Layers,
  AlertTriangle
} from "lucide-react";
import CyberGrid from "@/components/CyberGrid";
import CyberNav from "@/components/CyberNav";
import CyberFooter from "@/components/CyberFooter";
import TechTooltip, { VermTooltip, HackerProofTooltip, FlaggedAuditTooltip } from "@/components/TechTooltip";
import { useWallet } from "@/hooks/useWallet";
import { v4 as uuidv4 } from "uuid";

const FILE_TYPES = [
  ".sol", ".rs", ".js", ".ts", ".py", ".go", ".json", ".md", ".txt"
];

interface AuditPackage {
  id: string;
  name: string;
  price: number;
  features: string[];
  description: string;
  estimatedTime: string;
  maxFileSize: string;
  color: string;
}

interface ScanResult {
  scanType: "static_analysis" | "dynamic_behavior" | "pattern_recognition";
  scanName: string;
  status: "pending" | "running" | "completed" | "failed";
  vulnerabilities: number;
  riskScore: number;
  confidence: number;
  duration: number;
  findings: string[];
}

interface AuditResult {
  id: string;
  status: "pending" | "processing" | "completed" | "manual_review" | "failed";
  scans: ScanResult[];
  finalVulnerabilities: number;
  finalRiskScore: number;
  reportUrl?: string;
  aiConfidence: number;
  manualReviewRequired: boolean;
  consensusReached: boolean;
  totalDuration: number;
}

const auditPackages: AuditPackage[] = [
  {
    id: "basic",
    name: "Basic Smart Contract Audit",
    price: 250,
    features: [
      "AI-powered vulnerability scanning",
      "Smart contract security analysis",
      "Basic exploit detection",
      "Risk assessment report",
      "Standard turnaround time",
      "Up to 5 files analysis",
    ],
    description: "AI analysis for simple smart contracts (1-5 files)",
    estimatedTime: "2-6 hours",
    maxFileSize: "10MB",
    color: "cyber-green",
  },
  {
    id: "comprehensive",
    name: "Comprehensive Project Audit",
    price: 650,
    features: [
      "Full project codebase analysis",
      "Smart contract + file-based security",
      "Advanced ML vulnerability detection",
      "Cross-file dependency analysis",
      "Priority processing",
      "Up to 25 files analysis",
      "Manual review if needed",
    ],
    description: "Complete project security analysis (6-25 files)",
    estimatedTime: "4-12 hours",
    maxFileSize: "100MB",
    color: "cyber-orange",
  },
  {
    id: "enterprise",
    name: "Enterprise Security Suite",
    price: 1200,
    features: [
      "Multi-project analysis",
      "Advanced hacker-proof validation",
      "Real-time monitoring integration",
      "Custom vulnerability patterns",
      "Dedicated security expert review",
      "Priority support & consultation",
      "Unlimited files analysis",
      "Complex architecture support",
    ],
    description: "Enterprise-grade security for complex codebases (25+ files)",
    estimatedTime: "12-24 hours",
    maxFileSize: "500MB",
    color: "cyber-purple",
  },
];

export default function SecurityAudit() {
  const [selectedPackage, setSelectedPackage] = useState<AuditPackage | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [projectDescription, setProjectDescription] = useState("");
  const [auditResults, setAuditResults] = useState<AuditResult[]>([]);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [auditInProgress, setAuditInProgress] = useState(false);
  const [vermBalance, setVermBalance] = useState<number>(0);
  const { connected: walletConnected, publicKey } = useWallet();

  useEffect(() => {
    if (walletConnected && publicKey) {
      // Replace this with a secure backend call to get user's VERM balance
      fetch(`/api/wallet/balance?address=${publicKey}`)
        .then(res => res.json())
        .then(data => setVermBalance(data.balance));
    }
  }, [walletConnected, publicKey]);

  const calculateTotalSize = () =>
    uploadedFiles.reduce((total, file) => total + file.size, 0);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const maxMB = selectedPackage ? Number(selectedPackage.maxFileSize.replace("MB", "")) : 10;
    const maxBytes = maxMB * 1024 * 1024;
    const files = Array.from(event.target.files || []);
    const validatedFiles = files.filter(file =>
      FILE_TYPES.some(type => file.name.endsWith(type)) && file.size <= maxBytes
    );
    if (validatedFiles.length < files.length) {
      alert("Some files were rejected due to unsupported type or size.");
    }
    setUploadedFiles(prev => [...prev, ...validatedFiles]);
  };

  const removeFile = (index: number) =>
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));

  const handlePaymentAndAudit = async () => {
    if (!selectedPackage || !walletConnected) return;

    const requiredVerm = selectedPackage.price * 2.5;
    if (vermBalance < requiredVerm) {
      alert(`Insufficient VERM balance. Required: ${Math.round(requiredVerm)} VERM, Available: ${vermBalance} VERM`);
      return;
    }

    setPaymentRequired(true);

    // Instead of client-side simulation, call backend API to process payment
    try {
      await fetch("/api/payment/process", {
        method: "POST",
        body: JSON.stringify({
          wallet: publicKey,
          amount: Math.round(requiredVerm)
        }),
        headers: { "Content-Type": "application/json" }
      }).then(res => {
        if (!res.ok) throw new Error("Payment failed");
      });

      setPaymentRequired(false);
      setAuditInProgress(true);

      // Send files and project description to backend for secure auditing
      const formData = new FormData();
      uploadedFiles.forEach(file => formData.append("files", file));
      formData.append("projectDescription", projectDescription);
      formData.append("auditPackage", selectedPackage.id);

      const auditRes = await fetch("/api/audit/start", {
        method: "POST",
        body: formData
      }).then(res => res.json());

      setAuditResults(prev => [auditRes, ...prev]);
      setVermBalance(prev => prev - Math.round(requiredVerm));

      // Optionally, poll for audit status and update results accordingly
      pollAuditStatus(auditRes.id);
    } catch (error) {
      alert("Payment or audit process failed. Please try again.");
      setPaymentRequired(false);
      setAuditInProgress(false);
    }
  };

  const pollAuditStatus = (auditId: string) => {
    const interval = setInterval(async () => {
      const statusRes = await fetch(`/api/audit/status?id=${auditId}`).then(res => res.json());
      setAuditResults(results => results.map(a =>
        a.id === auditId ? { ...a, ...statusRes } : a
      ));
      if (statusRes.status === "completed" || statusRes.status === "manual_review" || statusRes.status === "failed") {
        setAuditInProgress(false);
        clearInterval(interval);
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-foreground relative overflow-hidden">
      <CyberGrid intensity="medium" animated={true} />
      <CyberNav />

      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header, Pricing, Audit Packages Sections */}
          {/* ...Copy your existing JSX layout here... */}

          {/* File Upload Section */}
          {selectedPackage && (
            <section className="mb-16">
              {/* ...File upload JSX as in original code... */}
              <input
                type="file"
                multiple
                accept={FILE_TYPES.join(",")}
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              {/* ...etc... */}
            </section>
          )}

          {/* Payment & Audit Section */}
          {selectedPackage &&
            uploadedFiles.length > 0 &&
            projectDescription.trim() && (
              <section className="mb-16">
                {/* ...Audit summary, wallet info (use vermBalance from backend)... */}
                <button
                  onClick={handlePaymentAndAudit}
                  disabled={
                    !walletConnected ||
                    vermBalance < selectedPackage.price * 2.5 ||
                    paymentRequired ||
                    auditInProgress
                  }
                  className="w-full mt-6 px-8 py-4 bg-cyber-purple/20 border-2 border-cyber-purple text-cyber-purple font-cyber font-bold tracking-wider hover:bg-cyber-purple hover:text-dark-bg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {paymentRequired
                    ? "PROCESSING PAYMENT..."
                    : auditInProgress
                    ? "AUDIT IN PROGRESS..."
                    : `PAY ${Math.round(selectedPackage.price * 2.5)} VERM & START AUDIT`}
                </button>
              </section>
            )}

          {/* Audit Results */}
          {auditResults.length > 0 && (
            <section className="mb-16">
              {/* ...Render audit results using auditResults array... */}
            </section>
          )}

          {/* Manual Audit for Flagged Submissions, System Integration, Security Features Sections */}
          {/* ...Copy your original JSX for these layouts... */}
        </div>
      </div>

      <CyberFooter />
    </div>
  );
}
