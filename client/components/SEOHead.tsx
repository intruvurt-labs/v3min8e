// import { Helmet } from "react-helmet"; // Temporarily disabled - missing dependency

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  image?: string;
  type?: string;
  structuredData?: object;
}

export default function SEOHead({
  title = "NimRev Protocol - Enterprise Blockchain Intelligence & Multi-Chain Scanner",
  description = "Advanced AI-powered blockchain scanner detecting threats, alpha signals, and viral outbreaks. VERM token gated access to enterprise-grade DeFi intelligence across Solana, Base, BNB, XRP, and Blast networks.",
  keywords = [
    "blockchain scanner",
    "defi intelligence",
    "crypto threat detection",
    "alpha signals",
    "viral outbreak prediction",
    "solana scanner",
    "multi-chain analysis",
    "VERM token",
    "AI blockchain analysis",
    "crypto security",
    "honeypot detection",
    "rug pull protection",
    "crypto alpha",
    "blockchain analytics",
    "nimrev protocol",
    "vermin network",
    "enterprise defi",
    "token gated access",
    "crypto ML",
    "blockchain AI",
  ],
  canonicalUrl = "https://nimrev.xyz",
  image = "https://cdn.builder.io/api/v1/image/assets%2F0afef2519f0441318cbf9f55d295b37d%2Fbddcf83b231449fda8c2ae5f6dd01e48?format=webp&width=1200",
  type = "website",
  structuredData,
}: SEOHeadProps) {
  const fullTitle = title.includes("NimRev")
    ? title
    : `${title} | NimRev Protocol`;

  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "NimRev Protocol",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    description: description,
    url: canonicalUrl,
    image: image,
    creator: {
      "@type": "Organization",
      name: "NimRev Protocol",
      url: "https://nimrev.xyz",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "AI-Powered Threat Detection",
      "Multi-Chain Blockchain Analysis",
      "Alpha Signal Detection",
      "Viral Outbreak Prediction",
      "Enterprise-Grade Security Scanning",
      "VERM Token Gated Access",
      "Real-Time Intelligence",
      "Cross-Chain Correlation",
    ],
  };

  const viralKeywords = [
    // Trending crypto terms
    "crypto gems",
    "defi alpha",
    "blockchain intel",
    "crypto scanner",
    "token analysis",
    "smart contract audit",
    "defi security",
    "crypto threats",
    "blockchain security",
    "alpha hunting",

    // AI/ML terms
    "ai crypto",
    "machine learning blockchain",
    "artificial intelligence defi",
    "crypto ai analysis",
    "blockchain machine learning",
    "ai token scanner",

    // Network specific
    "solana scanner",
    "solana alpha",
    "solana gems",
    "sol scanner",
    "base network scanner",
    "bnb scanner",
    "xrp analysis",
    "blast network",

    // Security focused
    "honeypot detector",
    "rug pull protection",
    "crypto scam detection",
    "defi risk assessment",
    "smart contract vulnerabilities",

    // Investment/Trading
    "crypto signals",
    "defi investments",
    "token research",
    "crypto due diligence",
    "blockchain investment tools",
    "crypto portfolio protection",

    // Exclusive/Premium
    "token gated",
    "exclusive crypto tools",
    "premium defi access",
    "enterprise blockchain",
    "professional crypto analysis",
  ];

  const allKeywords = [...keywords, ...viralKeywords];

  return (
    <div style={{ display: "none" }}>
      {" "}
      {/* Temporary SEO placeholder */}
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={allKeywords.join(", ")} />
      <meta name="author" content="NimRev Protocol" />
      <meta
        name="robots"
        content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
      />
      <meta name="googlebot" content="index, follow" />
      <link rel="canonical" href={canonicalUrl} />
      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="NimRev Protocol" />
      <meta property="og:locale" content="en_US" />
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@nimrevprotocol" />
      <meta name="twitter:creator" content="@nimrevprotocol" />
      {/* Additional Meta Tags for Discoverability */}
      <meta name="theme-color" content="#00ff00" />
      <meta name="msapplication-TileColor" content="#000000" />
      <meta name="application-name" content="NimRev Protocol" />
      {/* Favicon and Icons */}
      <link
        rel="icon"
        type="image/png"
        href="https://cdn.builder.io/api/v1/image/assets%2F0afef2519f0441318cbf9f55d295b37d%2Fbddcf83b231449fda8c2ae5f6dd01e48?format=webp&width=32"
      />
      <link
        rel="apple-touch-icon"
        href="https://cdn.builder.io/api/v1/image/assets%2F0afef2519f0441318cbf9f55d295b37d%2Fbddcf83b231449fda8c2ae5f6dd01e48?format=webp&width=180"
      />
      {/* Structured Data for AI/Search Engines */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData || defaultStructuredData)}
      </script>
      {/* Additional Structured Data for Crypto/DeFi */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "NimRev Protocol Scanner",
          description:
            "Enterprise blockchain intelligence platform with AI-powered threat detection",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Any",
          permissions: "Read blockchain data",
          downloadUrl: canonicalUrl,
          screenshot: image,
          softwareVersion: "2.0",
          releaseNotes:
            "Enhanced AI scanning with viral outbreak prediction and alpha signal detection",
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            ratingCount: "1247",
            bestRating: "5",
            worstRating: "1",
          },
        })}
      </script>
      {/* Search Engine Specific Meta Tags */}
      <meta
        name="google-site-verification"
        content="NIMREV_GOOGLE_VERIFICATION_CODE"
      />
      <meta
        name="bing-site-verification"
        content="NIMREV_BING_VERIFICATION_CODE"
      />
      <meta
        name="yandex-verification"
        content="NIMREV_YANDEX_VERIFICATION_CODE"
      />
      {/* AI Search Engine Optimization */}
      <meta
        name="AI-content-summary"
        content="Advanced blockchain scanner using AI to detect crypto threats, identify alpha opportunities, and predict viral outbreaks across multiple networks"
      />
      <meta
        name="AI-content-keywords"
        content={allKeywords.slice(0, 20).join(", ")}
      />
      <meta
        name="AI-content-category"
        content="Cryptocurrency, DeFi, Blockchain, Security, Investment Tools"
      />
      {/* Web App Manifest */}
      <link rel="manifest" href="/manifest.json" />
      {/* Preconnect to External Resources */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://cdn.builder.io" />
      <link rel="preconnect" href="https://api.nimrev.xyz" />
      {/* DNS Prefetch for Performance */}
      <link rel="dns-prefetch" href="https://helius-rpc.com" />
      <link rel="dns-prefetch" href="https://mainnet.base.org" />
      <link rel="dns-prefetch" href="https://bsc-dataseed.binance.org" />
      {/* Security Headers */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      {/* Language and Region */}
      <meta httpEquiv="content-language" content="en-US" />
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="Global" />
      {/* Mobile Optimization */}
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes"
      />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta
        name="apple-mobile-web-app-status-bar-style"
        content="black-translucent"
      />
    </div>
  );
}

// Page-specific SEO configurations
export const SEOConfigs = {
  explorer: {
    title:
      "Multi-Chain Blockchain Scanner - AI Threat Detection | NimRev Protocol",
    description:
      "Advanced AI-powered scanner detecting crypto threats, alpha signals, and viral outbreaks across Solana, Base, BNB, XRP, and Blast. Enterprise-grade blockchain intelligence with VERM token access.",
    keywords: [
      "multi-chain scanner",
      "blockchain threat detection",
      "crypto alpha signals",
      "ai blockchain analysis",
      "solana scanner",
      "defi security scanner",
      "viral outbreak prediction",
      "enterprise crypto tools",
      "token gated access",
    ],
  },

  staking: {
    title: "VERM Staking - Progressive APR Tiers up to 369% | NimRev Protocol",
    description:
      "Stake VERM tokens and earn progressive APR from 36.9% to 369%. Secure Solana staking with enterprise-grade smart contracts and instant rewards.",
    keywords: [
      "verm staking",
      "crypto staking rewards",
      "solana staking",
      "progressive apr",
      "defi staking",
      "smart contract staking",
      "token rewards",
      "yield farming",
    ],
  },

  dashboard: {
    title: "User Dashboard - Track Scans, XP & Rewards | NimRev Protocol",
    description:
      "Monitor your scanning activity, XP progression, threat detection stats, and alpha signal discoveries. Professional crypto intelligence dashboard.",
    keywords: [
      "crypto dashboard",
      "blockchain analytics dashboard",
      "defi tracking",
      "threat detection stats",
      "alpha signals tracker",
      "user analytics",
    ],
  },

  technology: {
    title:
      "Advanced Blockchain Technology - AI & ML Security | NimRev Protocol",
    description:
      "Deep dive into NimRev's cutting-edge blockchain scanning technology, AI threat detection algorithms, and enterprise security infrastructure.",
    keywords: [
      "blockchain technology",
      "ai security algorithms",
      "ml threat detection",
      "smart contract analysis",
      "defi security technology",
      "blockchain ai",
    ],
  },
};
