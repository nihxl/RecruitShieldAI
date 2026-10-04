import { describe, it, expect } from 'vitest';
import { extractFlags, applyScoreCap } from '../rules';

describe('rules engine', () => {
  describe('extractFlags', () => {
    it('never includes confidence', () => {
      const flags = extractFlags('pay via upi');
      expect(flags.length).toBeGreaterThan(0);
      flags.forEach(f => {
        expect(f).not.toHaveProperty('confidence');
      });
    });

    it('slice(start, end) matches quote perfectly', () => {
      const cases = [
        'Please pay via upi to proceed.',
        'Send your aadhaar for verification.',
        'Contact me only on whatsapp for details.',
        'This job requires a laptop fee.',
      ];

      cases.forEach(text => {
        const flags = extractFlags(text);
        expect(flags.length).toBeGreaterThan(0);
        flags.forEach(f => {
          expect(text.slice(f.span.start, f.span.end)).toBe(f.quote);
        });
      });
    });

    it('handles negation: "no registration fee" does not raise upfront_payment', () => {
      const positive = 'There is a registration fee.';
      const flags1 = extractFlags(positive);
      expect(flags1.some(f => f.type === 'upfront_payment')).toBe(true);

      const negative = 'There is absolutely no registration fee required.';
      const flags2 = extractFlags(negative);
      expect(flags2.some(f => f.type === 'upfront_payment')).toBe(false);
    });

    it('covers Indian scam wording', () => {
      const sentences = [
        { text: 'Pay deposit amount now', type: 'upfront_payment' },
        { text: 'Kit charge is 500', type: 'upfront_payment' },
        { text: 'Submit laptop deposit', type: 'upfront_payment' },
        { text: 'Pay via upi', type: 'upfront_payment' },
        { text: 'Contact us only on telegram', type: 'off_platform_contact' },
        { text: 'Message me only on whatsapp', type: 'off_platform_contact' },
        { text: 'Upload your Aadhaar', type: 'premature_pii' },
        { text: 'Send pan card', type: 'premature_pii' },
        { text: 'Provide bank account details', type: 'premature_pii' },
      ];

      sentences.forEach(({ text, type }) => {
        const flags = extractFlags(text);
        expect(flags.some(f => f.type === type)).toBe(true);
      });
    });
  });

  describe('applyScoreCap', () => {
    type Sev = Pick<Parameters<typeof applyScoreCap>[1][0], 'severity'>;
    const high: Sev = { severity: 'high' };
    const medium: Sev = { severity: 'medium' };

    it('caps score at 39 if high severity flag is present', () => {
      expect(applyScoreCap(80, [high])).toBe(39);
    });

    it('does not cap score if no high severity flag is present', () => {
      expect(applyScoreCap(80, [medium])).toBe(80);
    });

    it('never raises a score', () => {
      expect(applyScoreCap(20, [high])).toBe(20);
    });

    it('is idempotent', () => {
      const pass1 = applyScoreCap(80, [high]); // 39
      const pass2 = applyScoreCap(pass1, [high]); // still 39
      expect(pass1).toBe(pass2);
      expect(pass2).toBe(39);
    });
  });
});
