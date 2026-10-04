import { describe, it, expect } from 'vitest';
import { AnalyzeInputSchema, AnalysisOutputSchema, type CompleteAnalysisOutput } from '../AnalysisContract';

describe('AnalysisContract', () => {
  describe('AnalyzeInputSchema', () => {
    it('validates a valid payload', () => {
      const validText = 'a'.repeat(150);
      const res = AnalyzeInputSchema.safeParse({ jobText: validText, title: 'Engineer', company: 'Acme' });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.jobText).toBe(validText);
        expect(res.data.title).toBe('Engineer');
        expect(res.data.company).toBe('Acme');
      }
    });

    it('normalises CRLF to LF and trims jobText', () => {
      const input = ' \r\n ' + 'a'.repeat(100) + ' \r\n ';
      const res = AnalyzeInputSchema.safeParse({ jobText: input });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.jobText).toBe('a'.repeat(100));
      }
    });

    it('handles empty title and company as undefined', () => {
      const validText = 'a'.repeat(100);
      const res = AnalyzeInputSchema.safeParse({ jobText: validText, title: '', company: '   ' });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.title).toBeUndefined();
        expect(res.data.company).toBeUndefined();
      }
    });

    it('fails text boundary 99 chars', () => {
      const res = AnalyzeInputSchema.safeParse({ jobText: 'a'.repeat(99) });
      expect(res.success).toBe(false);
    });

    it('passes text boundary 100 chars', () => {
      const res = AnalyzeInputSchema.safeParse({ jobText: 'a'.repeat(100) });
      expect(res.success).toBe(true);
    });

    it('passes text boundary 5000 chars', () => {
      const res = AnalyzeInputSchema.safeParse({ jobText: 'a'.repeat(5000) });
      expect(res.success).toBe(true);
    });

    it('fails text boundary 5001 chars', () => {
      const res = AnalyzeInputSchema.safeParse({ jobText: 'a'.repeat(5001) });
      expect(res.success).toBe(false);
    });

    it('fails title limit 121 chars', () => {
      const validText = 'a'.repeat(100);
      const title = 'a'.repeat(121);
      const res = AnalyzeInputSchema.safeParse({ jobText: validText, title });
      expect(res.success).toBe(false);
    });

    it('passes title limit 120 chars', () => {
      const validText = 'a'.repeat(100);
      const title = 'a'.repeat(120);
      const res = AnalyzeInputSchema.safeParse({ jobText: validText, title });
      expect(res.success).toBe(true);
    });
  });

  describe('AnalysisOutputSchema', () => {
    const BASE_INPUT = {
      jobText: 'a'.repeat(100),
      charCount: 100,
      truncated: false,
    };

    const getValidComplete = (): CompleteAnalysisOutput => ({
      id: 'RS-1234-ABC',
      createdAt: new Date().toISOString(),
      mode: 'PREVIEW',
      input: structuredClone(BASE_INPUT),
      status: 'complete',
      trustScore: 85,
      band: 'likely-genuine',
      summary: 'Looks fine',
      modules: [],
      languageDetail: { flags: [] },
      provenance: { source: 'rules', generatedAt: new Date().toISOString() },
      disclaimer: 'Disclaimer text',
    });

    it('validates a processing payload', () => {
      const processing = { ...getValidComplete(), status: 'processing' as const };
      const res = AnalysisOutputSchema.safeParse(processing);
      expect(res.success).toBe(true);
    });

    it('validates an error payload', () => {
      const errorPayload = { ...getValidComplete(), status: 'error' as const, errorCode: 'TIMEOUT' };
      const res = AnalysisOutputSchema.safeParse(errorPayload);
      expect(res.success).toBe(true);
    });

    it('validates a complete payload', () => {
      const payload = getValidComplete();
      const res = AnalysisOutputSchema.safeParse(payload);
      expect(res.success).toBe(true);
    });

    it('validates ID format (RS-1234-ABC)', () => {
      const payload = getValidComplete();
      payload.id = 'invalid';
      let res = AnalysisOutputSchema.safeParse(payload);
      expect(res.success).toBe(false);

      payload.id = 'rs-1234-aBc'; // case insensitive based on regex 'i'
      res = AnalysisOutputSchema.safeParse(payload);
      expect(res.success).toBe(true);
    });

    it('cross-field rule: charCount equals jobText.length', () => {
      const payload = getValidComplete();
      payload.input.charCount = 99; // mismatch
      const res = AnalysisOutputSchema.safeParse(payload);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('charCount must equal jobText.length');
      }
    });

    it('cross-field rule: band matches getBandForScore', () => {
      const payload = getValidComplete();
      payload.band = 'high-risk'; // 85 should be likely-genuine
      const res = AnalysisOutputSchema.safeParse(payload);
      expect(res.success).toBe(false);
      if (!res.success) {
        // charCount and band may both fire; check any issue contains 'band must match'
        const messages = res.error.issues.map(i => i.message);
        expect(messages.some(m => m.includes('band must match'))).toBe(true);
      }
    });

    it('cross-field rule: confidence only allowed when provenance.source is model', () => {
      const makePayload = (source: 'rules' | 'model') => ({
        ...getValidComplete(),
        provenance: { source, generatedAt: new Date().toISOString() },
        languageDetail: {
          flags: [
            {
              id: '1', type: 'urgency', title: 'Urgency', severity: 'medium' as const, confidence: 0.8,
              description: 'desc', quote: 'a'.repeat(10), span: { start: 0, end: 10 },
            }
          ]
        },
      });

      // With 'rules' source + confidence flag => invalid
      const res1 = AnalysisOutputSchema.safeParse(makePayload('rules'));
      expect(res1.success).toBe(false);
      if (!res1.success) {
        const messages = res1.error.issues.map(i => i.message);
        expect(messages.some(m => m.includes('confidence is only allowed'))).toBe(true);
      }

      // With 'model' source + confidence flag => valid
      const res2 = AnalysisOutputSchema.safeParse(makePayload('model'));
      if (!res2.success) console.error(JSON.stringify(res2.error.issues, null, 2));
      expect(res2.success).toBe(true);
    });

    it('cross-field rule: span bounds are valid', () => {
      // text is 100 a's; build a fresh complete payload for each check
      const makePayload = (start: number, end: number) => ({
        ...getValidComplete(),
        languageDetail: {
          flags: [{
            id: '1', type: 'urgency', title: 'Urgency', severity: 'medium' as const,
            description: 'desc',
            quote: 'a'.repeat(Math.max(0, end - start)),
            span: { start, end },
          }]
        }
      });

      // Valid: 0..100 (inclusive of jobText boundary)
      const res1 = AnalysisOutputSchema.safeParse(makePayload(0, 100));
      if (!res1.success) console.error(JSON.stringify(res1.error.issues, null, 2));
      expect(res1.success).toBe(true);

      // Invalid: start < 0 (Zod min(0) on start field)
      expect(AnalysisOutputSchema.safeParse(makePayload(-1, 10)).success).toBe(false);

      // Invalid: start >= end (superRefine)
      expect(AnalysisOutputSchema.safeParse(makePayload(10, 10)).success).toBe(false);

      // Invalid: end > jobText.length (100)
      expect(AnalysisOutputSchema.safeParse(makePayload(90, 101)).success).toBe(false);
    });
  });
});
