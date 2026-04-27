import type { APIRoute } from 'astro';

const PASSWORD = 'Test123';
const COOKIE_NAME = 'cs_unlock';
const COOKIE_VALUE = 'open-2026';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function buildCookieHeader(): string {
  return [
    `${COOKIE_NAME}=${COOKIE_VALUE}`,
    'Path=/',
    `Max-Age=${COOKIE_MAX_AGE}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
  ].join('; ');
}

export const POST: APIRoute = async ({ request }) => {
  let password: unknown = null;

  const contentType = request.headers.get('content-type') ?? '';
  try {
    if (contentType.includes('application/json')) {
      const json = await request.json();
      password = (json as Record<string, unknown>).password;
    } else if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const formData = await request.formData();
      password = formData.get('password');
    }
  } catch {
    password = null;
  }

  if (typeof password === 'string' && password.trim() === PASSWORD) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Set-Cookie': buildCookieHeader(),
      },
    });
  }

  return new Response(JSON.stringify({ ok: false, error: 'invalid_password' }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};

export const GET: APIRoute = async ({ redirect }) => redirect('/', 303);
