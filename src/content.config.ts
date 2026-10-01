import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// `proyectos`: herramientas en uso y recursos/experimentos de aula.
//
// Para sumar un proyecto nuevo:
//   1. Agregá un JSON en `src/content/proyectos/<slug>.json` con los campos de abajo.
//   2. Agregá la captura de pantalla en `src/assets/capturas/<slug>.webp`
//      (y `<slug>-movil.webp` si aplica) y referenciala en `captura`/`capturaMovil`.
// El proyecto aparece solo: en la sección de herramientas o recursos (según `tipo`)
// y en la bitácora, ordenado por `fecha`.
const proyectos = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/proyectos' }),
  schema: ({ image }) =>
    z.object({
      nombre: z.string(),
      tipo: z.enum(['herramienta', 'recurso']),
      estado: z.enum(['en-uso', 'piloto', 'experimento']),
      fecha: z.coerce.date(),
      url: z.string().url(),
      resumen: z.string().max(160),
      titular: z.string().optional(),
      detalle: z.string().optional(),
      dato: z.string().optional(),
      nivel: z.string().optional(),
      color: z.string().optional(),
      acciones: z
        .array(z.object({ etiqueta: z.string(), url: z.string().url() }))
        .optional(),
      captura: image(),
      capturaMovil: image().optional(),
      formato: z.enum(['movil']).optional(),
      orden: z.number().int().positive().optional(),
    }),
});

export const collections = { proyectos };
