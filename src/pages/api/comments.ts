import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '../../lib/supabase';

/**
 * List verified comments for an article.
 * GET /api/comments?slug=foo
 */
export const GET: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get('slug')?.trim().slice(0, 200) ?? '';
  if (!slug) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_slug' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('comments')
      .select('id, parent_id, author_name, body, created_at')
      .eq('slug', slug)
      .eq('verified', true)
      .eq('approved', true)
      .order('created_at', { ascending: true })
      .limit(500);

    if (error) {
      console.error('[COMMENTS] read error', error);
      return new Response(JSON.stringify({ ok: false, error: 'read_error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, comments: data ?? [] }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=10',
      },
    });
  } catch (e) {
    console.error('[COMMENTS] unexpected', e);
    return new Response(JSON.stringify({ ok: false, error: 'internal' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
