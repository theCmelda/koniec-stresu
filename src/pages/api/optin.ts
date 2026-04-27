import type { APIRoute } from 'astro';

/**
 * 30-day course email opt-in.
 *
 * For now this just validates the input and returns success. When the email
 * service (Resend / MailerLite) is connected, replace the TODO block with the
 * actual subscribe call + welcome email trigger.
 */
export const POST: APIRoute = async ({ request }) => {
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

  const firstName = typeof body.first_name === 'string' ? body.first_name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const source = typeof body.source === 'string' ? body.source : '/';

  // Basic validation
  if (firstName.length < 1 || firstName.length > 50) {
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

  // TODO: connect to Resend / MailerLite / ConvertKit
  // For now we just log the signup so it shows up in Vercel function logs.
  // Replace with real provider call when API key is available.
  console.log('[OPTIN]', JSON.stringify({ first_name: firstName, email, source, ts: new Date().toISOString() }));

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
