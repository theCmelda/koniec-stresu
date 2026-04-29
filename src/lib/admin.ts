/**
 * Tiny HMAC-signed cookie auth for /admin/* pages.
 *
 * Cookie format: <expiryUnixSec>.<hmac-sha256(secret, expiryUnixSec).hex>
 *
 * env required:
 *   ADMIN_PASSWORD       — the password Daniel types to log in
 *   ADMIN_COOKIE_SECRET  — HMAC key (32 bytes hex)
 */
import { createHmac } from 'node:crypto';

export const ADMIN_COOKIE = 'cs_admin';
export const ADMIN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function secret(): string {
  const s = import.meta.env.ADMIN_COOKIE_SECRET ?? process.env.ADMIN_COOKIE_SECRET ?? '';
  if (!s) throw new Error('ADMIN_COOKIE_SECRET missing');
  return s;
}

export function password(): string {
  return import.meta.env.ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD ?? '';
}

export function buildCookieValue(): string {
  const expiry = Math.floor(Date.now() / 1000) + ADMIN_TTL_SECONDS;
  const sig = createHmac('sha256', secret()).update(String(expiry)).digest('hex');
  return `${expiry}.${sig}`;
}

export function isValidCookie(value: string | undefined | null): boolean {
  if (!value) return false;
  const [expiryStr, sig] = value.split('.');
  if (!expiryStr || !sig) return false;
  const expiry = parseInt(expiryStr, 10);
  if (!Number.isFinite(expiry)) return false;
  if (expiry < Math.floor(Date.now() / 1000)) return false;
  const expected = createHmac('sha256', secret()).update(String(expiry)).digest('hex');
  // Constant-time compare
  if (sig.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) {
    diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export function setCookieHeader(): string {
  return [
    `${ADMIN_COOKIE}=${buildCookieValue()}`,
    'Path=/',
    `Max-Age=${ADMIN_TTL_SECONDS}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
  ].join('; ');
}

export function clearCookieHeader(): string {
  return `${ADMIN_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}
