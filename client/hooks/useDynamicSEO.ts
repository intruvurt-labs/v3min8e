import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { dynamicSEO } from "@/services/DynamicSEOService";

/**
 * Hook for automatic dynamic SEO management
 */
export function useDynamicSEO(pageName?: string, context?: any) {
  const location = useLocation();

  // Determine page name from route if not provided
  const getPageName = useCallback(() => {
    if (pageName) return pageName;

    const path = location.pathname.slice(1) || "index";
    return path.split("/")[0];
  }, [pageName, location.pathname]);

  // Track search patterns
  const trackSearch = useCallback((query: string) => {
    dynamicSEO.trackSearchPattern(query);
  }, []);

  // Update SEO for current page
  const updateSEO = useCallback(
    (customContext?: any) => {
      const currentPageName = getPageName();
      dynamicSEO.initializePageSEO(currentPageName, customContext || context);
    },
    [getPageName, context],
  );

  // Initialize SEO on mount and route changes
  useEffect(() => {
    updateSEO();
  }, [updateSEO, location.pathname]);

  return {
    trackSearch,
    updateSEO,
    getKeywordAnalytics: dynamicSEO.getKeywordAnalytics.bind(dynamicSEO),
  };
}

/**
 * Hook for tracking user interactions that affect SEO
 */
export function useSEOTracking() {
  const trackInteraction = useCallback((type: string, data: any) => {
    const searchTerms = [];

    switch (type) {
      case "wallet_scan":
        searchTerms.push(
          "wallet security",
          "address verification",
          "crypto safety",
        );
        break;
      case "contract_audit":
        searchTerms.push(
          "smart contract audit",
          "security review",
          "vulnerability scan",
        );
        break;
      case "token_analysis":
        searchTerms.push(
          "token analysis",
          "crypto token scan",
          "defi security",
        );
        break;
      case "rug_detection":
        searchTerms.push(
          "rug pull detection",
          "scam detection",
          "fraud prevention",
        );
        break;
      case "cross_chain_scan":
        searchTerms.push(
          "cross chain security",
          "multi blockchain",
          "bridge safety",
        );
        break;
      default:
        if (data.searchQuery) {
          searchTerms.push(data.searchQuery);
        }
    }

    searchTerms.forEach((term) => {
      dynamicSEO.trackSearchPattern(term);
    });
  }, []);

  return { trackInteraction };
}

/**
 * Hook for real-time keyword optimization
 */
export function useKeywordOptimization() {
  const getOptimizedContent = useCallback(
    (baseContent: string, maxKeywords: number = 5) => {
      const topKeywords = dynamicSEO.getTopKeywords(maxKeywords);
      let optimizedContent = baseContent;

      // Naturally integrate top keywords into content
      topKeywords.forEach((keyword, index) => {
        if (
          index < 3 &&
          !optimizedContent.toLowerCase().includes(keyword.toLowerCase())
        ) {
          // Add keyword naturally to content
          const variations = [
            ` Our ${keyword} platform`,
            ` Advanced ${keyword} technology`,
            ` Professional ${keyword} services`,
            ` Comprehensive ${keyword} solutions`,
          ];

          const variation = variations[index % variations.length];
          if (!optimizedContent.includes(variation)) {
            optimizedContent += variation + ".";
          }
        }
      });

      return optimizedContent;
    },
    [],
  );

  const getKeywordSuggestions = useCallback((category?: string) => {
    const analytics = dynamicSEO.getKeywordAnalytics();
    return analytics.topKeywords
      .filter((k) => !category || k.category === category)
      .map((k) => k.keyword);
  }, []);

  return {
    getOptimizedContent,
    getKeywordSuggestions,
  };
}
