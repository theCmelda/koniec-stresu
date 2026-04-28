import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '../../lib/supabase';
import { verifyTurnstile } from '../../lib/turnstile';

/**
 * 30-day course email opt-in. Stores subscriber in Supabase `optins` table.
 * No automation yet — emails sit there waiting for a future drip campaign.
 *
 * Spam protection: Cloudflare Turnstile token must validate in production.
 */
export const POST: APIRoute = async ({ request, clientAddress }) => {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_content_type' }), {
      status: 415,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const firstName = typeof body.first_name === 'string' ? body.first_name.trim().slice(0, 80) : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 200) : '';
  const source = typeof body.source === 'string' ? body.source.slice(0, 200) : 'cta';
  const turnstileToken = typeof body.turnstile_token === 'string' ? body.turnstile_token : '';

  // Verify Turnstile token (server-side)
  const ts = await verifyTurnstile(turnstileToken, clientAddress);
  if (!ts.ok) {
    return new Response(
      JSON.stringify({ ok: false, error: 'turnstile_failed', codes: ts.errorCodes ?? [] }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (firstName.length < 1) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_first_name' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_email' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const referer = request.headers.get('referer') ?? '';
  const ua = (request.headers.get('user-agent') ?? '').slice(0, 300);

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('optins').insert({
      email,
      first_name: firstName,
      source,
      referer: referer.slice(0, 500),
      ua,
    });
    if (error) {
      console.error('[OPTIN] insert error', error);
      // Still log a fallback so we don't lose the signup
      console.log('[OPTIN-FALLBACK]', JSON.stringify({ first_name: firstName, email, source }));
      return new Response(JSON.stringify({ ok: false, error: 'storage_error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    console.error('[OPTIN] unexpected error', e);
    console.log('[OPTIN-FALLBACK]', JSON.stringify({ first_name: firstName, email, source }));
    return new Response(JSON.stringify({ ok: false, error: 'internal' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const GET: APIRoute = async () =>
  new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
