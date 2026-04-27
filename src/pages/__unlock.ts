import type { APIRoute } from 'astro';

const PASSWORD = 'Test123';
const COOKIE_NAME = 'cs_unlock';
const COOKIE_VALUE = 'open-2026';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  let password: FormDataEntryValue | string | null = null;

  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    password = formData.get('password');
  } else if (contentType.includes('application/json')) {
    const json = await request.json().catch(() => ({}));
    password = (json as Record<string, string>).password ?? null;
  }

  if (typeof password === 'string' && password.trim() === PASSWORD) {
    cookies.set(COOKIE_NAME, COOKIE_VALUE, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      maxAge: COOKIE_MAX_AGE,
    });
    return redirect('/', 303);
  }

  return redirect('/?error=1', 303);
};

export const GET: APIRoute = async ({ redirect }) => redirect('/', 303);
