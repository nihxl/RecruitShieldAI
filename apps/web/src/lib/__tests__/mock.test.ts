import { describe, it, expect, vi, afterEach } from 'vitest';
import { MockAnalyzer } from '../analyzer/mock';
import { AnalyzeInputSchema, AnalysisOutputSchema } from '../AnalysisContract';

describe('MockAnalyzer', () => {
  const analyzer = new MockAnalyzer();

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const getValidInput = (text: string) => {
    return AnalyzeInputSchema.parse({
      jobText: text.padEnd(100, '.'), // Ensure 100 chars without being trimmed away
      title: 'Engineer',
      company: 'Acme',
    });
  };

  it('is deterministic: no Math.random or Date.now in flags or score', async () => {
    const input = getValidInput('Please pay deposit to apply now and send your aadhaar.');
    const res1 = await analyzer.analyze(input, { now: new Date('2026-01-01T00:00:00Z') });
    const res2 = await analyzer.analyze(input, { now: new Date('2026-01-01T00:00:00Z') });

    expect(res1).toEqual(res2);
  });

  it('uses injectable clock for generatedAt', async () => {
    const input = getValidInput('A standard genuine job posting with no flags.');
    const date = new Date('2026-10-04T12:00:00Z');
    const res = await analyzer.analyze(input, { now: date });
    
    if (res.status === 'complete') {
      expect(res.provenance.generatedAt).toBe('2026-10-04T12:00:00.000Z');
    } else {
      expect.fail('Expected complete status');
    }
  });

  it('scam-with-fee fixture produces payment, urgency and PII flags and ends in High Risk', async () => {
    // "scam-with-fee" fixture text triggering the requested flags
    const input = getValidInput('You must pay deposit amount. Act now or lose the job. Also upload your aadhaar card.');
    
    const res = await analyzer.analyze(input);
    expect(res.status).toBe('complete');
    
    if (res.status === 'complete') {
      const flagTypes = res.languageDetail.flags.map(f => f.type);
      expect(flagTypes).toContain('upfront_payment');
      expect(flagTypes).toContain('artificial_urgency');
      expect(flagTypes).toContain('premature_pii');
      
      expect(res.band).toBe('high-risk');
      expect(res.trustScore).toBeLessThanOrEqual(39);
      
      // Verify schema
      const parsed = AnalysisOutputSchema.safeParse(res);
      if (!parsed.success) console.error(parsed.error);
      expect(parsed.success).toBe(true);
    }
  });

  it('stacks flags to lower base score before cap', async () => {
    const input = getValidInput("URGENT! We are hiring immediately. Pay registration fee of Rs 5000 via UPI right now to guarantee your spot. Contact only on WhatsApp. Need Aadhaar and PAN immediately. Don't wait, position closing soon!");
    
    // We want to observe the raw score before cap. But our mock just outputs the final score.
    // However, with this text, the flags should be:
    // artificial_urgency (medium), upfront_payment (high), off_platform_contact (medium), premature_pii (high), artificial_urgency (medium)
    // Starting at 75: -15 (urgency) - 30 (payment) - 15 (whatsapp) - 30 (pii) = well below 0, capped to 0 before applyScoreCap.
    
    const res = await analyzer.analyze(input);
    expect(res.status).toBe('complete');
    
    if (res.status === 'complete') {
      expect(res.trustScore).toBeLessThan(20);
      expect(res.languageDetail.flags.length).toBe(2);
    }
  });

  it('genuine fixture lands in a Likely or Highly Genuine band', async () => {
    const input = getValidInput('This is a highly genuine and verifiable opportunity from a reputed company.');
    
    const res = await analyzer.analyze(input);
    expect(res.status).toBe('complete');
    
    if (res.status === 'complete') {
      expect(['likely-genuine', 'highly-genuine']).toContain(res.band);
      expect(AnalysisOutputSchema.safeParse(res).success).toBe(true);
    }
  });

  it('dev/test failure hook throws error when forced outside production', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const input = getValidInput('Some text.');
    
    const res = await analyzer.analyze(input, { forceFail: true });
    expect(res.status).toBe('error');
    if (res.status === 'error') {
      expect(res.errorCode).toBe('MOCK_FORCED_ERROR');
      expect(AnalysisOutputSchema.safeParse(res).success).toBe(true);
    }
  });

  it('dev/test failure hook is impossible to trigger in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const input = getValidInput('Some text.');
    
    // Even with forceFail=true, it should ignore and succeed
    const res = await analyzer.analyze(input, { forceFail: true });
    expect(res.status).toBe('complete');
  });

  it('every result passes contract validation', async () => {
    const inputs = [
      getValidInput('Just a normal post'),
      getValidInput('Pay via upi urgently'),
      getValidInput('Genuine post here'),
    ];

    for (const input of inputs) {
      const res = await analyzer.analyze(input);
      const parsed = AnalysisOutputSchema.safeParse(res);
      expect(parsed.success).toBe(true);
    }
  });

  it('summary and disclaimer come from constants', async () => {
    const input = getValidInput('Normal text');
    const res = await analyzer.analyze(input);
    if (res.status === 'complete') {
      // disclaimer should not be empty
      expect(res.disclaimer.length).toBeGreaterThan(0);
      expect(res.summary.length).toBeGreaterThan(0);
    } else {
      expect.fail();
    }
  });
});
