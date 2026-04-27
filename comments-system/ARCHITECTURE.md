# Comment System — Architecture

## Flow

```
USER                       FRONTEND               BACKEND (Astro API)        SUPABASE        RESEND        OPENAI MODERATION
 │                            │                          │                       │              │                  │
 │  Píše komentár, klikne     │                          │                       │              │                  │
 │  "Pridať komentár"         │                          │                       │              │                  │
 ├─────────────────────────►  │                          │                       │              │                  │
 │  Form expand: meno+email   │                          │                       │              │                  │
 │  Vyplní + submit           │                          │                       │              │                  │
 ├─────────────────────────►  │                          │                       │              │                  │
 │                            │  POST /api/comments      │                       │              │                  │
 │                            │  { slug, name, email,    │                       │              │                  │
 │                            │    body }                │                       │              │                  │
 │                            ├────────────────────────► │                       │              │                  │
 │                            │                          │  rate limit check     │              │                  │
 │                            │                          ├─────────────────────► │              │                  │
 │                            │                          │  moderate(body)       │              │                  │
 │                            │                          ├──────────────────────────────────────────────────────►  │
 │                            │                          │  result: clean/flag   │              │                  │
 │                            │                          │ ◄──────────────────────────────────────────────────────  │
 │                            │                          │  insert pending comment                │                  │
 │                            │                          ├─────────────────────► │              │                  │
 │                            │                          │  create token                         │                  │
 │                            │                          ├─────────────────────► │              │                  │
 │                            │                          │  send magic link email                │                  │
 │                            │                          ├──────────────────────────────────────►              │   │
 │                            │  200 OK                  │                       │              │                  │
 │                            │ ◄────────────────────────                        │              │                  │
 │  "Skontroluj e-mail"       │                          │                       │              │                  │
 │ ◄─────────────────────────                            │                       │              │                  │
 │                                                                                                                  │
 │  Otvorí mail, klikne odkaz                                                                                       │
 ├──────────────────────────────────────────────────────────────────────────────────────────────────────────────►  │
 │                            │  GET /api/verify?t=...   │                       │              │                  │
 │                            ├────────────────────────► │                       │              │                  │
 │                            │                          │  validate token                       │                  │
 │                            │                          ├─────────────────────► │              │                  │
 │                            │                          │  if clean → publish                   │                  │
 │                            │                          │  if flagged → keep as flagged         │                  │
 │                            │                          ├─────────────────────► │              │                  │
 │                            │  302 Redirect            │                       │              │                  │
 │                            │  to /blog/<slug>#c-<id>  │                       │              │                  │
 │ ◄────────────────────────────────────────────────────                         │              │                  │
 │                                                                                                                  │
 │  Vidí svoj komentár v thread-e, anchored                                                                         │
```

## Auto-moderation pipeline

When a comment is submitted, run these checks **in order**:

### 1. Rate limit (server-side)
- Max 3 comments per IP per hour
- Max 5 comments per email per day
- If exceeded → return 429 with friendly message

### 2. Field validation
- `first_name`: 1-50 chars, no URLs, no @
- `email`: valid email format
- `body`: 2-5000 chars, max 3 URLs, max 5 newlines in a row

### 3. Slovak profanity + spam list (custom)
Quick regex pass against:
- Slovak profanity (curated list)
- Common spam patterns (bitcoin, casino, viagra, payday loans, etc.)
- Promo phrases (`navštívte`, `kliknite tu`, `zarobte 1000€`)
- All-caps screaming (>50% capital letters)
- URL spam (>2 URLs)

### 4. OpenAI Moderation API
Call `omni-moderation-latest` (free, multilingual). Categories that auto-flag:
- `harassment` (severe)
- `hate` (severe)
- `self-harm` (severe)
- `sexual` (any)
- `violence` (severe)

### 5. Decision matrix

| Stage 3 result | Stage 4 result | Action |
|---|---|---|
| Clean | Clean | **Auto-publish** when verified |
| Spam pattern | – | **Mark as spam**, no email sent |
| Profanity | – | **Flag**, queue for review |
| – | Severe flag | **Flag**, queue for review |
| – | Mild flag | **Auto-publish** but log score |

When flagged, the user STILL gets the verification email but their comment goes to the **flagged_queue** view in Supabase. Admin (you) reviews via a simple admin page or directly in Supabase Studio. You can approve, edit, or reject.

## API endpoints

All under `src/pages/api/` in Astro:

### POST `/api/comments`
Submit a new comment.

Request:
```json
{
  "slug": "ako-rychlo-zaspat",
  "first_name": "Anna",
  "email": "anna@example.sk",
  "body": "Toto mi reálne pomohlo!",
  "parent_id": null
}
```

Response:
```json
{ "ok": true, "message": "Pošli si overenie do mailu" }
```

### GET `/api/verify?t=<token>`
Magic link landing. Verifies token, marks comment as published (or keeps flagged), redirects user to the article anchored at their comment.

Response: 302 redirect to `/blog/{slug}#comment-{id}`

### GET `/api/comments?slug=<slug>`
Returns all published comments for a post (used by client to render comment list after submission). Cached at edge for 60s.

### POST `/api/admin/moderate` (protected)
Admin endpoint to approve/reject flagged comments. Auth via `ADMIN_API_KEY` header.

## Frontend components

### `<CommentSection slug={slug} />`
- Shows comment count + list of published comments
- "Pridať komentár" button → expands form
- Form: textarea → "Pridať komentár" button → expands to ask name + email → submit
- After submit: success message "Skontroluj svoj e-mail"
- If user comes back via magic link, scrolls smoothly to their comment

### `<CommentForm slug={slug} parentId?={uuid} />`
- 2-step form (anti-frustration UX):
  1. **Step 1**: Just a textarea, "Pridať komentár" button
  2. **Step 2** (after click): expands name + email fields below textarea, "Odoslať" button
- Honeypot field for bot detection
- Inline validation (name length, email format, body length)
- Loading state on submit
- Friendly Slovak error messages

### `<Comment data={comment} />`
- Avatar = colored circle with initial
- First name only (e-mail never shown)
- Relative time ("pred 2 hodinami")
- Body with line breaks preserved, no HTML allowed
- Reply button (sends `parent_id` in submission)
- Anchor: `id="comment-{uuid}"` for magic-link landing

## Email template (Resend)

Single template "comment-verification.html":

```
Subject: Daniel — over svoj komentár ku článku "{post_title}"

Ahoj {first_name},

ďakujem za tvoj komentár pod článkom "{post_title}".

Aby si predišli spamu, prosím over svoj e-mail kliknutím tu:

[Over a publikuj môj komentár]
{magic_link_url}

Odkaz je platný 24 hodín. Ak si komentár nepísal/a ty, ignoruj tento e-mail.

S pokojom,
Daniel
Koniec Stresu
```

## Environment variables

Pridať do `.env` a do Vercel project settings:

```bash
# Supabase
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # service_role secret (server only!)
SUPABASE_ANON_KEY=eyJ...           # anon public key (for public read of published comments)

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL="Koniec Stresu <hello@koniecstresu.sk>"

# OpenAI Moderation
OPENAI_API_KEY=sk-...

# Site
SITE_URL=https://koniecstresu.sk
ADMIN_API_KEY=<random 32 chars>     # protect /api/admin/*

# Rate limiting (optional, for cleanup cron)
SUPABASE_CRON_TOKEN=<random>
```

## Astro config update

Switch from static-only to **hybrid** rendering, since API routes need server runtime:

```js
// astro.config.mjs
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  output: 'hybrid',                  // pages static, API server
  adapter: vercel(),
  // ...rest unchanged
});
```

Each page stays static (great SEO, instant load). Only `/api/*` runs as Vercel Serverless Functions.

## Deployment notes

1. Run `schema.sql` once in Supabase SQL Editor (new project).
2. Set up Resend domain (DNS records for SPF/DKIM at koniecstresu.sk).
3. Add all env vars to Vercel.
4. Deploy.
5. Set up Vercel Cron Job for `cleanup_expired_tokens()`:
   - Endpoint: `/api/cron/cleanup` (calls Supabase RPC)
   - Schedule: `0 3 * * *` (3am daily)

## Daniel's setup checklist

- [ ] Create new Supabase project named **koniec-stresu** (free tier OK to start, ~$0/mes do 500MB)
- [ ] Copy Project URL + service_role key + anon key
- [ ] Open SQL Editor → paste contents of `schema.sql` → Run
- [ ] Sign up for Resend (resend.com), verify your domain `koniecstresu.sk`
- [ ] Generate Resend API key
- [ ] Add 4 env vars to `.env` and Vercel:
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
  - SUPABASE_ANON_KEY
  - RESEND_API_KEY
- [ ] Tell me when done, ja vyhodím code a deployneme
