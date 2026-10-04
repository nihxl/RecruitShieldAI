import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export const COOKIE_NAME = 'rs_device';

export async function getOrCreateDeviceCookie() {
  const cookieStore = await cookies();
  const existingCookie = cookieStore.get(COOKIE_NAME);

  if (existingCookie?.value) {
    return existingCookie.value;
  }

  const newDeviceId = uuidv4();
  
  cookieStore.set(COOKIE_NAME, newDeviceId, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  });

  return newDeviceId;
}
