import type { APIRoute } from 'astro';

/**
 * The /unlock endpoint is no longer used (site is publicly launched).
 * GET redirects to home, POST returns 410 Gone.
 * Kept as a stub so that bookmarks / cached links don't 500.
 */
export const GET: APIRoute = async ({ redirect }) => redirect('/', 308);
export const POST: APIRoute = async () =>
  new Response(JSON.stringify({ ok: false, error: 'gone' }), {
    status: 410,
    headers: { 'Content-Type': 'application/json' },
  });
