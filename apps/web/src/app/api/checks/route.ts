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

// Mock analyzer by default
const analyzer = process.env.ANALYZER === 'real' ? new MockAnalyzer() : new MockAnalyzer();

const postSchema = z.object({
  jobText: z.string().min(100),
  jobTitle: z.string().max(120).optional(),
  companyName: z.string().max(120).optional(),
});

function generateId() {
  return `RS-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  try {
    const deviceId = await getOrCreateDeviceCookie();
    
    // Parse body
    const body = await req.json();
    const result = postSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    
    const { jobText, jobTitle, companyName } = result.data;

    // Rate limiting: 10 per hour per device
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
        { error: 'Rate limit exceeded. Try again in an hour.' }, 
        { status: 429 }
      );
    }

    // Insert processing row
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
          jobTitle: jobTitle || null,
          companyName: companyName || null,
          jobText: jobText,
        });
        inserted = true;
      } catch (e: any) {
        if (e.code === '23505') { // Unique violation
          id = generateId();
          retries--;
        } else {
          throw e;
        }
      }
    }
    
    if (!inserted) {
      return NextResponse.json({ error: 'Failed to generate ID' }, { status: 500 });
    }

    // Run analysis after response
    after(async () => {
      console.log(`[Job ${id}] status: processing`);
      try {
        // Run analyzer
        const rawResult = await analyzer.analyze(jobText);
        
        // Apply score cap
        const flags = extractFlags(jobText);
        rawResult.trustScore = applyScoreCap(rawResult.trustScore, flags);
        
        // Ensure UI rules reflect the cap
        if (flags.some(f => f.severity === 'high')) {
          rawResult.band = 'high_risk';
        }
        
        // Validate with Zod
        const validated = AnalysisOutputSchema.parse(rawResult);
        
        await db.update(checks)
          .set({ status: 'complete', result: validated })
          .where(eq(checks.id, id));
          
        console.log(`[Job ${id}] status: complete`);
      } catch (error) {
        console.log(`[Job ${id}] status: error`);
        await db.update(checks)
          .set({ status: 'error', errorCode: 'analysis_failed' })
          .where(eq(checks.id, id));
      }
    });

    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const deviceId = await getOrCreateDeviceCookie();
    const { searchParams } = new URL(req.url);
    
    const search = searchParams.get('q');
    const filter = searchParams.get('filter') || 'all'; // all, recent, high-risk
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let conditions = [eq(checks.deviceId, deviceId)];
    
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
      // High risk checks have score cap applied, or check json field
      conditions.push(sql`${checks.result}->>'band' = 'high_risk'`);
    }

    const baseWhere = and(...conditions);

    // Get list
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

    // Get stats
    const allDeviceChecks = await db.select({
      status: checks.status,
      band: sql<string>`${checks.result}->>'band'`,
    })
    .from(checks)
    .where(eq(checks.deviceId, deviceId));

    const stats = {
      total: allDeviceChecks.length,
      highTrust: allDeviceChecks.filter(c => c.band === 'high_trust').length,
      caution: allDeviceChecks.filter(c => c.band === 'caution').length,
      inProgress: allDeviceChecks.filter(c => c.status === 'processing').length,
    };

    return NextResponse.json({ items, stats, page, limit });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

