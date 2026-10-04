import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import * as dbModule from '@/lib/db';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';

vi.mock('@/lib/db', () => ({
  db: {
    delete: vi.fn(),
  },
}));

type Db = NeonHttpDatabase;

function mockDeleteChain(returnValue: unknown) {
  const chain = { where: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue(returnValue) };
  chain.where.mockReturnValue(chain);
  (dbModule.db as unknown as Db).delete = vi.fn().mockReturnValue(chain) as MockedFunction<Db['delete']>;
  return chain;
}

describe('GET /api/cron/purge', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.CRON_SECRET = 'secret123';
    process.env.RETENTION_DAYS = '30';
  });

  it('returns 401 without the correct CRON_SECRET bearer header', async () => {
    const req = new NextRequest('http://localhost/api/cron/purge', {
      headers: {
        authorization: 'Bearer wrongsecret',
      }
    });
    const response = await GET(req);
    expect(response.status).toBe(401);
  });

  it('returns 401 when CRON_SECRET is not set', async () => {
    delete process.env.CRON_SECRET;
    const req = new NextRequest('http://localhost/api/cron/purge', {
      headers: {
        authorization: 'Bearer ',
      }
    });
    const response = await GET(req);
    expect(response.status).toBe(401);
  });

  it('deletes old rows and returns 200', async () => {
    const mockChain = mockDeleteChain([{ deletedId: 'RS-0001-AAA' }, { deletedId: 'RS-0002-BBB' }]);
    
    const req = new NextRequest('http://localhost/api/cron/purge', {
      headers: {
        authorization: 'Bearer secret123',
      }
    });
    
    const response = await GET(req);
    expect(response.status).toBe(200);
    
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.deletedCount).toBe(2);
    
    expect(dbModule.db.delete).toHaveBeenCalled();
    expect(mockChain.where).toHaveBeenCalled();
  });
});
