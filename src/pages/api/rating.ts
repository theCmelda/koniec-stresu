import type { APIRoute } from 'astro';

/**
 * Article rating + qualitative feedback endpoint.
 *
 * Body shape (any subset is valid as long as slug + rating present):
 *   { slug: string, rating: 1..5, feedback?: string }
 *
 * The first call from the popup contains just slug + rating (immediate save
 * on star click). The second call adds feedback when the user types and submits.
 *
 * Storage: for now logs to Vercel function output so the data is captured
 * and visible in the dashboard. When Supabase is wired up, swap the TODO block
 * for an insert into a `ratings` table.
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

  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  const ratingRaw = body.rating;
  const rating = typeof ratingRaw === 'number' ? Math.round(ratingRaw) : NaN;
  const feedback = typeof body.feedback === 'string' ? body.feedback.trim().slice(0, 2000) : '';

  if (!slug || slug.length > 200) {
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

  // Best-effort context: which referrer + which user-agent (for spam patterns)
  const referer = request.headers.get('referer') ?? '';
  const ua = request.headers.get('user-agent') ?? '';

  // TODO: when Supabase is wired up, replace this block with:
  //   await supabase.from('ratings').insert({ slug, rating, feedback, referer, ua, created_at: new Date() });
  // For now log so it shows up in Vercel function logs (and can be exported later).
  console.log(
    '[RATING]',
    JSON.stringify({
      ts: new Date().toISOString(),
      slug,
      rating,
      feedback,
      has_feedback: feedback.length > 0,
      referer,
      ua: ua.slice(0, 160),
    })
  );

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
