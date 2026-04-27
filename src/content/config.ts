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
    category: z.string().default('Stres'),
    readingTime: z.number().optional(),
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
