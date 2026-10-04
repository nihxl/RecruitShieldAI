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
    description: 'Legitimate employers never ask for payment, deposits, or equipment fees before hiring.',
    pattern: /(?:registration|deposit|equipment|laptop|kit|training|security)\s+(?:fee|charge|amount|deposit)|(?:pay|transfer)\s+(?:via\s+)?(?:upi|gpay|paytm|phonepe)/gi,
    antiPattern: /(?:no|without|zero|free|don'?t\s+pay|never\s+pay|not\s+require)\s+(?:any\s+)?(?:registration|deposit|equipment|laptop|kit|training|security)\s+(?:fee|charge|amount|deposit)/gi,
  },
  {
    type: 'artificial_urgency',
    title: 'Artificial Urgency',
    severity: 'medium',
    description: 'Pressuring applicants to act immediately is often used to prevent careful review of the opportunity.',
    pattern: /(?:act|apply|respond|pay)\s+(?:now|immediately|urgent|within\s+\d+\s+(?:mins?|hours?))|limited\s+(?:time|seats?|slots?)/gi,
  },
  {
    type: 'premature_pii',
    title: 'Early Sensitive Information Request',
    severity: 'high',
    description: 'Asking for PAN, Aadhaar, or bank details before a formal offer is a severe privacy risk.',
    pattern: /(?:send|share|provide|upload|submit)\s+(?:your\s+)?(?:aadhaar|pan|bank\s+account|passbook|cancelled\s+cheque)/gi,
    antiPattern: /(?:do\s+not|don'?t|never)\s+(?:send|share|provide|upload|submit)\s+(?:your\s+)?(?:aadhaar|pan|bank\s+account|passbook|cancelled\s+cheque)/gi,
  },
  {
    type: 'off_platform_contact',
    title: 'Unverifiable Contact Method',
    severity: 'medium',
    description: 'Communicating exclusively through messaging apps like WhatsApp or Telegram hides the recruiter\'s identity.',
    pattern: /(?:contact|msg|message|ping|reach\s+out)(?:\s+us|\s+me)?\s+(?:only\s+)?(?:on|via)\s+(?:whatsapp|telegram|wa)/gi,
  },
  {
    type: 'unrealistic_compensation',
    title: 'Unrealistic Compensation',
    severity: 'medium',
    description: 'Compensation that significantly exceeds industry standards for the role\'s requirements warrants careful verification.',
    pattern: /(?:earn|make|salary|pay)\s+(?:up\s+to\s+)?(?:₹|rs\.?|inr)?\s*(?:[5-9]\d{4,}|[1-9]\d{5,})\s+(?:per\s+month|pm|monthly|a\s+month)/gi,
  },
  {
    type: 'vague_role',
    title: 'Vague Role Description',
    severity: 'low',
    description: 'Listings lacking specific job duties or verifiable company information make it difficult to assess the opportunity.',
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
