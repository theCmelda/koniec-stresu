import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Discover all blog .md files at build time so the sitemap can include them
// (server-mode dynamic routes are not auto-listed by @astrojs/sitemap).
const SITE_URL = 'https://koniecstresu.sk';
const blogDir = path.join(__dirname, 'src', 'content', 'blog');

const blogPages = fs.existsSync(blogDir)
  ? fs
      .readdirSync(blogDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => `${SITE_URL}/blog/${f.replace(/\.md$/, '')}`)
  : [];

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'never',
  output: 'server',
  adapter: vercel({
    edgeMiddleware: false,
    webAnalytics: { enabled: false },
  }),
  integrations: [
    sitemap({
      // Include the runtime-rendered blog routes
      customPages: blogPages,
      // Skip internal/utility paths
      filter: (page) =>
        !page.includes('/unlock') && !page.includes('/api/'),
    }),
  ],
  build: {
    format: 'directory',
  },
});
