import type { APIRoute } from 'astro';
import { password, setCookieHeader } from '../../lib/admin';

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown> = {};
  try {
    if ((request.headers.get('content-type') ?? '').includes('application/json')) {
      body = await request.json();
    } else {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
    }
  } catch {
    body = {};
  }

  const submitted = typeof body.password === 'string' ? body.password.trim() : '';
  const expected = password();
  if (!expected) {
    return new Response(JSON.stringify({ ok: false, error: 'server_misconfigured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (submitted !== expected) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_password' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': setCookieHeader(),
    },
  });
};

export const GET: APIRoute = async ({ redirect }) => redirect('/admin/login', 303);
