import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { checks } from '@/lib/db/schema';
import { eq, and, gte, desc, count, sql, or, ilike } from 'drizzle-orm';
import { getOrCreateDeviceCookie } from '@/lib/deviceCookie';
import { MockAnalyzer } from '@/lib/analyzer/mock';
import { applyScoreCap, extractFlags } from '@/lib/rules';
import { AnalysisOutputSchema } from '@/lib/AnalysisContract';
import { getBandForScore } from '@/lib/statusMap';

// Mock analyzer by default; wire real analyzer here when ANALYZER=real
const analyzer = new MockAnalyzer();

const postSchema = z.object({
  jobText: z.string().min(100),
  jobTitle: z.string().max(120).optional(),
  companyName: z.string().max(120).optional(),
});

/**
 * ID format: RS-NNNN-XXX where NNNN is 4 decimal digits, XXX is 3 uppercase hex chars.
 * This matches the Zod regex /^RS-\d{4}-[A-Z0-9]{3}$/i in AnalysisContract.
 */
function generateId(): string {
  const seq = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 3).toUpperCase();
  return `RS-${seq}-${suffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const deviceId = await getOrCreateDeviceCookie();

    const body = await req.json();
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }

    const { jobText, jobTitle, companyName } = parsed.data;

    // Rate limiting: 10 per hour per device (counted from DB)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentChecks = await db
      .select({ count: count() })
      .from(checks)
      .where(
        and(
          eq(checks.deviceId, deviceId),
          gte(checks.createdAt, oneHourAgo)
        )
      );

    if (recentChecks[0].count >= 10) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. You can submit up to 10 checks per hour.' },
        { status: 429 }
      );
    }

    // Insert processing row, retry on collision
    let id = generateId();
    let inserted = false;
    let retries = 3;

    while (!inserted && retries > 0) {
      try {
        await db.insert(checks).values({
          id,
          deviceId,
          status: 'processing',
          mode: 'text',
          jobTitle: jobTitle ?? null,
          companyName: companyName ?? null,
          jobText,
        });
        inserted = true;
      } catch (err: unknown) {
        const pgErr = err as { code?: string };
        if (pgErr.code === '23505') {
          id = generateId();
          retries--;
        } else {
          throw err;
        }
      }
    }

    if (!inserted) {
      return NextResponse.json({ error: 'Failed to generate unique ID' }, { status: 500 });
    }

    // Run analysis in background after response is sent
    const capturedId = id;
    after(async () => {
      console.log(`[Job ${capturedId}] status: processing`);
      try {
        const rawResult = await analyzer.analyze({ jobText, title: jobTitle, company: companyName });

        if (rawResult.status !== 'complete') {
          throw new Error(`Analyzer returned non-complete status: ${rawResult.status}`);
        }

        // Server-side score cap (idempotent, never raises)
        const flags = extractFlags(jobText);
        const cappedScore = applyScoreCap(rawResult.trustScore, flags);
        const cappedBand = getBandForScore(cappedScore).id;

        const finalResult = { ...rawResult, trustScore: cappedScore, band: cappedBand };

        // Validate full output against Zod contract
        const validated = AnalysisOutputSchema.parse(finalResult);

        await db.update(checks)
          .set({ status: 'complete', result: validated })
          .where(eq(checks.id, capturedId));

        console.log(`[Job ${capturedId}] status: complete`);
      } catch (_err) {
        // Never log error contents — they may contain job text in stack traces
        console.log(`[Job ${capturedId}] status: error`);
        await db.update(checks)
          .set({ status: 'error', errorCode: 'analysis_failed' })
          .where(eq(checks.id, capturedId));
      }
    });

    return NextResponse.json({ id });
  } catch (_err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const deviceId = await getOrCreateDeviceCookie();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get('q');
    const filter = searchParams.get('filter') ?? 'all'; // all | recent | high-risk
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const offset = (page - 1) * limit;

    // Build parameterised WHERE clauses — never string-concatenated
    const conditions = [eq(checks.deviceId, deviceId)];

    if (search) {
      conditions.push(
        or(
          ilike(checks.id, `%${search}%`),
          ilike(checks.jobTitle, `%${search}%`),
          ilike(checks.companyName, `%${search}%`)
        )!
      );
    }

    if (filter === 'recent') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      conditions.push(gte(checks.createdAt, thirtyDaysAgo));
    } else if (filter === 'high-risk') {
      conditions.push(sql`${checks.result}->>'band' = 'high-risk'`);
    }

    const baseWhere = and(...conditions);

    const items = await db.select({
      id: checks.id,
      status: checks.status,
      createdAt: checks.createdAt,
      jobTitle: checks.jobTitle,
      companyName: checks.companyName,
      band: sql<string>`${checks.result}->>'band'`,
    })
      .from(checks)
      .where(baseWhere)
      .orderBy(desc(checks.createdAt))
      .limit(limit)
      .offset(offset);

    // Stats are always across ALL checks for this device (not filtered)
    const allDeviceChecks = await db.select({
      status: checks.status,
      band: sql<string>`${checks.result}->>'band'`,
    })
      .from(checks)
      .where(eq(checks.deviceId, deviceId));

    const stats = {
      total: allDeviceChecks.length,
      highTrust: allDeviceChecks.filter(c => c.band === 'highly-genuine' || c.band === 'likely-genuine').length,
      caution: allDeviceChecks.filter(c => c.band === 'caution-advised').length,
      inProgress: allDeviceChecks.filter(c => c.status === 'processing').length,
    };

    return NextResponse.json({ items, stats, page, limit });
  } catch (_err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
