import { LanguageFlag } from './AnalysisContract';

export type FlagDef = {
  type: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  pattern: RegExp;
  antiPattern?: RegExp;
};

/**
 * ASSUMPTION (Flag definitions & Microcopy):
 * Flag titles and descriptions are written in the direct, objective voice 
 * per DD §2. The severity mapping is as follows:
 * - upfront_payment: high
 * - premature_pii: high
 * - artificial_urgency: medium
 * - off_platform_contact: medium
 * - unrealistic_compensation: medium
 * - vague_role: low
 */
export const FLAG_RULES: FlagDef[] = [
  {
    type: 'upfront_payment',
    title: 'Payment Requested',
    severity: 'high',
    description: 'This posting asks for a payment. Genuine employers rarely charge fees to hire. The Trust Score is capped because of this.',
    pattern: /(?:registration|deposit|equipment|laptop|kit|training|security)\s+(?:fee|charge|amount|deposit)|(?:pay|transfer)\s+(?:via\s+)?(?:upi|gpay|paytm|phonepe)/gi,
    antiPattern: /(?:no|without|zero|free|don'?t\s+pay|never\s+pay|not\s+require)\s+(?:any\s+)?(?:registration|deposit|equipment|laptop|kit|training|security)\s+(?:fee|charge|amount|deposit)/gi,
  },
  {
    type: 'artificial_urgency',
    title: 'Artificial Urgency',
    severity: 'medium',
    description: 'The posting pushes you to act quickly. Take time to check the employer before you reply.',
    pattern: /(?:act|apply|respond|pay)\s+(?:now|immediately|urgent|within\s+\d+\s+(?:mins?|hours?))|limited\s+(?:time|seats?|slots?)/gi,
  },
  {
    type: 'premature_pii',
    title: 'Early Sensitive Information Request',
    severity: 'high',
    description: 'This posting asks for sensitive details early. Share PAN, Aadhaar or bank details only after you have verified the employer.',
    pattern: /(?:send|share|provide|upload|submit)\s+(?:your\s+)?(?:aadhaar|pan|bank\s+account|passbook|cancelled\s+cheque)/gi,
    antiPattern: /(?:do\s+not|don'?t|never)\s+(?:send|share|provide|upload|submit)\s+(?:your\s+)?(?:aadhaar|pan|bank\s+account|passbook|cancelled\s+cheque)/gi,
  },
  {
    type: 'off_platform_contact',
    title: 'Unverifiable Contact Method',
    severity: 'medium',
    description: 'Contact is only through a messaging app, which makes the recruiter harder to verify.',
    pattern: /(?:contact|msg|message|ping|reach\s+out)(?:\s+us|\s+me)?\s+(?:only\s+)?(?:on|via)\s+(?:whatsapp|telegram|wa)/gi,
  },
  {
    type: 'unrealistic_compensation',
    title: 'Unrealistic Compensation',
    severity: 'medium',
    description: 'The pay looks unusually high for the role described. Check it against similar listings before you continue.',
    pattern: /(?:earn|make|salary|pay)\s+(?:up\s+to\s+)?(?:₹|rs\.?|inr)?\s*(?:[5-9]\d{4,}|[1-9]\d{5,})\s+(?:per\s+month|pm|monthly|a\s+month)/gi,
  },
  {
    type: 'vague_role',
    title: 'Vague Role Description',
    severity: 'low',
    description: 'The role has few specific duties or details, which makes it hard to judge. Ask the recruiter for a clear job description.',
    pattern: /(?:no\s+(?:experience|skills|resume|interview)\s+(?:needed|required))|(?:easy\s+work|work\s+from\s+home|wfh)\s+(?:and\s+earn)/gi,
  }
];

export function extractFlags(jobText: string): Omit<LanguageFlag, 'id'>[] {
  const flags: Omit<LanguageFlag, 'id'>[] = [];

  for (const rule of FLAG_RULES) {
    // Reset regex state just in case
    rule.pattern.lastIndex = 0;
    
    let match;
    while ((match = rule.pattern.exec(jobText)) !== null) {
      const quote = match[0];
      const start = match.index;
      const end = start + quote.length;

      // Check anti-pattern (negation) overlapping with this span
      let isNegated = false;
      if (rule.antiPattern) {
        rule.antiPattern.lastIndex = 0;
        let antiMatch;
        while ((antiMatch = rule.antiPattern.exec(jobText)) !== null) {
          const antiStart = antiMatch.index;
          const antiEnd = antiStart + antiMatch[0].length;
          
          // If the anti-pattern overlaps with our match, it's negated
          if (start >= antiStart && end <= antiEnd) {
            isNegated = true;
            break;
          }
        }
      }

      if (!isNegated) {
        flags.push({
          type: rule.type,
          title: rule.title,
          severity: rule.severity,
          description: rule.description,
          quote: quote,
          span: { start, end }
          // Note: confidence is intentionally omitted for rules
        });
      }
    }
  }

  return flags;
}

/**
 * applyScoreCap must never raise a score and must be idempotent.
 * Payment-request rule (OQ-6) and other high severity flags force High Risk (score capped at 39).
 */
export function applyScoreCap(score: number, flags: Pick<LanguageFlag, 'severity'>[]): number {
  let cappedScore = score;
  const hasHighSeverity = flags.some(f => f.severity === 'high');
  
  if (hasHighSeverity) {
    cappedScore = Math.min(cappedScore, 39);
  }
  
  // Must never raise the score
  return Math.min(score, cappedScore);
}
