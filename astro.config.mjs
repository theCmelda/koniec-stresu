import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://koniecstresu.sk',
  trailingSlash: 'never',
  output: 'server',
  adapter: vercel({
    edgeMiddleware: false,
    webAnalytics: { enabled: false },
  }),
  integrations: [sitemap()],
  build: {
    format: 'directory',
  },
});
