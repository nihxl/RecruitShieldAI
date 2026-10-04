import { describe, it, expect, vi } from 'vitest';
import { getOrCreateDeviceCookie, COOKIE_NAME } from '../deviceCookie';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

function makeCookieStore(get: ReturnType<typeof vi.fn>, set: ReturnType<typeof vi.fn>) {
  return { get, set } as unknown as ReadonlyRequestCookies;
}

describe('getOrCreateDeviceCookie', () => {
  it('returns existing cookie if present', async () => {
    const { cookies } = await import('next/headers');
    const getMock = vi.fn().mockReturnValue({ value: 'existing-id' });
    vi.mocked(cookies).mockResolvedValue(makeCookieStore(getMock, vi.fn()));

    const deviceId = await getOrCreateDeviceCookie();
    expect(deviceId).toBe('existing-id');
    expect(getMock).toHaveBeenCalledWith(COOKIE_NAME);
  });

  it('creates a new cookie with correct options if not present', async () => {
    const { cookies } = await import('next/headers');
    const setMock = vi.fn();
    vi.mocked(cookies).mockResolvedValue(makeCookieStore(vi.fn().mockReturnValue(undefined), setMock));

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
