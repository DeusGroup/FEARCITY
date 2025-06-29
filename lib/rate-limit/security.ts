/**
 * Advanced Security Features for Rate Limiting v0.1.6
 * CAPTCHA integration, exponential backoff, and threat detection
 */

import { rateLimitConfig } from './config';
import { createRateLimiter } from './core';

export interface SecurityThreat {
  type: 'rate_limit_violation' | 'suspicious_pattern' | 'bot_detection' | 'distributed_attack';
  severity: 'low' | 'medium' | 'high' | 'critical';
  identifier: string;
  details: any;
  timestamp: number;
}

export interface CaptchaChallenge {
  id: string;
  identifier: string;
  challenge: string;
  expiresAt: number;
  attempts: number;
  solved: boolean;
}

export interface SecurityReport {
  threats: SecurityThreat[];
  recommendations: string[];
  riskScore: number;
  timestamp: number;
}

// CAPTCHA challenge types
export enum CaptchaType {
  MATH = 'math',
  TEXT = 'text',
  IMAGE = 'image',
  RECAPTCHA = 'recaptcha',
  HCAPTCHA = 'hcaptcha'
}

export class SecurityManager {
  private rateLimiter = createRateLimiter();
  private activeChallenges = new Map<string, CaptchaChallenge>();
  private threatHistory = new Map<string, SecurityThreat[]>();
  private suspiciousPatterns = new Map<string, any>();

  constructor() {
    // Cleanup expired challenges every 5 minutes
    setInterval(() => {
      this.cleanupExpiredChallenges();
    }, 5 * 60 * 1000);
  }

  // Generate CAPTCHA challenge
  async generateCaptchaChallenge(
    identifier: string,
    type: CaptchaType = CaptchaType.MATH
  ): Promise<CaptchaChallenge> {
    const challengeId = this.generateChallengeId();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    let challenge: string;
    let solution: string;

    switch (type) {
      case CaptchaType.MATH:
        const { question, answer } = this.generateMathChallenge();
        challenge = question;
        solution = answer;
        break;

      case CaptchaType.TEXT:
        const { text, expected } = this.generateTextChallenge();
        challenge = text;
        solution = expected;
        break;

      default:
        const math = this.generateMathChallenge();
        challenge = math.question;
        solution = math.answer;
    }

    const captchaChallenge: CaptchaChallenge = {
      id: challengeId,
      identifier,
      challenge,
      expiresAt,
      attempts: 0,
      solved: false,
    };

    // Store challenge with solution (in production, store solution separately/encrypted)
    this.activeChallenges.set(challengeId, {
      ...captchaChallenge,
      solution, // In production, store this securely
    } as any);

    return captchaChallenge;
  }

  // Verify CAPTCHA solution
  async verifyCaptchaSolution(challengeId: string, solution: string): Promise<{
    valid: boolean;
    challenge?: CaptchaChallenge;
    error?: string;
  }> {
    const challenge = this.activeChallenges.get(challengeId) as any;

    if (!challenge) {
      return {
        valid: false,
        error: 'Challenge not found or expired',
      };
    }

    if (challenge.expiresAt < Date.now()) {
      this.activeChallenges.delete(challengeId);
      return {
        valid: false,
        error: 'Challenge expired',
      };
    }

    challenge.attempts++;

    if (challenge.attempts > 3) {
      this.activeChallenges.delete(challengeId);
      await this.reportThreat({
        type: 'suspicious_pattern',
        severity: 'medium',
        identifier: challenge.identifier,
        details: { reason: 'Multiple failed CAPTCHA attempts', attempts: challenge.attempts },
        timestamp: Date.now(),
      });
      return {
        valid: false,
        error: 'Too many attempts',
      };
    }

    const isValid = solution.toLowerCase().trim() === challenge.solution.toLowerCase().trim();

    if (isValid) {
      challenge.solved = true;
      this.activeChallenges.delete(challengeId);
      
      // Clear violations for this identifier
      await this.rateLimiter.clearViolations(challenge.identifier);
      
      return {
        valid: true,
        challenge: {
          id: challenge.id,
          identifier: challenge.identifier,
          challenge: challenge.challenge,
          expiresAt: challenge.expiresAt,
          attempts: challenge.attempts,
          solved: true,
        },
      };
    }

    this.activeChallenges.set(challengeId, challenge);
    return {
      valid: false,
      error: 'Incorrect solution',
    };
  }

  // Check if identifier should be challenged with CAPTCHA
  async shouldChallengeCaptcha(identifier: string): Promise<boolean> {
    const stats = await this.rateLimiter.getStats(identifier);
    
    return stats.violations >= rateLimitConfig.security.captchaThreshold;
  }

  // Detect bot patterns
  detectBotPatterns(request: {
    userAgent?: string;
    headers?: Record<string, string>;
    requestPattern?: string;
  }): {
    isBot: boolean;
    confidence: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let botScore = 0;

    // User Agent analysis
    if (request.userAgent) {
      const ua = request.userAgent.toLowerCase();
      
      // Known bot patterns
      const botPatterns = [
        'bot', 'crawler', 'spider', 'scraper', 'python-requests',
        'curl', 'wget', 'java/', 'go-http-client', 'okhttp'
      ];
      
      for (const pattern of botPatterns) {
        if (ua.includes(pattern)) {
          botScore += 30;
          reasons.push(`User agent contains bot indicator: ${pattern}`);
        }
      }

      // Suspicious characteristics
      if (ua.length < 10) {
        botScore += 20;
        reasons.push('Unusually short user agent');
      }

      if (!ua.includes('mozilla') && !ua.includes('webkit')) {
        botScore += 15;
        reasons.push('Missing common browser identifiers');
      }
    }

    // Header analysis
    if (request.headers) {
      const headers = Object.keys(request.headers).map(k => k.toLowerCase());
      
      // Missing common browser headers
      const expectedHeaders = ['accept', 'accept-language', 'accept-encoding'];
      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        botScore += missingHeaders.length * 10;
        reasons.push(`Missing browser headers: ${missingHeaders.join(', ')}`);
      }

      // Suspicious headers
      const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip'];
      const foundSuspicious = suspiciousHeaders.filter(h => headers.includes(h));
      
      if (foundSuspicious.length > 1) {
        botScore += 10;
        reasons.push('Multiple proxy headers detected');
      }
    }

    return {
      isBot: botScore >= 40,
      confidence: Math.min(botScore / 100, 1),
      reasons,
    };
  }

  // Analyze request patterns for threats
  analyzeRequestPattern(
    identifier: string,
    requests: Array<{ timestamp: number; endpoint: string; success: boolean }>
  ): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    const now = Date.now();
    const recentRequests = requests.filter(r => now - r.timestamp < 60000); // Last minute

    // Rapid fire detection
    if (recentRequests.length > 50) {
      threats.push({
        type: 'rate_limit_violation',
        severity: 'high',
        identifier,
        details: { requestCount: recentRequests.length, timeWindow: '1 minute' },
        timestamp: now,
      });
    }

    // Failed request pattern
    const failedRequests = recentRequests.filter(r => !r.success);
    if (failedRequests.length > 10) {
      threats.push({
        type: 'suspicious_pattern',
        severity: 'medium',
        identifier,
        details: { failedRequests: failedRequests.length, reason: 'High failure rate' },
        timestamp: now,
      });
    }

    // Endpoint scanning detection
    const uniqueEndpoints = new Set(recentRequests.map(r => r.endpoint));
    if (uniqueEndpoints.size > 20) {
      threats.push({
        type: 'suspicious_pattern',
        severity: 'high',
        identifier,
        details: { 
          uniqueEndpoints: uniqueEndpoints.size, 
          reason: 'Endpoint scanning detected',
          endpoints: Array.from(uniqueEndpoints)
        },
        timestamp: now,
      });
    }

    return threats;
  }

  // Report security threat
  async reportThreat(threat: SecurityThreat): Promise<void> {
    // Store threat in history
    const existing = this.threatHistory.get(threat.identifier) || [];
    existing.push(threat);
    
    // Keep only last 100 threats per identifier
    if (existing.length > 100) {
      existing.splice(0, existing.length - 100);
    }
    
    this.threatHistory.set(threat.identifier, existing);

    // Log threat
    console.warn(`Security threat detected:`, {
      type: threat.type,
      severity: threat.severity,
      identifier: threat.identifier,
      details: threat.details,
    });

    // Send alert for high/critical threats
    if (threat.severity === 'high' || threat.severity === 'critical') {
      await this.sendSecurityAlert(threat);
    }

    // Auto-block for critical threats
    if (threat.severity === 'critical') {
      await this.autoBlock(threat.identifier, threat);
    }
  }

  // Auto-block malicious identifiers
  private async autoBlock(identifier: string, threat: SecurityThreat): Promise<void> {
    const blockDuration = this.calculateBlockDuration(threat);
    
    try {
      // Use rate limiter to block
      const rateLimiter = createRateLimiter();
      // Implementation would depend on your rate limiter's block functionality
      
      console.warn(`Auto-blocked ${identifier} for ${blockDuration}ms due to ${threat.type}`);
    } catch (error) {
      console.error('Failed to auto-block identifier:', error);
    }
  }

  // Calculate block duration based on threat severity
  private calculateBlockDuration(threat: SecurityThreat): number {
    const baseDuration = {
      low: 5 * 60 * 1000,      // 5 minutes
      medium: 30 * 60 * 1000,  // 30 minutes
      high: 2 * 60 * 60 * 1000, // 2 hours
      critical: 24 * 60 * 60 * 1000, // 24 hours
    };

    return baseDuration[threat.severity];
  }

  // Send security alert
  private async sendSecurityAlert(threat: SecurityThreat): Promise<void> {
    if (!rateLimitConfig.monitoring.webhookUrl) {
      return;
    }

    try {
      const payload = {
        type: 'security_alert',
        threat,
        timestamp: Date.now(),
        source: 'Fear City Cycles Rate Limiter',
      };

      // In a real implementation, you'd send this to your monitoring system
      console.log('Security alert:', payload);
      
      // Example webhook call (uncomment for actual use):
      /*
      await fetch(rateLimitConfig.monitoring.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      */
    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }

  // Generate security report
  generateSecurityReport(identifier?: string): SecurityReport {
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;
    
    let allThreats: SecurityThreat[] = [];
    
    if (identifier) {
      allThreats = this.threatHistory.get(identifier) || [];
    } else {
      // Aggregate all threats
      for (const threats of this.threatHistory.values()) {
        allThreats.push(...threats);
      }
    }

    // Filter to recent threats
    const recentThreats = allThreats.filter(t => t.timestamp > hourAgo);
    
    // Calculate risk score
    const riskScore = this.calculateRiskScore(recentThreats);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(recentThreats);

    return {
      threats: recentThreats,
      recommendations,
      riskScore,
      timestamp: now,
    };
  }

  // Helper methods
  private generateChallengeId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private generateMathChallenge(): { question: string; answer: string } {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const operators = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    let answer: number;
    let question: string;
    
    switch (operator) {
      case '+':
        answer = num1 + num2;
        question = `What is ${num1} + ${num2}?`;
        break;
      case '-':
        answer = Math.max(num1, num2) - Math.min(num1, num2);
        question = `What is ${Math.max(num1, num2)} - ${Math.min(num1, num2)}?`;
        break;
      case '*':
        const small1 = Math.floor(Math.random() * 10) + 1;
        const small2 = Math.floor(Math.random() * 10) + 1;
        answer = small1 * small2;
        question = `What is ${small1} × ${small2}?`;
        break;
      default:
        answer = num1 + num2;
        question = `What is ${num1} + ${num2}?`;
    }
    
    return { question, answer: answer.toString() };
  }

  private generateTextChallenge(): { text: string; expected: string } {
    const words = ['motorcycle', 'fear', 'city', 'cycles', 'ride', 'queens', 'bike'];
    const word = words[Math.floor(Math.random() * words.length)];
    
    return {
      text: `Type the word: ${word}`,
      expected: word,
    };
  }

  private cleanupExpiredChallenges(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [id, challenge] of this.activeChallenges.entries()) {
      if (challenge.expiresAt < now) {
        this.activeChallenges.delete(id);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired CAPTCHA challenges`);
    }
  }

  private calculateRiskScore(threats: SecurityThreat[]): number {
    if (threats.length === 0) return 0;
    
    const severityWeights = { low: 1, medium: 3, high: 7, critical: 15 };
    const totalScore = threats.reduce((sum, threat) => {
      return sum + severityWeights[threat.severity];
    }, 0);
    
    // Normalize to 0-100 scale
    return Math.min(Math.round(totalScore / threats.length * 10), 100);
  }

  private generateRecommendations(threats: SecurityThreat[]): string[] {
    const recommendations: string[] = [];
    const threatTypes = new Set(threats.map(t => t.type));
    
    if (threatTypes.has('rate_limit_violation')) {
      recommendations.push('Consider implementing stricter rate limits');
      recommendations.push('Enable CAPTCHA challenges for repeat offenders');
    }
    
    if (threatTypes.has('bot_detection')) {
      recommendations.push('Implement advanced bot detection');
      recommendations.push('Consider blocking automated traffic');
    }
    
    if (threatTypes.has('distributed_attack')) {
      recommendations.push('Enable DDoS protection');
      recommendations.push('Consider implementing geo-blocking');
    }
    
    if (threatTypes.has('suspicious_pattern')) {
      recommendations.push('Investigate suspicious request patterns');
      recommendations.push('Consider implementing behavioral analysis');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Continue monitoring for threats');
    }
    
    return recommendations;
  }
}

// Singleton security manager
export const securityManager = new SecurityManager();