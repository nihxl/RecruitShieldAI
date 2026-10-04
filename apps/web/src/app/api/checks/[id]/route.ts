import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getOrCreateDeviceCookie } from '@/lib/deviceCookie';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const deviceId = await getOrCreateDeviceCookie();
    const { id } = await params;

    const result = await db.select()
      .from(checks)
      .where(and(
        eq(checks.id, id),
        eq(checks.deviceId, deviceId)
      ));

    if (result.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const check = result[0];

    // Only return safe fields — never job text
    return NextResponse.json({
      id: check.id,
      status: check.status,
      result: check.result,
      errorCode: check.errorCode,
    });
  } catch (_err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const deviceId = await getOrCreateDeviceCookie();
    const { id } = await params;

    const result = await db.delete(checks)
      .where(and(
        eq(checks.id, id),
        eq(checks.deviceId, deviceId)
      ))
      .returning({ deletedId: checks.id });

    if (result.length === 0) {
      // Another device's id returns 404, never 403
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (_err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
