import { describe, it, expect } from 'vitest';
import { AnalyzeInputSchema, AnalysisOutputSchema, type CompleteAnalysisOutput, type LanguageFlag } from '../AnalysisContract';

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
    const validBaseInput = {
      jobText: 'a'.repeat(100),
      charCount: 100,
      truncated: false,
    };

    const getValidComplete = (): CompleteAnalysisOutput => ({
      id: 'RS-1234-ABC',
      createdAt: new Date().toISOString(),
      mode: 'PREVIEW',
      input: {
        jobText: 'a'.repeat(100),
        charCount: 100,
        truncated: false,
      },
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
      const processing = getValidComplete();
      (processing as any).status = 'processing';
      const res = AnalysisOutputSchema.safeParse(processing);
      expect(res.success).toBe(true);
    });

    it('validates an error payload', () => {
      const errorPayload = getValidComplete();
      (errorPayload as any).status = 'error';
      (errorPayload as any).errorCode = 'TIMEOUT';
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
        expect(res.error.issues[0].message).toContain('band must match');
      }
    });

    it('cross-field rule: confidence only allowed when provenance.source is model', () => {
      const payload = getValidComplete();
      payload.provenance.source = 'rules';
      payload.languageDetail.flags = [
        {
          id: '1', type: 'urgency', title: 'Urgency', severity: 'medium', confidence: 0.8,
          description: 'desc', quote: 'quote', span: { start: 0, end: 10 }
        }
      ];
      let res = AnalysisOutputSchema.safeParse(payload);
      expect(res.success).toBe(false);

      // Change to model
      payload.provenance.source = 'model';
      res = AnalysisOutputSchema.safeParse(payload);
      expect(res.success).toBe(true);
    });

    it('cross-field rule: span bounds are valid', () => {
      const payload = getValidComplete();
      
      const createFlagWithSpan = (start: number, end: number): LanguageFlag => ({
        id: '1', type: 'urgency', title: 'Urgency', severity: 'medium',
        description: 'desc', quote: 'quote', span: { start, end }
      });

      // Valid: 0 to length
      payload.languageDetail.flags = [createFlagWithSpan(0, 100)];
      const res1 = AnalysisOutputSchema.safeParse(payload);
      if (!res1.success) console.error(res1.error);
      expect(res1.success).toBe(true);

      // Invalid: start < 0
      payload.languageDetail.flags = [createFlagWithSpan(-1, 10)];
      expect(AnalysisOutputSchema.safeParse(payload).success).toBe(false);

      // Invalid: start >= end
      payload.languageDetail.flags = [createFlagWithSpan(10, 10)];
      expect(AnalysisOutputSchema.safeParse(payload).success).toBe(false);

      // Invalid: end > length
      payload.languageDetail.flags = [createFlagWithSpan(90, 101)];
      expect(AnalysisOutputSchema.safeParse(payload).success).toBe(false);
    });
  });
});
