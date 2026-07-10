# becode

Sitio oficial de becode, construido con Astro 5, React Islands, Tailwind CSS v4 y Content Collections.

## Desarrollo

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev`: servidor local.
- `npm run build`: validación de tipos y build estático.
- `npm run preview`: vista previa del build.
- `npm run lint`: análisis estático.
- `npm run format`: formato con Prettier.

## Agregar un proyecto

Creá un archivo JSON en `src/content/projects/`. El schema exige `name`, `url`, `description`, `stack`, `category`, `status` y `order`. Podés usar cualquier proyecto existente como referencia.

Las categorías válidas son `Productos`, `EdTech`, `Gestión`, `Web` y `Experimentos`. Los estados posibles son `En producción` y `En lanzamiento`.

## Reemplazar los previews

1. Guardá la captura optimizada dentro de `public/projects/` con una proporción 16:10.
2. Agregá `"screenshot": "/projects/nombre.webp"` al JSON del proyecto.
3. `ProjectImage.tsx` renderiza la captura con dimensiones explícitas, lazy loading y sin cambios de layout.

Para un pipeline completamente administrado por `astro:assets`, importá capturas locales desde un componente Astro y pasá la URL optimizada al island. Los placeholders actuales no descargan recursos y mantienen una proporción estable.

## Deploy

`npm run build` genera un sitio estático en `dist/`, compatible con Vercel, Netlify y Cloudflare Pages.
