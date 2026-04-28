import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '../../lib/supabase';

/**
 * Confirm a comment via the magic link emailed to the author.
 * On success: set verified=true, redirect to article#comments.
 * On failure: redirect to article with ?verify=err.
 */
export const GET: APIRoute = async ({ url }) => {
  const token = url.searchParams.get('token') ?? '';
  const slug = url.searchParams.get('slug') ?? '';

  if (!token || !slug) {
    return new Response('Invalid token', { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    // Atomic update: only flip when token matches AND not already verified
    const { data, error } = await supabase
      .from('comments')
      .update({ verified: true, verify_token: null })
      .eq('verify_token', token)
      .select('id, slug')
      .single();

    if (error || !data) {
      console.error('[COMMENT-VERIFY] no match', error);
      return Response.redirect(new URL(`/blog/${slug}?verify=err#comments`, url), 302);
    }

    return Response.redirect(new URL(`/blog/${data.slug}?verify=ok#comments`, url), 302);
  } catch (e) {
    console.error('[COMMENT-VERIFY] unexpected', e);
    return Response.redirect(new URL(`/blog/${slug}?verify=err#comments`, url), 302);
  }
};
