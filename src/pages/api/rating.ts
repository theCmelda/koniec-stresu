import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '../../lib/supabase';

/**
 * Article rating + qualitative feedback endpoint.
 * Stores in Supabase `ratings` table.
 *
 * Body shape:
 *   { slug: string, rating: 1..5, feedback?: string }
 *
 * The first call from the popup contains just slug + rating (immediate save
 * on star click). The second call adds feedback when the user types and submits.
 * We insert both — duplicates per slug are intentional to capture the funnel.
 */
export const POST: APIRoute = async ({ request }) => {
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
  const ratingRaw = body.rating;
  const rating = typeof ratingRaw === 'number' ? Math.round(ratingRaw) : NaN;
  const feedback = typeof body.feedback === 'string' ? body.feedback.trim().slice(0, 2000) : '';

  if (!slug) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_slug' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_rating' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const referer = request.headers.get('referer') ?? '';
  const ua = (request.headers.get('user-agent') ?? '').slice(0, 300);

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('ratings').insert({
      slug,
      rating,
      feedback: feedback || null,
      referer: referer.slice(0, 500),
      ua,
    });
    if (error) {
      console.error('[RATING] insert error', error);
      console.log('[RATING-FALLBACK]', JSON.stringify({ slug, rating, feedback }));
      return new Response(JSON.stringify({ ok: false, error: 'storage_error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    console.error('[RATING] unexpected error', e);
    console.log('[RATING-FALLBACK]', JSON.stringify({ slug, rating, feedback }));
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
