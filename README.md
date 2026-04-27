# Koniec Stresu

Slovak wellness blog by Daniel Jedlička. Built with [Astro](https://astro.build/) for SEO‑first static delivery, designed in the Apricot Wellness theme.

## Stack

- **Astro 5** with content collections (typed Markdown)
- **Vanilla CSS** with Apricot Wellness design tokens (Fraunces + Inter)
- **Sitemap + RSS** built in
- **Schema.org** Article markup on every blog post
- **Vercel** for hosting (zero-config deploy)

## Local development

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (http://localhost:4321)
npm run dev

# 3. Build for production (outputs to ./dist)
npm run build

# 4. Preview production build locally
npm run preview
```

Requires Node 18.17+ or Node 20+.

## Project structure

```
site/
├── astro.config.mjs           # Astro config (site URL, integrations)
├── package.json
├── public/                     # Static files (favicon, robots.txt, OG images)
├── src/
│   ├── components/             # Nav, Footer, ArticleCard, CTASection, VideoEmbed
│   ├── content/
│   │   ├── config.ts           # Blog collection schema
│   │   └── blog/               # Markdown posts (one .md per article)
│   ├── layouts/
│   │   ├── BaseLayout.astro    # HTML shell, SEO meta, fonts
│   │   └── BlogLayout.astro    # Blog post layout (hero, video, prose, CTA)
│   ├── pages/
│   │   ├── index.astro         # Homepage
│   │   ├── blog/
│   │   │   ├── index.astro     # All articles
│   │   │   └── [...slug].astro # Dynamic blog post
│   │   ├── ochrana-osobnych-udajov.astro
│   │   └── obchodne-podmienky.astro
│   └── styles/
│       └── global.css          # Apricot tokens + .prose typography
└── tsconfig.json
```

## Adding a new article

1. Create `src/content/blog/<slug>.md`. The filename becomes the URL: `/blog/<slug>`.
2. Add frontmatter:

   ```yaml
   ---
   title: "Tvoj nadpis článku"
   description: "Krátka SEO description, max 155 znakov."
   publishDate: 2026-05-01
   category: Stres
   readingTime: 7
   videoId: YOUTUBE_VIDEO_ID
   videoTitle: "Pôvodný titulok videa"
   featured: false
   keywords: ["primárne kw", "sekundárne kw"]
   leadMagnet:
     title: "<em>Lead magnet</em> nadpis"
     description: "Popis lead magnetu."
     buttonText: "Stiahnuť"
   ---

   Telo článku v markdowne...
   ```

3. Píš telo článku v normálnom markdowne. Video sa automaticky vloží pod hero (z `videoId`). Žiadny iframe HTML netreba.
4. Commit + push. Vercel automaticky vytvorí preview a deployne.

## Deploy to GitHub + Vercel

### One‑time setup

```bash
# 1. Init git repo locally (in this site/ folder)
cd site
git init
git add .
git commit -m "Initial commit"

# 2. Create empty repo on GitHub (cez web)
# napr. https://github.com/new -> "koniec-stresu-blog"

# 3. Push
git remote add origin git@github.com:<tvoj-username>/koniec-stresu-blog.git
git branch -M main
git push -u origin main

# 4. Pripoj Vercel
#   a) https://vercel.com/new -> Import Git Repository -> vyber svoj repo
#   b) Framework Preset: Astro (Vercel ho zdetekuje automaticky)
#   c) Click Deploy
```

### Pridanie domény

Vo Vercel projekte → Settings → Domains → pridaj `koniecstresu.sk`. Vercel ti dá DNS záznamy, ktoré nastavíš u svojho registrátora domén.

### Continuous deployment

Po prvom deploye stačí pushovať na `main` (alebo merge cez PR) a Vercel automaticky:

- vytvorí preview deploy pre každý PR;
- pri merge do `main` deployne na produkciu;
- generuje sitemap, robots.txt, RSS feed.

## TODO pred prvým produkčným deployom

- [ ] Doplniť IČO, sídlo a údaje predávajúceho v `src/pages/ochrana-osobnych-udajov.astro` a `src/pages/obchodne-podmienky.astro` (hľadaj `[DOPLŇ]`).
- [ ] Nahradiť `https://koniecstresu.sk` v `astro.config.mjs` ak je iná doména.
- [ ] Pripojiť reálnu newsletter integráciu (ConvertKit, MailerLite, Buttondown) v `src/components/CTASection.astro` namiesto `alert()`.
- [ ] Pridať OG image (`public/og-default.jpg`, 1200×630px) — alebo použiť `@vercel/og` na auto‑generovanie.
- [ ] Pridať analytics (Plausible / Vercel Analytics) do `BaseLayout.astro`.
- [ ] Voliteľne: cookies banner pre EU compliance (napr. CookieYes, Cookiebot, vlastný banner).

## Performance

Cieľ: **Lighthouse 100 / 100 / 100 / 100**.

Astro generuje statické HTML bez JavariScriptu pre väčšinu stránok. Jediný JS, ktorý sa načíta, je `<details>` (native HTML) pre FAQ a YouTube iframe (lazy loaded).

Pre dosiahnutie 100 v Performance:
- YouTube iframe je `loading="lazy"`.
- Google Fonts sa načítavajú s `display=swap`.
- Žiadne externé reklamné skripty.
- CSS inline pre kritickú cestu (Astro to robí automaticky).

## Licencia

Obsah © Daniel Jedlička. Kód MIT.
