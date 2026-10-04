import { z } from 'zod';
import { STATUS_BANDS, BandId, getBandForScore } from './statusMap';

/**
 * Assumption (API Input): 
 * Normalise CRLF to LF and trim jobText before validating and storing.
 * title and company empty becomes undefined.
 */
export const AnalyzeInputSchema = z.object({
  jobText: z.string()
    .transform(val => val.replace(/\r\n/g, '\n').trim())
    .pipe(z.string().min(100, "Text must be at least 100 characters").max(5000, "Text must be at most 5000 characters")),
  title: z.string()
    .trim()
    .max(120, "Title must be at most 120 characters")
    .optional()
    .transform(val => val === '' ? undefined : val),
  company: z.string()
    .trim()
    .max(120, "Company must be at most 120 characters")
    .optional()
    .transform(val => val === '' ? undefined : val),
});

export type AnalyzeInput = z.infer<typeof AnalyzeInputSchema>;

// Reuse the keys from STATUS_BANDS to avoid redefining
const bandKeys = Object.keys(STATUS_BANDS) as [BandId, ...BandId[]];
export const BandEnumSchema = z.enum(bandKeys);

/**
 * Assumption (Module findings): 
 * Module findings are not defined in the PRD. We use { text, verdict } structure.
 */
const FindingSchema = z.object({
  text: z.string(),
  verdict: z.enum(['pass', 'caution', 'fail']).nullable(),
});

const ModuleSchema = z.object({
  key: z.enum(['language', 'document', 'company', 'link']),
  status: z.enum(['complete', 'locked', 'simulated', 'error']),
  verdict: z.enum(['pass', 'caution', 'fail']).nullable(),
  headline: z.string(),
  findings: z.array(FindingSchema),
});

const SpanSchema = z.object({
  start: z.number().int().min(0),
  end: z.number().int().min(0),
});

const FlagSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  severity: z.enum(['high', 'medium', 'low']),
  confidence: z.number().min(0).max(1).optional(),
  description: z.string(),
  quote: z.string(),
  span: SpanSchema,
});

const ProvenanceSchema = z.object({
  source: z.enum(['model', 'rules', 'mock']),
  modelVersion: z.string().optional(),
  generatedAt: z.string().datetime(), // ISO timestamp
});

const BaseOutputSchema = z.object({
  id: z.string().regex(/^RS-\d{4}-[A-Z0-9]{3}$/i, "Invalid ID format"),
  createdAt: z.string().datetime(), // ISO timestamp
  mode: z.enum(['PREVIEW', 'DEMO_FULL']),
  input: z.object({
    jobText: z.string(),
    jobTitle: z.string().optional(),
    companyName: z.string().optional(),
    charCount: z.number().int().min(0),
    truncated: z.boolean(),
  }),
});

/**
 * Assumption: Final shape for CompleteOutput vs ProcessingOutput vs ErrorOutput
 * processing and error carry only id, createdAt, mode, status, input (error also errorCode).
 */
const CompleteOutputSchema = BaseOutputSchema.extend({
  status: z.literal('complete'),
  trustScore: z.number().int().min(0).max(100),
  band: BandEnumSchema,
  summary: z.string(),
  modules: z.array(ModuleSchema),
  languageDetail: z.object({
    flags: z.array(FlagSchema),
  }),
  provenance: ProvenanceSchema,
  disclaimer: z.string(),
});

const ProcessingOutputSchema = BaseOutputSchema.extend({
  status: z.literal('processing'),
});

const ErrorOutputSchema = BaseOutputSchema.extend({
  status: z.literal('error'),
  errorCode: z.string(),
});

export const AnalysisOutputSchema = z.discriminatedUnion('status', [
  CompleteOutputSchema,
  ProcessingOutputSchema,
  ErrorOutputSchema,
]).superRefine((data, ctx) => {
  // Cross-field rule: charCount equals jobText.length
  if (data.input.charCount !== data.input.jobText.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "charCount must equal jobText.length",
      path: ['input', 'charCount'],
    });
  }

  if (data.status === 'complete') {
    // Cross-field rule: band equals getBandForScore(trustScore)
    const expectedBand = getBandForScore(data.trustScore).id;
    if (data.band !== expectedBand) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `band must match getBandForScore(trustScore), expected: ${expectedBand}`,
        path: ['band'],
      });
    }

    // Cross-field rule: confidence only when provenance.source is "model"
    if (data.provenance.source !== 'model') {
      const hasConfidence = data.languageDetail.flags.some(f => f.confidence !== undefined);
      if (hasConfidence) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "confidence is only allowed when provenance.source is 'model'",
          path: ['languageDetail', 'flags'],
        });
      }
    }

    // Cross-field rule: every flag span satisfies 0 <= start < end <= jobText.length
    data.languageDetail.flags.forEach((flag, index) => {
      const { start, end } = flag.span;
      if (!(start >= 0 && start < end && end <= data.input.jobText.length)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Flag span out of bounds or invalid: 0 <= start < end <= jobText.length (${data.input.jobText.length})`,
          path: ['languageDetail', 'flags', index, 'span'],
        });
      }
    });
  }
});

export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;
export type CompleteAnalysisOutput = z.infer<typeof CompleteOutputSchema>;
export type ProcessingAnalysisOutput = z.infer<typeof ProcessingOutputSchema>;
export type ErrorAnalysisOutput = z.infer<typeof ErrorOutputSchema>;

export type ModuleResult = z.infer<typeof ModuleSchema>;
export type LanguageFlag = z.infer<typeof FlagSchema>;
export type ProvenanceInfo = z.infer<typeof ProvenanceSchema>;
