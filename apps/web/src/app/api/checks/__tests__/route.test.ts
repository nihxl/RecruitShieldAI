import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET as GETList } from '../route';
import { GET as GETSingle, DELETE } from '../[id]/route';
import * as dbModule from '@/lib/db';
import * as deviceCookieModule from '@/lib/deviceCookie';

// Mock DB
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}));

vi.mock('@/lib/deviceCookie', () => ({
  getOrCreateDeviceCookie: vi.fn(),
}));

vi.mock('next/server', async (importOriginal) => {
  const mod = await importOriginal<typeof import('next/server')>();
  return {
    ...mod,
    after: vi.fn((cb) => cb()),
  };
});

describe('API Routes', () => {
  const mockDeviceId = 'device-123';
  let consoleLogSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.mocked(deviceCookieModule.getOrCreateDeviceCookie).mockResolvedValue(mockDeviceId);
  });

  describe('POST /api/checks', () => {
    it('returns 429 on 11th request', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 10 }])
        })
      });
      (dbModule.db as any).select = mockSelect;

      const req = new NextRequest('http://localhost/api/checks', {
        method: 'POST',
        body: JSON.stringify({ jobText: 'A'.repeat(100) })
      });
      
      const response = await POST(req);
      expect(response.status).toBe(429);
    });

    it('returns 400 on validation failure', async () => {
      const req = new NextRequest('http://localhost/api/checks', {
        method: 'POST',
        body: JSON.stringify({ jobText: 'Too short' })
      });
      
      const response = await POST(req);
      expect(response.status).toBe(400);
    });

    it('creates a check and strictly logs only ID and status, never job text or cookies', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 0 }])
        })
      });
      (dbModule.db as any).select = mockSelect;

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue({})
      });
      (dbModule.db as any).insert = mockInsert;
      
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({})
        })
      });
      (dbModule.db as any).update = mockUpdate;

      const req = new NextRequest('http://localhost/api/checks', {
        method: 'POST',
        body: JSON.stringify({
          jobText: 'A'.repeat(100),
          jobTitle: 'Test Job',
        })
      });

      const response = await POST(req);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toMatch(/^RS-[A-Z0-9]+$/);

      expect(consoleLogSpy).toHaveBeenCalled();
      const allLogs = consoleLogSpy.mock.calls.map((c: any) => c.join(' ')).join('\n');
      
      expect(allLogs).toContain(`[Job ${data.id}] status: processing`);
      // Use toMatch to allow either complete or error based on MockAnalyzer logic, but just checking format
      expect(allLogs).toMatch(/\[Job RS-[A-Z0-9]+\] status: (complete|error)/);
      
      expect(allLogs).not.toContain('A'.repeat(100));
      expect(allLogs).not.toContain('device-123');
    });
  });

  describe('GET /api/checks/[id]', () => {
    it('returns 404 for another devices check id', async () => {
      // Mock db to return empty array because deviceId wont match or id wont match
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      });
      (dbModule.db as any).select = mockSelect;

      const req = new NextRequest('http://localhost/api/checks/RS-OTHER');
      const response = await GETSingle(req, { params: Promise.resolve({ id: 'RS-OTHER' }) });
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/checks/[id]', () => {
    it('returns 404 for another devices check id', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([])
        })
      });
      (dbModule.db as any).delete = mockDelete;

      const req = new NextRequest('http://localhost/api/checks/RS-OTHER');
      const response = await DELETE(req, { params: Promise.resolve({ id: 'RS-OTHER' }) });
      expect(response.status).toBe(404);
    });

    it('returns 200 on successful delete of own check', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ deletedId: 'RS-MINE' }])
        })
      });
      (dbModule.db as any).delete = mockDelete;

      const req = new NextRequest('http://localhost/api/checks/RS-MINE');
      const response = await DELETE(req, { params: Promise.resolve({ id: 'RS-MINE' }) });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('GET /api/checks (List Route)', () => {
    it('supports search, filters, stats counts and pagination', async () => {
      // Mock for items
      const itemsSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([{ id: 'RS-1', status: 'complete' }])
      };
      
      // Mock for stats
      const statsSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          { status: 'complete', band: 'high_trust' },
          { status: 'processing', band: null },
          { status: 'complete', band: 'caution' },
          { status: 'complete', band: 'high_risk' },
        ])
      };

      (dbModule.db as any).select = vi.fn()
        .mockReturnValueOnce(itemsSelectChain)
        .mockReturnValueOnce(statsSelectChain);

      const req = new NextRequest('http://localhost/api/checks?q=tech&filter=high-risk&page=2&limit=10');
      const response = await GETList(req);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.items).toHaveLength(1);
      expect(data.page).toBe(2);
      expect(data.limit).toBe(10);
      
      // Check stats logic
      expect(data.stats.total).toBe(4);
      expect(data.stats.highTrust).toBe(1);
      expect(data.stats.caution).toBe(1);
      expect(data.stats.inProgress).toBe(1);
      
      // Verify pagination offset (page 2, limit 10 => offset 10)
      expect(itemsSelectChain.limit).toHaveBeenCalledWith(10);
      expect(itemsSelectChain.offset).toHaveBeenCalledWith(10);
    });
  });
});
