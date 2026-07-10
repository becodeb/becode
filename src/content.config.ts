import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{json,md}', base: './src/content/projects' }),
  schema: z.object({
    name: z.string(),
    url: z.string().url(),
    description: z.string().max(180),
    stack: z.array(z.string()).min(1),
    category: z.enum(['Productos', 'EdTech', 'Gestión', 'Web', 'Experimentos']),
    status: z.enum(['En producción', 'En lanzamiento']),
    order: z.number().int().positive(),
    screenshot: z.string().optional(),
  }),
});

export const collections = { projects };
