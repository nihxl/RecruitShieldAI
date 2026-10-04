import { AnalyzeInput, CompleteAnalysisOutput, ErrorAnalysisOutput, ModuleResult } from '../AnalysisContract';
import { extractFlags, applyScoreCap } from '../rules';
import { getBandForScore, getDisclaimer } from '../statusMap';

export interface AnalyzerOptions {
  now?: Date;
  forceFail?: boolean;
  mode?: 'PREVIEW' | 'DEMO_FULL';
}

export interface Analyzer {
  analyze(input: AnalyzeInput, options?: AnalyzerOptions): Promise<CompleteAnalysisOutput | ErrorAnalysisOutput>;
}

export class MockAnalyzer implements Analyzer {
  async analyze(input: AnalyzeInput, options?: AnalyzerOptions): Promise<CompleteAnalysisOutput | ErrorAnalysisOutput> {
    const now = options?.now || new Date();
    const mode = options?.mode || 'PREVIEW';
    const createdAt = now.toISOString();

    const charCount = input.jobText.length;
    // Generate an ID deterministically based on char count just for consistency, or random if not strict. 
    // Wait, deterministic: "RS-" + 4 digits + "-" + 3 alphanumerics
    const id = `RS-0000-MOK`;

    const baseInput = {
      jobText: input.jobText,
      jobTitle: input.title,
      companyName: input.company,
      charCount,
      truncated: false,
    };

    if (options?.forceFail && process.env.NODE_ENV !== 'production') {
      return {
        id,
        createdAt,
        mode,
        status: 'error',
        input: baseInput,
        errorCode: 'MOCK_FORCED_ERROR',
      };
    }

    const flags = extractFlags(input.jobText).map((f, i) => ({
      ...f,
      id: `mock-flag-${i + 1}`
    }));

    // Deterministic base score:
    // If it contains "genuine", give it 85 (Likely Genuine). Otherwise 60.
    let baseScore = input.jobText.toLowerCase().includes('genuine') ? 85 : 60;
    const finalScore = applyScoreCap(baseScore, flags);
    const bandDef = getBandForScore(finalScore);

    const modules: ModuleResult[] = [
      {
        key: 'language',
        status: 'complete',
        verdict: bandDef.id === 'high-risk' || bandDef.id === 'caution-advised' ? 'caution' : 'pass',
        headline: 'Language check completed',
        findings: flags.map(f => ({
          text: f.title,
          verdict: f.severity === 'high' ? 'fail' : 'caution',
        })),
      },
    ];

    return {
      id,
      createdAt,
      mode,
      status: 'complete',
      input: baseInput,
      trustScore: finalScore,
      band: bandDef.id,
      summary: bandDef.summary,
      modules,
      languageDetail: { flags },
      provenance: {
        source: 'mock',
        generatedAt: createdAt,
      },
      disclaimer: getDisclaimer(),
    };
  }
}
