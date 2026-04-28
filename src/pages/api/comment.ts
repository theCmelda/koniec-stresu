import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '../../lib/supabase';
import { verifyTurnstile } from '../../lib/turnstile';
import { sendEmail } from '../../lib/email';

/**
 * Submit a new comment.
 *
 * Body: { slug, author_name, author_email, body, parent_id?, turnstile_token }
 *
 * Comment is inserted with verified=false + a verify_token. We email a magic
 * link that toggles verified=true when clicked. Public reads only return
 * verified comments (enforced via RLS public read policy).
 */
function randomToken(len = 32): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!(request.headers.get('content-type') ?? '').includes('application/json')) {
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

  const slug = typeof body.slug === 'string' ? body.slug.trim().slice(0, 200) : '';
  const authorName = typeof body.author_name === 'string' ? body.author_name.trim().slice(0, 80) : '';
  const authorEmail = typeof body.author_email === 'string' ? body.author_email.trim().toLowerCase().slice(0, 200) : '';
  const commentBody = typeof body.body === 'string' ? body.body.trim().slice(0, 4000) : '';
  const parentId = typeof body.parent_id === 'string' ? body.parent_id : null;
  const turnstileToken = typeof body.turnstile_token === 'string' ? body.turnstile_token : '';

  if (!slug) return jsonErr('invalid_slug', 400);
  if (authorName.length < 2) return jsonErr('invalid_name', 400);
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(authorEmail)) return jsonErr('invalid_email', 400);
  if (commentBody.length < 3) return jsonErr('invalid_body', 400);

  const ts = await verifyTurnstile(turnstileToken, clientAddress);
  if (!ts.ok) return jsonErr('turnstile_failed', 403, { codes: ts.errorCodes ?? [] });

  const token = randomToken(24);
  const ip = (clientAddress ?? '').slice(0, 45);
  const ua = (request.headers.get('user-agent') ?? '').slice(0, 300);

  let commentId: string | null = null;
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('comments')
      .insert({
        slug,
        parent_id: parentId,
        author_name: authorName,
        author_email: authorEmail,
        body: commentBody,
        verified: false,
        verify_token: token,
        verify_sent_at: new Date().toISOString(),
        ip,
        ua,
      })
      .select('id')
      .single();
    if (error) {
      console.error('[COMMENT] insert error', error);
      return jsonErr('storage_error', 500);
    }
    commentId = data.id;
  } catch (e) {
    console.error('[COMMENT] unexpected error', e);
    return jsonErr('internal', 500);
  }

  // Send verification email
  const origin = new URL(request.url).origin;
  const verifyUrl = `${origin}/api/comment-verify?token=${encodeURIComponent(token)}&slug=${encodeURIComponent(slug)}`;
  const emailHtml = `<!doctype html>
<html lang="sk">
<body style="margin:0;background:#fef6ee;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#2e221a;">
  <div style="max-width:520px;margin:32px auto;background:#fffaf3;border-radius:24px;padding:32px;border:1px solid #ead7c1;">
    <h1 style="font-family:Georgia,serif;font-weight:500;font-size:24px;line-height:1.2;margin:0 0 16px;">Potvrď svoj komentár</h1>
    <p style="margin:0 0 16px;line-height:1.5;color:#7d6e60;">
      Ahoj ${escapeHtml(authorName)}, niekto pridal komentár pod článkom na <strong>koniecstresu.sk</strong> a uviedol túto e-mailovú adresu. Ak si to bol/a ty, klikni na tlačidlo nižšie a komentár sa zobrazí pod článkom.
    </p>
    <p style="margin:24px 0;text-align:center;">
      <a href="${verifyUrl}" style="display:inline-block;background:#2e221a;color:#fffaf3;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600;font-size:15px;">Potvrdiť komentár</a>
    </p>
    <p style="margin:0 0 8px;font-size:13px;color:#a3917f;">Ak si komentár nepridal/a, jednoducho ignoruj tento e-mail. Bez kliknutia sa nikde nezobrazí.</p>
    <p style="margin:24px 0 0;font-size:12px;color:#a3917f;">Daniel Jedlička · koniecstresu.sk</p>
  </div>
</body>
</html>`;

  const emailRes = await sendEmail({
    to: authorEmail,
    subject: 'Potvrď svoj komentár · Koniec Stresu',
    html: emailHtml,
  });
  if (!emailRes.ok) {
    console.error('[COMMENT] email send failed', emailRes.error, '— comment id:', commentId);
    // We still return success: comment is in DB, Daniel can manually verify if needed.
  }

  return new Response(JSON.stringify({ ok: true, message: 'verify_email_sent' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

function jsonErr(error: string, status: number, extra?: Record<string, unknown>) {
  return new Response(JSON.stringify({ ok: false, error, ...(extra ?? {}) }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const GET: APIRoute = async () =>
  new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
