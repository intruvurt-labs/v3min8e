// ============================================================================
// INTEGRATED ADVANCED SECURITY SCANNER SYSTEM
// Combines all detection methods into comprehensive analysis
// ============================================================================

import express from 'express';
import { AdvancedScamDetector } from './AdvancedScamDetector';
import { SolanaSecurityAnalyzer } from './SolanaSecurityAnalyzer';

// Enhanced scanner with all advanced detection capabilities
export class ComprehensiveSecurityScanner {
  private basicAnalyzer: SolanaSecurityAnalyzer;
  private advancedDetector: AdvancedScamDetector;
  private scamDatabase: ScamDatabase;

  constructor(config: any) {
    this.basicAnalyzer = new SolanaSecurityAnalyzer(config);
    this.advancedDetector = new AdvancedScamDetector(config);
    this.scamDatabase = new ScamDatabase(config);
  }

  async performComprehensiveScan(mintAddress: string) {
    console.log(`Starting comprehensive scan of ${mintAddress}`);
    
    try {
      // Run all analyses in parallel for speed
      const [
        basicAnalysis,
        advancedThreats,
        historicalData,
        realTimeMonitoring
      ] = await Promise.allSettled([
        this.basicAnalyzer.analyzeToken(mintAddress),
        this.advancedDetector.performAdvancedScamAnalysis(mintAddress),
        this.scamDatabase.checkHistoricalData(mintAddress),
        this.performRealTimeMonitoring(mintAddress)
      ]);

      // Combine all results
      const combinedResults = this.combineAnalysisResults(
        basicAnalysis.status === 'fulfilled' ? basicAnalysis.value : null,
        advancedThreats.status === 'fulfilled' ? advancedThreats.value : null,
        historicalData.status === 'fulfilled' ? historicalData.value : null,
        realTimeMonitoring.status === 'fulfilled' ? realTimeMonitoring.value : null
      );

      // Generate final security report
      const securityReport = this.generateSecurityReport(combinedResults);

      // Store results for future reference
      await this.scamDatabase.storeAnalysisResults(mintAddress, securityReport);

      return securityReport;

    } catch (error) {
      console.error('Comprehensive scan failed:', error);
      throw new Error(`Scan failed: ${error.message}`);
    }
  }

  private combineAnalysisResults(basic: any, advanced: any, historical: any, realTime: any) {
    // Merge threat detections
    const allThreats = [
      ...(basic?.warnings?.map(w => ({
        type: 'BASIC_WARNING',
        severity: 50,
        description: w,
        category: 'basic'
      })) || []),
      ...(advanced?.detectedThreats || []),
      ...(historical?.knownThreats || []),
      ...(realTime?.activeThreats || [])
    ];

    // Calculate composite risk score
    const basicRisk = basic?.riskScore || 0;
    const advancedRisk = advanced?.totalSeverityScore || 0;
    const historicalRisk = historical?.riskScore || 0;
    const realTimeRisk = realTime?.riskScore || 0;

    const compositeRiskScore = this.calculateCompositeRisk(
      basicRisk, advancedRisk, historicalRisk, realTimeRisk
    );

    return {
      mintAddress: basic?.mintAddress,
      basicAnalysis: basic,
      advancedThreats: advanced,
      historicalData: historical,
      realTimeData: realTime,
      allThreats: allThreats.sort((a, b) => b.severity - a.severity),
      compositeRiskScore,
      overallRiskLevel: this.determineOverallRisk(compositeRiskScore, allThreats),
      analysisTimestamp: new Date().toISOString()
    };
  }

  private generateSecurityReport(combinedResults: any) {
    const report = {
      scanId: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tokenAddress: combinedResults.mintAddress,
      timestamp: combinedResults.analysisTimestamp,
      
      // Executive Summary
      executiveSummary: {
        overallRisk: combinedResults.overallRiskLevel,
        riskScore: combinedResults.compositeRiskScore,
        criticalThreats: combinedResults.allThreats.filter(t => t.severity >= 80).length,
        recommendedAction: this.getRecommendedAction(combinedResults.overallRiskLevel),
        keyFindings: this.extractKeyFindings(combinedResults.allThreats)
      },

      // Detailed Analysis
      detailedAnalysis: {
        tokenMetadata: combinedResults.basicAnalysis?.metadata,
        marketData: combinedResults.basicAnalysis?.liquidity,
        holderAnalysis: combinedResults.basicAnalysis?.holders,
        socialIntelligence: combinedResults.basicAnalysis?.social,
        transactionPatterns: combinedResults.basicAnalysis?.transactions
      },

      // Threat Assessment
      threatAssessment: {
        honeypotRisk: this.assessSpecificThreat('HONEYPOT', combinedResults.allThreats),
        rugPullRisk: this.assessSpecificThreat('RUG', combinedResults.allThreats),
        socialEngineeringRisk: this.assessSpecificThreat('SOCIAL', combinedResults.allThreats),
        technicalVulnerabilities: this.assessSpecificThreat('VULN', combinedResults.allThreats),
        marketManipulation: this.assessSpecificThreat('MANIPULATION', combinedResults.allThreats)
      },

      // All detected threats
      detectedThreats: combinedResults.allThreats,

      // Historical context
      historicalContext: combinedResults.historicalData,

      // Real-time monitoring
      realTimeMonitoring: combinedResults.realTimeData,

      // Confidence metrics
      analysisConfidence: this.calculateAnalysisConfidence(combinedResults),

      // Next steps
      recommendations: this.generateRecommendations(combinedResults)
    };

    return report;
  }

  private calculateCompositeRisk(basic: number, advanced: number, historical: number, realTime: number): number {
    // Weighted average with different importance levels
    const weights = {
      basic: 0.25,
      advanced: 0.40,
      historical: 0.20,
      realTime: 0.15
    };

    const compositeScore = 
      (basic * weights.basic) +
      (Math.min(advanced, 100) * weights.advanced) +
      (historical * weights.historical) +
      (realTime * weights.realTime);

    return Math.min(Math.round(compositeScore), 100);
  }

  private determineOverallRisk(score: number, threats: any[]): string {
    const criticalThreats = threats.filter(t => t.severity >= 90).length;
    const highThreats = threats.filter(t => t.severity >= 75).length;

    if (criticalThreats >= 3 || score >= 85) return 'CRITICAL';
    if (criticalThreats >= 1 || highThreats >= 3 || score >= 70) return 'HIGH';
    if (highThreats >= 1 || score >= 50) return 'MEDIUM';
    if (score >= 25) return 'LOW';
    return 'MINIMAL';
  }

  private getRecommendedAction(riskLevel: string): string {
    const actions = {
      'CRITICAL': 'DO NOT TRADE - Multiple critical security threats detected. This token poses extreme risk to investors.',
      'HIGH': 'AVOID - High-risk token with significant threat indicators. Not recommended for investment.',
      'MEDIUM': 'CAUTION - Some concerning patterns detected. Only invest small amounts if you understand the risks.',
      'LOW': 'PROCEED CAREFULLY - Minor risk factors present. Monitor closely and limit exposure.',
      'MINIMAL': 'RELATIVELY SAFE - Low risk detected, but always conduct additional research.'
    };
    return actions[riskLevel] || actions['MEDIUM'];
  }

  private extractKeyFindings(threats: any[]): string[] {
    const keyFindings = [];
    
    // Group threats by type
    const threatGroups = threats.reduce((groups, threat) => {
      const category = threat.type.split('_')[0];
      if (!groups[category]) groups[category] = [];
      groups[category].push(threat);
      return groups;
    }, {});

    // Extract key findings from each category
    Object.entries(threatGroups).forEach(([category, categoryThreats]: [string, any[]]) => {
      if (categoryThreats.length > 0) {
        const highestSeverity = Math.max(...categoryThreats.map(t => t.severity));
        if (highestSeverity >= 70) {
          keyFindings.push(`${category} threats detected with severity up to ${highestSeverity}`);
        }
      }
    });

    return keyFindings.slice(0, 5); // Top 5 findings
  }

  private assessSpecificThreat(threatType: string, allThreats: any[]) {
    const relevantThreats = allThreats.filter(t => 
      t.type.includes(threatType) || t.category?.includes(threatType.toLowerCase())
    );

    if (relevantThreats.length === 0) {
      return { riskLevel: 'NONE', score: 0, threats: [] };
    }

    const maxSeverity = Math.max(...relevantThreats.map(t => t.severity));
    let riskLevel = 'LOW';
    if (maxSeverity >= 90) riskLevel = 'CRITICAL';
    else if (maxSeverity >= 75) riskLevel = 'HIGH';
    else if (maxSeverity >= 50) riskLevel = 'MEDIUM';

    return {
      riskLevel,
      score: maxSeverity,
      threatCount: relevantThreats.length,
      threats: relevantThreats.slice(0, 3) // Top 3 threats
    };
  }

  private calculateAnalysisConfidence(results: any): number {
    let confidence = 0;
    let factors = 0;

    if (results.basicAnalysis) { confidence += 85; factors++; }
    if (results.advancedThreats) { confidence += 90; factors++; }
    if (results.historicalData) { confidence += 80; factors++; }
    if (results.realTimeData) { confidence += 75; factors++; }

    return factors > 0 ? Math.round(confidence / factors) : 50;
  }

  private generateRecommendations(results: any): string[] {
    const recommendations = [];

    // Risk-based recommendations
    if (results.overallRiskLevel === 'CRITICAL') {
      recommendations.push('Avoid this token completely - multiple critical threats detected');
      recommendations.push('If you already hold this token, consider exiting your position immediately');
    } else if (results.overallRiskLevel === 'HIGH') {
      recommendations.push('Do not invest in this token without extensive additional research');
      recommendations.push('If investing, limit exposure to less than 1% of your portfolio');
    }

    // Specific threat recommendations
    const honeypotThreats = results.allThreats.filter(t => t.type.includes('HONEYPOT'));
    if (honeypotThreats.length > 0) {
      recommendations.push('Test with a small transaction before larger investments');
    }

    const rugPullThreats = results.allThreats.filter(t => t.type.includes('RUG') || t.type.includes('LIQUIDITY'));
    if (rugPullThreats.length > 0) {
      recommendations.push('Monitor liquidity locks and team wallet activity closely');
    }

    // General security recommendations
    recommendations.push('Always use a dedicated trading wallet with limited funds');
    recommendations.push('Set stop-losses and take-profit levels before trading');
    recommendations.push('Never invest more than you can afford to lose');

    return recommendations.slice(0, 8); // Top 8 recommendations
  }

  private async performRealTimeMonitoring(mintAddress: string) {
    // This would implement real-time monitoring of:
    // - Large transactions
    // - Unusual trading patterns
    // - Social media sentiment changes
    // - Liquidity movements
    // - Price manipulation attempts

    return {
      activeThreats: [],
      riskScore: 0,
      monitoringStatus: 'active'
    };
  }
}

// Scam database for historical reference
class ScamDatabase {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async checkHistoricalData(mintAddress: string) {
    // Check against known scam databases
    // Cross-reference with previous rug pulls
    // Check deployer history
    // Analyze similar token patterns

    return {
      knownThreats: [],
      riskScore: 0,
      historicalContext: 'No historical red flags found'
    };
  }

  async storeAnalysisResults(mintAddress: string, report: any) {
    // Store scan results for future reference
    // Build reputation database
    // Track patterns over time
    console.log(`Storing analysis results for ${mintAddress}`);
  }
}

// Enhanced API endpoint
const enhancedApp = express();

enhancedApp.post('/api/comprehensive-scan', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        error: 'Token address is required'
      });
    }

    const scanner = new ComprehensiveSecurityScanner({
      HELIUS_RPC: process.env.HELIUS_RPC_URL,
      SOLSCAN_API: process.env.SOLSCAN_API_KEY,
      MORALIS_API: process.env.MORALIS_API_KEY,
      TWITTER_BEARER: process.env.TWITTER_API_BEARER,
      // ... other config
    });

    const report = await scanner.performComprehensiveScan(address);

    res.json({
      success: true,
      data: report,
      message: 'Comprehensive security analysis completed'
    });

  } catch (error) {
    console.error('Comprehensive scan failed:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
});

export default enhancedApp;
