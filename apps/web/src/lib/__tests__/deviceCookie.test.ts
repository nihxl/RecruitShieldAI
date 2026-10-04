import { describe, it, expect, vi } from 'vitest';
import { getOrCreateDeviceCookie, COOKIE_NAME } from '../deviceCookie';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('getOrCreateDeviceCookie', () => {
  it('returns existing cookie if present', async () => {
    const { cookies } = await import('next/headers');
    const getMock = vi.fn().mockReturnValue({ value: 'existing-id' });
    vi.mocked(cookies).mockResolvedValue({ get: getMock, set: vi.fn() } as any);

    const deviceId = await getOrCreateDeviceCookie();
    expect(deviceId).toBe('existing-id');
    expect(getMock).toHaveBeenCalledWith(COOKIE_NAME);
  });

  it('creates a new cookie with correct options if not present', async () => {
    const { cookies } = await import('next/headers');
    const setMock = vi.fn();
    vi.mocked(cookies).mockResolvedValue({ get: vi.fn().mockReturnValue(undefined), set: setMock } as any);

    const deviceId = await getOrCreateDeviceCookie();
    expect(deviceId).toBeDefined();
    expect(typeof deviceId).toBe('string');
    expect(setMock).toHaveBeenCalledWith(
      COOKIE_NAME,
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
      })
    );
  });
});
