/**
 * Server-side Turnstile token verification.
 * Call from API route handlers that accept user-submitted forms.
 */
export interface TurnstileResult {
  ok: boolean;
  errorCodes?: string[];
}

export async function verifyTurnstile(token: string, ip?: string): Promise<TurnstileResult> {
  const secret = import.meta.env.TURNSTILE_SECRET_KEY ?? process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // No secret configured — fail closed in production, fail open in dev for local testing.
    if (import.meta.env.PROD) return { ok: false, errorCodes: ['missing_secret'] };
    return { ok: true };
  }
  if (!token) return { ok: false, errorCodes: ['missing_token'] };

  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', token);
  if (ip) body.set('remoteip', ip);

  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const data = (await r.json()) as { success?: boolean; 'error-codes'?: string[] };
    return { ok: !!data.success, errorCodes: data['error-codes'] };
  } catch (e) {
    return { ok: false, errorCodes: ['fetch_failed'] };
  }
}
