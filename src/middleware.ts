import { defineMiddleware } from 'astro:middleware';

/**
 * Site is publicly launched. Middleware is a pass-through — no password gate.
 * Kept as a stub so that any tooling that imports from here doesn't break.
 *
 * Removed on launch: 2026-04-28
 *  - The cs_unlock cookie + Test123 password gate (served comingSoonHTML)
 *  - The /unlock POST endpoint
 */
export const onRequest = defineMiddleware(async (_context, next) => next());
