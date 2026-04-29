import type { APIRoute } from 'astro';
import { isValidCookie, ADMIN_COOKIE } from '../../lib/admin';
import { getSupabaseAdmin } from '../../lib/supabase';

/**
 * Save Daniel's feedback note for a draft article.
 * Requires admin cookie. Body: { slug, feedback }.
 * Each save creates a NEW row (history kept).
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  const cookie = cookies.get(ADMIN_COOKIE);
  if (!isValidCookie(cookie?.value)) {
    return jerr('unauthorized', 401);
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return jerr('invalid_json', 400);
  }

  const slug = typeof body.slug === 'string' ? body.slug.trim().slice(0, 200) : '';
  const feedback = typeof body.feedback === 'string' ? body.feedback.trim().slice(0, 8000) : '';
  if (!slug) return jerr('invalid_slug', 400);
  if (feedback.length < 2) return jerr('feedback_too_short', 400);

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('admin_feedback').insert({ slug, feedback });
    if (error) {
      console.error('[ADMIN_FEEDBACK] insert error', error);
      return jerr('storage_error', 500);
    }
  } catch (e) {
    console.error('[ADMIN_FEEDBACK] unexpected', e);
    return jerr('internal', 500);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

function jerr(error: string, status: number) {
  return new Response(JSON.stringify({ ok: false, error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
