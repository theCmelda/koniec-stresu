/**
 * Resend wrapper for transactional emails (comment verification, etc).
 *
 * env required:
 *   RESEND_API_KEY   — re_... key
 *   RESEND_FROM      — sender, e.g. "Koniec Stresu <hello@koniecstresu.sk>"
 */
interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(args: SendEmailArgs): Promise<{ ok: boolean; error?: string }> {
  const apiKey = import.meta.env.RESEND_API_KEY ?? process.env.RESEND_API_KEY;
  const from = import.meta.env.RESEND_FROM ?? process.env.RESEND_FROM ?? 'Koniec Stresu <onboarding@resend.dev>';
  if (!apiKey) return { ok: false, error: 'missing_api_key' };

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text ?? args.html.replace(/<[^>]+>/g, ''),
      }),
    });
    if (!r.ok) {
      const body = await r.text().catch(() => '');
      return { ok: false, error: `resend_${r.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: 'fetch_failed' };
  }
}
