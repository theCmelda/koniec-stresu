import { defineMiddleware } from 'astro:middleware';

const PASSWORD = 'Test123';
const COOKIE_NAME = 'cs_unlock';
const COOKIE_VALUE = 'open-2026';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const ALLOWED_PATH_PREFIXES = ['/_astro/', '/_image', '/_vercel/'];
const ALLOWED_PATHS = new Set([
  '/__unlock',
  '/favicon.svg',
  '/robots.txt',
  '/sitemap-index.xml',
  '/sitemap-0.xml',
]);

function isPublicPath(pathname: string): boolean {
  if (ALLOWED_PATHS.has(pathname)) return true;
  return ALLOWED_PATH_PREFIXES.some((p) => pathname.startsWith(p));
}

function comingSoonHTML(error: boolean): string {
  return `<!doctype html>
<html lang="sk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Koniec Stresu — čoskoro spúšťame</title>
<meta name="description" content="Pripravujeme spustenie. Praktické techniky proti stresu, úzkosti a nespavosti.">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#fef6ee; --paper:#fffaf3; --cream:#f9efe1;
    --peach:#fdd8b8; --rose:#e9b29c; --olive:#c4cbb3;
    --terracotta:#d97757; --terracotta-deep:#b85a3e;
    --ink:#2e221a; --soft:#7d6e60; --muted:#a3917f; --rule:#ead7c1;
    --display:'Fraunces',Georgia,serif;
    --sans:'Inter',-apple-system,BlinkMacSystemFont,system-ui,sans-serif;
  }
  html{scroll-behavior:smooth}
  body{
    font-family:var(--sans);
    background:var(--bg);
    color:var(--ink);
    line-height:1.65;
    font-size:17px;
    min-height:100vh;
    display:flex;
    flex-direction:column;
    -webkit-font-smoothing:antialiased;
    overflow-x:hidden;
    position:relative;
  }
  body::before{
    content:'';position:fixed;width:520px;height:520px;border-radius:50%;
    background:radial-gradient(circle,var(--peach),transparent 70%);
    opacity:.5;filter:blur(60px);
    top:-100px;right:-100px;z-index:-1;pointer-events:none;
  }
  body::after{
    content:'';position:fixed;width:600px;height:600px;border-radius:50%;
    background:radial-gradient(circle,var(--rose),transparent 70%);
    opacity:.3;filter:blur(80px);
    bottom:-200px;left:-200px;z-index:-1;pointer-events:none;
  }

  .nav{
    padding:24px 32px;
    display:flex;justify-content:space-between;align-items:center;
    max-width:1200px;width:100%;margin:0 auto;
  }
  .brand{
    font-family:var(--display);font-size:24px;font-weight:500;
    text-decoration:none;color:var(--ink);
    display:flex;align-items:center;gap:10px;
  }
  .brand-mark{
    width:34px;height:34px;border-radius:50%;
    background:linear-gradient(135deg,var(--terracotta),var(--peach));
    box-shadow:inset 0 -4px 8px rgba(0,0,0,.1),0 4px 12px rgba(217,119,87,.25);
  }
  .nav-meta{
    font-size:13px;color:var(--soft);
    background:var(--paper);
    padding:7px 16px;border-radius:999px;
    border:1px solid var(--rule);
  }
  .nav-meta .dot{
    display:inline-block;width:8px;height:8px;border-radius:50%;
    background:var(--terracotta);margin-right:8px;vertical-align:middle;
    animation:pulse 2s infinite;
  }
  @keyframes pulse{
    0%,100%{opacity:1;transform:scale(1)}
    50%{opacity:.4;transform:scale(1.4)}
  }

  main{
    flex:1;
    display:flex;
    align-items:center;
    padding:32px;
  }
  .wrap{
    max-width:920px;
    margin:0 auto;
    width:100%;
    display:grid;
    grid-template-columns:1.3fr 1fr;
    gap:64px;
    align-items:center;
  }

  @media (max-width:780px){
    .wrap{grid-template-columns:1fr;gap:48px}
    main{padding:48px 24px}
  }

  .lead .breadcrumb{
    display:inline-block;
    font-size:11px;font-weight:700;
    letter-spacing:.18em;text-transform:uppercase;
    color:var(--terracotta-deep);
    margin-bottom:24px;
  }
  .lead .breadcrumb::before{
    content:'';display:inline-block;
    width:32px;height:1px;background:var(--terracotta-deep);
    vertical-align:middle;margin-right:12px;
  }

  .lead h1{
    font-family:var(--display);
    font-size:clamp(44px,6.5vw,76px);
    line-height:1.02;font-weight:400;
    letter-spacing:-.025em;
    margin-bottom:24px;
    color:var(--ink);
  }
  .lead h1 em{
    font-style:italic;
    color:var(--terracotta);
    font-weight:300;
  }

  .lead p.tagline{
    font-family:var(--display);
    font-style:italic;font-weight:300;
    font-size:21px;line-height:1.45;
    color:var(--soft);
    margin-bottom:36px;
    max-width:480px;
  }

  .lead .features{
    display:flex;gap:20px;flex-wrap:wrap;
    font-size:14px;color:var(--soft);
  }
  .lead .features span{
    display:inline-flex;align-items:center;gap:8px;
    background:var(--paper);
    padding:8px 14px;border-radius:999px;
    border:1px solid var(--rule);
  }
  .lead .features svg{
    width:14px;height:14px;color:var(--terracotta);
  }

  .gate{
    background:var(--paper);
    border:1px solid var(--rule);
    border-radius:24px;
    padding:36px 32px;
    box-shadow:0 30px 60px -20px rgba(217,119,87,.18);
    position:relative;
  }
  .gate::before{
    content:'';position:absolute;
    top:-1px;left:24px;right:24px;height:2px;
    background:linear-gradient(to right,transparent,var(--terracotta),transparent);
  }
  .gate-label{
    font-family:var(--sans);font-size:11px;font-weight:700;
    letter-spacing:.18em;text-transform:uppercase;
    color:var(--terracotta-deep);
    margin-bottom:14px;
  }
  .gate h2{
    font-family:var(--display);
    font-size:28px;font-weight:500;
    line-height:1.2;letter-spacing:-.01em;
    margin-bottom:10px;
  }
  .gate h2 em{font-style:italic;color:var(--terracotta)}
  .gate p.gate-desc{
    font-size:15px;color:var(--soft);
    margin-bottom:22px;line-height:1.5;
  }
  .gate form{display:flex;flex-direction:column;gap:10px}
  .gate label{
    font-size:13px;font-weight:600;color:var(--ink);
    margin-bottom:-4px;
  }
  .gate input[type=password]{
    background:var(--bg);
    border:1px solid var(--rule);
    border-radius:12px;
    padding:14px 18px;
    font-size:15px;
    color:var(--ink);
    font-family:var(--sans);
    outline:none;
    transition:border-color .2s,box-shadow .2s;
  }
  .gate input[type=password]:focus{
    border-color:var(--terracotta);
    box-shadow:0 0 0 4px rgba(217,119,87,.12);
  }
  .gate button{
    background:var(--ink);
    color:var(--paper);
    border:0;
    border-radius:12px;
    padding:14px 22px;
    font-weight:600;
    font-size:15px;
    cursor:pointer;
    font-family:var(--sans);
    transition:background .2s,transform .15s;
  }
  .gate button:hover{
    background:var(--terracotta);
    transform:translateY(-1px);
  }
  .gate .error{
    background:#fde4d8;
    color:var(--terracotta-deep);
    border:1px solid var(--peach);
    padding:10px 14px;
    border-radius:8px;
    font-size:14px;
    margin-bottom:14px;
  }
  .gate .hint{
    font-size:12px;color:var(--muted);
    margin-top:14px;text-align:center;
    line-height:1.5;
  }

  footer{
    padding:24px 32px;
    text-align:center;
    color:var(--muted);
    font-size:12px;
    border-top:1px solid var(--rule);
  }
  footer .company{
    font-family:var(--display);
    font-style:italic;font-size:14px;
    color:var(--soft);margin-bottom:4px;
  }
</style>
</head>
<body>

<header class="nav">
  <div class="brand">
    <span class="brand-mark"></span>
    <span>Koniec Stresu</span>
  </div>
  <div class="nav-meta">
    <span class="dot"></span>Pripravujeme spustenie
  </div>
</header>

<main>
  <div class="wrap">
    <div class="lead">
      <span class="breadcrumb">Čoskoro / Spring 2026</span>
      <h1>Praktické nástroje pre <em>pokojný</em> nervový systém.</h1>
      <p class="tagline">Žiadne motivačné reči. Žiadny vodopád rád. Konkrétne techniky proti stresu, úzkosti a nespavosti, ktoré vieš začať robiť ešte dnes.</p>
      <div class="features">
        <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12l5 5L20 7"/></svg>20 dlhých článkov</span>
        <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12l5 5L20 7"/></svg>Audio meditácie</span>
        <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12l5 5L20 7"/></svg>30-dňový PDF plán</span>
      </div>
    </div>

    <aside class="gate">
      <div class="gate-label">Súkromný prístup</div>
      <h2>Máš <em>heslo?</em></h2>
      <p class="gate-desc">Stránka je zatiaľ v privátnom režime. Ak ti Daniel poslal heslo, zadaj ho nižšie.</p>
      ${error ? '<div class="error">Nesprávne heslo. Skús znova.</div>' : ''}
      <form method="post" action="/__unlock">
        <label for="password">Heslo</label>
        <input id="password" type="password" name="password" placeholder="••••••••" autocomplete="off" autofocus required>
        <button type="submit">Vstúpiť</button>
      </form>
      <p class="hint">Zatiaľ nemáš prístup? Stránka sa otvorí všetkým čoskoro.</p>
    </aside>
  </div>
</main>

<footer>
  <div class="company">365 ACADEMY OÜ</div>
  <div>Telliskivi tn 57, 10412 Tallinn, Estónsko · Reg. č. 16209274</div>
</footer>

</body>
</html>`;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);

  if (isPublicPath(url.pathname)) {
    return next();
  }

  const cookie = context.cookies.get(COOKIE_NAME);
  if (cookie?.value === COOKIE_VALUE) {
    return next();
  }

  const error = url.searchParams.get('error') === '1';

  return new Response(comingSoonHTML(error), {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
});

export { PASSWORD, COOKIE_NAME, COOKIE_VALUE, COOKIE_MAX_AGE };
