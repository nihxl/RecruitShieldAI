import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checks } from '@/lib/db/schema';
import { lt } from 'drizzle-orm';
import { timingSafeEqual } from 'node:crypto';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const secret = process.env.CRON_SECRET;

    if (!secret || !authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providedSecret = authHeader.substring(7);
    
    if (providedSecret.length !== secret.length) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providedBuffer = Buffer.from(providedSecret);
    const secretBuffer = Buffer.from(secret);

    if (!timingSafeEqual(providedBuffer, secretBuffer)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const retentionDays = parseInt(process.env.RETENTION_DAYS ?? '30', 10);
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const result = await db.delete(checks)
      .where(lt(checks.createdAt, cutoffDate))
      .returning({ deletedId: checks.id });

    return NextResponse.json({ success: true, deletedCount: result.length });
  } catch (_err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
