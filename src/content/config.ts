import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Daniel Jedlička'),
    videoId: z.string().optional(),
    videoTitle: z.string().optional(),
    /** Where to render the video on the page. */
    videoPlacement: z.enum(['top', 'middle', 'bottom', 'remove']).default('top'),
    category: z.string().default('Stres'),
    readingTime: z.number().optional(),
    /** Article-specific transformation outcome used in CTA (e.g. "hlbší spánok bez tabletiek") */
    transformation: z.string().optional(),
    /** Legacy: per-article lead magnet copy. Kept for backward-compat but the CTA now defaults to the unified 30-day course pitch using `transformation`. */
    leadMagnet: z
      .object({
        title: z.string(),
        description: z.string(),
        buttonText: z.string().default('Stiahnuť plán'),
      })
      .optional(),
    keywords: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
  }),
});

export const collections = { blog };
