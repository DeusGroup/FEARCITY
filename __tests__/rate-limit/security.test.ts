/**
 * Security Features Tests v0.1.6
 * Tests for CAPTCHA, threat detection, and security features
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SecurityManager, CaptchaType, SecurityThreat } from '../../lib/rate-limit/security';

describe('SecurityManager', () => {
  let securityManager: SecurityManager;

  beforeEach(() => {
    securityManager = new SecurityManager();
  });

  describe('CAPTCHA Challenge Generation', () => {
    it('should generate math CAPTCHA challenge', async () => {
      const challenge = await securityManager.generateCaptchaChallenge(
        'test-identifier',
        CaptchaType.MATH
      );

      expect(challenge.id).toBeDefined();
      expect(challenge.identifier).toBe('test-identifier');
      expect(challenge.challenge).toMatch(/What is \d+ [\+\-×] \d+\?/);
      expect(challenge.expiresAt).toBeGreaterThan(Date.now());
      expect(challenge.attempts).toBe(0);
      expect(challenge.solved).toBe(false);
    });

    it('should generate text CAPTCHA challenge', async () => {
      const challenge = await securityManager.generateCaptchaChallenge(
        'test-identifier',
        CaptchaType.TEXT
      );

      expect(challenge.challenge).toMatch(/Type the word: \w+/);
    });

    it('should generate unique challenge IDs', async () => {
      const challenge1 = await securityManager.generateCaptchaChallenge('test-1');
      const challenge2 = await securityManager.generateCaptchaChallenge('test-2');

      expect(challenge1.id).not.toBe(challenge2.id);
    });
  });

  describe('CAPTCHA Solution Verification', () => {
    it('should verify correct math solution', async () => {
      const challenge = await securityManager.generateCaptchaChallenge(
        'test-identifier',
        CaptchaType.MATH
      );

      // Extract the math problem from the challenge
      const match = challenge.challenge.match(/What is (\d+) ([\+\-×]) (\d+)\?/);
      expect(match).not.toBeNull();

      const num1 = parseInt(match![1]);
      const operator = match![2];
      const num2 = parseInt(match![3]);

      let expectedAnswer: number;
      switch (operator) {
        case '+':
          expectedAnswer = num1 + num2;
          break;
        case '-':
          expectedAnswer = Math.max(num1, num2) - Math.min(num1, num2);
          break;
        case '×':
          expectedAnswer = num1 * num2;
          break;
        default:
          expectedAnswer = num1 + num2;
      }

      const result = await securityManager.verifyCaptchaSolution(
        challenge.id,
        expectedAnswer.toString()
      );

      expect(result.valid).toBe(true);
      expect(result.challenge?.solved).toBe(true);
    });

    it('should reject incorrect solution', async () => {
      const challenge = await securityManager.generateCaptchaChallenge(
        'test-identifier',
        CaptchaType.MATH
      );

      const result = await securityManager.verifyCaptchaSolution(
        challenge.id,
        'wrong-answer'
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject non-existent challenge', async () => {
      const result = await securityManager.verifyCaptchaSolution(
        'non-existent-id',
        'any-answer'
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Challenge not found or expired');
    });

    it('should limit attempt count', async () => {
      const challenge = await securityManager.generateCaptchaChallenge(
        'test-identifier',
        CaptchaType.MATH
      );

      // Make multiple incorrect attempts
      for (let i = 0; i < 3; i++) {
        const result = await securityManager.verifyCaptchaSolution(
          challenge.id,
          'wrong-answer'
        );
        expect(result.valid).toBe(false);
      }

      // Fourth attempt should be rejected due to too many attempts
      const result = await securityManager.verifyCaptchaSolution(
        challenge.id,
        'wrong-answer'
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Too many attempts');
    });

    it('should handle expired challenges', async () => {
      const challenge = await securityManager.generateCaptchaChallenge(
        'test-identifier',
        CaptchaType.MATH
      );

      // Manually expire the challenge
      const activeChallenges = (securityManager as any).activeChallenges;
      const challengeData = activeChallenges.get(challenge.id);
      challengeData.expiresAt = Date.now() - 1000; // Expired 1 second ago

      const result = await securityManager.verifyCaptchaSolution(
        challenge.id,
        'any-answer'
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Challenge expired');
    });
  });

  describe('Bot Detection', () => {
    it('should detect bot user agents', () => {
      const testCases = [
        { userAgent: 'curl/7.68.0', isBot: true },
        { userAgent: 'python-requests/2.25.1', isBot: true },
        { userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1)', isBot: true },
        { userAgent: 'Scrapy/2.5.0', isBot: true },
        { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', isBot: false },
        { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1)', isBot: false },
      ];

      testCases.forEach(({ userAgent, isBot }) => {
        const result = securityManager.detectBotPatterns({ userAgent });
        expect(result.isBot).toBe(isBot);
        
        if (isBot) {
          expect(result.confidence).toBeGreaterThan(0.3);
          expect(result.reasons.length).toBeGreaterThan(0);
        }
      });
    });

    it('should detect suspicious header patterns', () => {
      const suspiciousHeaders = {
        'x-forwarded-for': '1.2.3.4, 5.6.7.8',
        'x-real-ip': '9.10.11.12',
      };

      const result = securityManager.detectBotPatterns({
        headers: suspiciousHeaders,
      });

      expect(result.reasons).toContain('Multiple proxy headers detected');
    });

    it('should detect missing browser headers', () => {
      const minimalHeaders = {
        'host': 'example.com',
      };

      const result = securityManager.detectBotPatterns({
        headers: minimalHeaders,
      });

      expect(result.reasons.some(reason => 
        reason.includes('Missing browser headers')
      )).toBe(true);
    });
  });

  describe('Request Pattern Analysis', () => {
    it('should detect rapid fire attacks', () => {
      const requests = Array(60).fill(0).map((_, i) => ({
        timestamp: Date.now() - i * 500, // 60 requests in 30 seconds
        endpoint: '/api/test',
        success: true,
      }));

      const threats = securityManager.analyzeRequestPattern(
        'test-identifier',
        requests
      );

      const rapidFireThreat = threats.find(t => t.type === 'rate_limit_violation');
      expect(rapidFireThreat).toBeDefined();
      expect(rapidFireThreat?.severity).toBe('high');
    });

    it('should detect high failure rates', () => {
      const requests = Array(15).fill(0).map((_, i) => ({
        timestamp: Date.now() - i * 1000,
        endpoint: '/api/test',
        success: false, // All failed requests
      }));

      const threats = securityManager.analyzeRequestPattern(
        'test-identifier',
        requests
      );

      const failureThreat = threats.find(t => 
        t.type === 'suspicious_pattern' && 
        t.details.reason === 'High failure rate'
      );
      expect(failureThreat).toBeDefined();
    });

    it('should detect endpoint scanning', () => {
      const endpoints = Array(25).fill(0).map((_, i) => `/api/endpoint-${i}`);
      const requests = endpoints.map((endpoint, i) => ({
        timestamp: Date.now() - i * 100,
        endpoint,
        success: true,
      }));

      const threats = securityManager.analyzeRequestPattern(
        'test-identifier',
        requests
      );

      const scanningThreat = threats.find(t => 
        t.type === 'suspicious_pattern' && 
        t.details.reason === 'Endpoint scanning detected'
      );
      expect(scanningThreat).toBeDefined();
      expect(scanningThreat?.severity).toBe('high');
    });
  });

  describe('Threat Reporting', () => {
    it('should store threat history', async () => {
      const threat: SecurityThreat = {
        type: 'rate_limit_violation',
        severity: 'high',
        identifier: 'test-identifier',
        details: { reason: 'Test threat' },
        timestamp: Date.now(),
      };

      await securityManager.reportThreat(threat);

      const report = securityManager.generateSecurityReport('test-identifier');
      expect(report.threats).toContainEqual(threat);
    });

    it('should limit threat history per identifier', async () => {
      const identifier = 'test-identifier';

      // Generate more than 100 threats
      for (let i = 0; i < 150; i++) {
        const threat: SecurityThreat = {
          type: 'rate_limit_violation',
          severity: 'low',
          identifier,
          details: { index: i },
          timestamp: Date.now() - i * 1000,
        };

        await securityManager.reportThreat(threat);
      }

      const threatHistory = (securityManager as any).threatHistory.get(identifier);
      expect(threatHistory.length).toBeLessThanOrEqual(100);
    });

    it('should calculate risk scores correctly', () => {
      const threats: SecurityThreat[] = [
        {
          type: 'rate_limit_violation',
          severity: 'critical',
          identifier: 'test',
          details: {},
          timestamp: Date.now(),
        },
        {
          type: 'suspicious_pattern',
          severity: 'high',
          identifier: 'test',
          details: {},
          timestamp: Date.now(),
        },
        {
          type: 'bot_detection',
          severity: 'medium',
          identifier: 'test',
          details: {},
          timestamp: Date.now(),
        },
      ];

      // Mock the threats in the security manager
      (securityManager as any).threatHistory.set('test', threats);

      const report = securityManager.generateSecurityReport('test');
      expect(report.riskScore).toBeGreaterThan(0);
      expect(report.riskScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Security Report Generation', () => {
    it('should generate comprehensive security report', async () => {
      const identifier = 'test-identifier';
      
      // Generate various threats
      const threats: SecurityThreat[] = [
        {
          type: 'rate_limit_violation',
          severity: 'high',
          identifier,
          details: { reason: 'Too many requests' },
          timestamp: Date.now() - 30000,
        },
        {
          type: 'bot_detection',
          severity: 'medium',
          identifier,
          details: { reason: 'Suspicious user agent' },
          timestamp: Date.now() - 20000,
        },
      ];

      for (const threat of threats) {
        await securityManager.reportThreat(threat);
      }

      const report = securityManager.generateSecurityReport(identifier);

      expect(report.threats.length).toBe(2);
      expect(report.riskScore).toBeGreaterThan(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.timestamp).toBeDefined();
    });

    it('should generate global security report', async () => {
      // Generate threats for multiple identifiers
      const identifiers = ['user-1', 'user-2', 'user-3'];
      
      for (const identifier of identifiers) {
        const threat: SecurityThreat = {
          type: 'rate_limit_violation',
          severity: 'medium',
          identifier,
          details: {},
          timestamp: Date.now() - Math.random() * 60000,
        };

        await securityManager.reportThreat(threat);
      }

      const report = securityManager.generateSecurityReport(); // No identifier = global
      expect(report.threats.length).toBe(3);
    });

    it('should filter recent threats only', async () => {
      const identifier = 'test-identifier';
      
      const oldThreat: SecurityThreat = {
        type: 'rate_limit_violation',
        severity: 'high',
        identifier,
        details: {},
        timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      };

      const recentThreat: SecurityThreat = {
        type: 'suspicious_pattern',
        severity: 'medium',
        identifier,
        details: {},
        timestamp: Date.now() - 30000, // 30 seconds ago
      };

      await securityManager.reportThreat(oldThreat);
      await securityManager.reportThreat(recentThreat);

      const report = securityManager.generateSecurityReport(identifier);
      
      // Should only include recent threat (within 1 hour)
      expect(report.threats.length).toBe(1);
      expect(report.threats[0]).toEqual(recentThreat);
    });

    it('should generate appropriate recommendations', async () => {
      const testCases = [
        {
          threatType: 'rate_limit_violation',
          expectedRecommendations: ['stricter rate limits', 'CAPTCHA challenges'],
        },
        {
          threatType: 'bot_detection',
          expectedRecommendations: ['advanced bot detection', 'blocking automated traffic'],
        },
        {
          threatType: 'distributed_attack',
          expectedRecommendations: ['DDoS protection', 'geo-blocking'],
        },
      ];

      for (const testCase of testCases) {
        const threat: SecurityThreat = {
          type: testCase.threatType as any,
          severity: 'high',
          identifier: 'test',
          details: {},
          timestamp: Date.now(),
        };

        await securityManager.reportThreat(threat);
        const report = securityManager.generateSecurityReport('test');

        testCase.expectedRecommendations.forEach(expectedRec => {
          expect(
            report.recommendations.some(rec => 
              rec.toLowerCase().includes(expectedRec.toLowerCase())
            )
          ).toBe(true);
        });

        // Clear for next test
        (securityManager as any).threatHistory.delete('test');
      }
    });
  });

  describe('CAPTCHA Threshold Detection', () => {
    it('should require CAPTCHA after threshold violations', async () => {
      const identifier = 'test-identifier';
      
      // Mock the rate limiter to return violations above threshold
      const mockStats = { violations: 15 }; // Above captchaThreshold of 10
      jest.spyOn(securityManager as any, 'rateLimiter', 'get').mockReturnValue({
        getStats: jest.fn().mockResolvedValue(mockStats),
      });

      const shouldChallenge = await securityManager.shouldChallengeCaptcha(identifier);
      expect(shouldChallenge).toBe(true);
    });

    it('should not require CAPTCHA below threshold', async () => {
      const identifier = 'test-identifier';
      
      const mockStats = { violations: 5 }; // Below captchaThreshold of 10
      jest.spyOn(securityManager as any, 'rateLimiter', 'get').mockReturnValue({
        getStats: jest.fn().mockResolvedValue(mockStats),
      });

      const shouldChallenge = await securityManager.shouldChallengeCaptcha(identifier);
      expect(shouldChallenge).toBe(false);
    });
  });
});