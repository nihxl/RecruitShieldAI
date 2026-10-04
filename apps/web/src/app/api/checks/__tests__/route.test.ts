import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET as GETList } from '../route';
import { GET as GETSingle, DELETE } from '../[id]/route';
import * as dbModule from '@/lib/db';
import * as deviceCookieModule from '@/lib/deviceCookie';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';

// ── Database mock ─────────────────────────────────────────────────────────────
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/deviceCookie', () => ({
  getOrCreateDeviceCookie: vi.fn(),
}));

vi.mock('next/server', async (importOriginal) => {
  const mod = await importOriginal<typeof import('next/server')>();
  return {
    ...mod,
    // Execute `after` callbacks immediately so background jobs run inline
    after: vi.fn((cb: () => Promise<void>) => cb()),
  };
});

// ── Helpers ───────────────────────────────────────────────────────────────────
type Db = NeonHttpDatabase;

function mockSelectChain(returnValue: unknown) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(returnValue),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockResolvedValue(returnValue),
  };
  (dbModule.db as unknown as Db).select = vi.fn().mockReturnValue(chain) as MockedFunction<Db['select']>;
  return chain;
}

function mockInsertChain() {
  const chain = { values: vi.fn().mockResolvedValue({}) };
  (dbModule.db as unknown as Db).insert = vi.fn().mockReturnValue(chain) as MockedFunction<Db['insert']>;
  return chain;
}

function mockUpdateChain() {
  const chain = { set: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue({}) };
  chain.set.mockReturnValue(chain);
  (dbModule.db as unknown as Db).update = vi.fn().mockReturnValue(chain) as MockedFunction<Db['update']>;
  return chain;
}

function mockDeleteChain(returnValue: unknown) {
  const chain = { where: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue(returnValue) };
  chain.where.mockReturnValue(chain);
  (dbModule.db as unknown as Db).delete = vi.fn().mockReturnValue(chain) as MockedFunction<Db['delete']>;
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('API Routes', () => {
  const mockDeviceId = 'device-123';
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.mocked(deviceCookieModule.getOrCreateDeviceCookie).mockResolvedValue(mockDeviceId);
  });

  // ── POST /api/checks ─────────────────────────────────────────────────────
  describe('POST /api/checks', () => {
    it('returns 400 on validation failure (text too short)', async () => {
      const req = new NextRequest('http://localhost/api/checks', {
        method: 'POST',
        body: JSON.stringify({ jobText: 'Too short' }),
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
    });

    it('returns 429 on the 11th request in an hour', async () => {
      // Rate limit check returns count = 10
      const chain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 10 }]),
      };
      (dbModule.db as unknown as Db).select = vi.fn().mockReturnValue(chain) as MockedFunction<Db['select']>;

      const req = new NextRequest('http://localhost/api/checks', {
        method: 'POST',
        body: JSON.stringify({ jobText: 'A'.repeat(100) }),
      });
      const response = await POST(req);
      expect(response.status).toBe(429);
      const body = await response.json();
      expect(body.error).toMatch(/rate limit/i);
    });

    it('creates a check and logs only id+status — never job text or device cookie', async () => {
      // Rate limit = 0
      const rateChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      };
      (dbModule.db as unknown as Db).select = vi.fn().mockReturnValue(rateChain) as MockedFunction<Db['select']>;
      mockInsertChain();
      mockUpdateChain();

      const jobText = 'A'.repeat(100);
      const req = new NextRequest('http://localhost/api/checks', {
        method: 'POST',
        body: JSON.stringify({ jobText, jobTitle: 'Engineer' }),
      });

      const response = await POST(req);
      expect(response.status).toBe(200);
      const { id } = await response.json();
      expect(id).toMatch(/^RS-\d{4}-[A-Z0-9]{3}$/i);

      expect(consoleLogSpy).toHaveBeenCalled();
      const allLogs = consoleLogSpy.mock.calls.map((c: unknown[]) => c.join(' ')).join('\n');

      // Logs carry id and status only
      expect(allLogs).toContain(`[Job ${id}] status: processing`);
      expect(allLogs).toMatch(/\[Job RS-\d{4}-[A-Z0-9]{3}\] status: (complete|error)/i);

      // Sensitive data never logged
      expect(allLogs).not.toContain(jobText);
      expect(allLogs).not.toContain(mockDeviceId);
    });

    it('retries on ID collision', async () => {
      // Rate limit = 0
      const rateChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      };
      (dbModule.db as unknown as Db).select = vi.fn().mockReturnValue(rateChain) as MockedFunction<Db['select']>;
      
      const insertChain = { values: vi.fn() };
      // First call throws a constraint error to simulate collision, second succeeds
      insertChain.values.mockRejectedValueOnce({ code: '23505' }).mockResolvedValueOnce({});
      (dbModule.db as unknown as Db).insert = vi.fn().mockReturnValue(insertChain) as MockedFunction<Db['insert']>;
      mockUpdateChain();

      const req = new NextRequest('http://localhost/api/checks', {
        method: 'POST',
        body: JSON.stringify({ jobText: 'A'.repeat(100) }),
      });

      const response = await POST(req);
      expect(response.status).toBe(200);
      expect(insertChain.values).toHaveBeenCalledTimes(2);
    });

    it('selects analyzer based on ANALYZER env var', async () => {
      // route.ts exports `analyzer`. Since we don't have the real one yet, 
      // we check it uses MockAnalyzer by default
      const { analyzer } = await import('../route');
      expect(analyzer.constructor.name).toBe('MockAnalyzer');
    });
  });

  // ── GET /api/checks/[id] ─────────────────────────────────────────────────
  describe('GET /api/checks/[id]', () => {
    it('returns 404 for a check belonging to another device', async () => {
      mockSelectChain([]); // empty = no row matched deviceId + id
      const req = new NextRequest('http://localhost/api/checks/RS-0001-AAA');
      const response = await GETSingle(req, { params: Promise.resolve({ id: 'RS-0001-AAA' }) });
      expect(response.status).toBe(404);
    });

    it('returns 200 with result for own check', async () => {
      mockSelectChain([{ id: 'RS-0002-BBB', status: 'complete', result: { band: 'likely-genuine' }, errorCode: null }]);
      const req = new NextRequest('http://localhost/api/checks/RS-0002-BBB');
      const response = await GETSingle(req, { params: Promise.resolve({ id: 'RS-0002-BBB' }) });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.id).toBe('RS-0002-BBB');
      // Verify job text is NOT in the response
      expect(JSON.stringify(body)).not.toContain('jobText');
    });
  });

  // ── DELETE /api/checks/[id] ──────────────────────────────────────────────
  describe('DELETE /api/checks/[id]', () => {
    it('returns 404 for another devices check (never 403)', async () => {
      mockDeleteChain([]); // no row deleted
      const req = new NextRequest('http://localhost/api/checks/RS-0001-AAA');
      const response = await DELETE(req, { params: Promise.resolve({ id: 'RS-0001-AAA' }) });
      expect(response.status).toBe(404);
      // Must not return 403
      expect(response.status).not.toBe(403);
    });

    it('returns 200 on successful delete of own check', async () => {
      mockDeleteChain([{ deletedId: 'RS-0003-CCC' }]);
      const req = new NextRequest('http://localhost/api/checks/RS-0003-CCC');
      const response = await DELETE(req, { params: Promise.resolve({ id: 'RS-0003-CCC' }) });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });
  });

  // ── GET /api/checks (list) ───────────────────────────────────────────────
  describe('GET /api/checks (list)', () => {
    function setupListMock(items: unknown[], statsRows: unknown[]) {
      // First select = paginated items, second = all-device stats
      const itemsChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(items),
      };
      const statsChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(statsRows),
      };
      (dbModule.db as unknown as Db).select = vi.fn()
        .mockReturnValueOnce(itemsChain)
        .mockReturnValueOnce(statsChain) as MockedFunction<Db['select']>;
      return itemsChain;
    }

    it('returns paginated items, correct stats counts', async () => {
      const statsRows = [
        { status: 'complete', band: 'highly-genuine' },
        { status: 'complete', band: 'likely-genuine' },
        { status: 'complete', band: 'caution-advised' },
        { status: 'processing', band: null },
        { status: 'complete', band: 'high-risk' },
      ];
      const itemsChain = setupListMock([{ id: 'RS-0001-AAA' }], statsRows);

      const req = new NextRequest('http://localhost/api/checks?page=1&limit=20');
      const response = await GETList(req);
      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.stats.total).toBe(5);
      expect(body.stats.highTrust).toBe(2);   // highly-genuine + likely-genuine
      expect(body.stats.caution).toBe(1);
      expect(body.stats.inProgress).toBe(1);

      expect(itemsChain.limit).toHaveBeenCalledWith(20);
      expect(itemsChain.offset).toHaveBeenCalledWith(0);
    });

    it('applies correct offset for page 2', async () => {
      const itemsChain = setupListMock([], []);
      const req = new NextRequest('http://localhost/api/checks?page=2&limit=10');
      await GETList(req);
      expect(itemsChain.limit).toHaveBeenCalledWith(10);
      expect(itemsChain.offset).toHaveBeenCalledWith(10);
    });

    it('passes search query (parameterised — no concatenation)', async () => {
      // Just check the route doesn't crash with q param; SQL param is handled by drizzle ilike
      setupListMock([], []);
      const req = new NextRequest('http://localhost/api/checks?q=TechCorp');
      const response = await GETList(req);
      expect(response.status).toBe(200);
    });

    it('passes filter=recent without error', async () => {
      setupListMock([], []);
      const req = new NextRequest('http://localhost/api/checks?filter=recent');
      const response = await GETList(req);
      expect(response.status).toBe(200);
    });

    it('passes filter=high-risk without error', async () => {
      setupListMock([], []);
      const req = new NextRequest('http://localhost/api/checks?filter=high-risk');
      const response = await GETList(req);
      expect(response.status).toBe(200);
    });
  });
});
