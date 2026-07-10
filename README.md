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

## Asistente del sitio (bot de IA)

Hay un chat flotante (`src/components/react/ChatBot.tsx`) que responde preguntas
de clientes sobre becode usando la API de OpenAI desde un endpoint propio
(`src/pages/api/chat.ts`). Por eso el sitio dejó de ser 100% estático: usa
`output: 'server'` con el adapter `@astrojs/node` en modo standalone, y solo
`index.astro` se sigue prerenderizando como HTML estático (`export const
prerender = true`).

- **Contexto del bot**: `src/data/company-context.md` (quiénes somos, servicios,
  proceso, tono de respuesta). Editalo a mano cuando cambie algo de la empresa.
  Los proyectos se toman automáticamente de `src/content/projects/`, no hace
  falta duplicarlos ahí.
- **Variables de entorno** (ver `.env.example`): `OPENAI_API_KEY` (obligatoria) y
  `OPENAI_MODEL` (opcional, default `gpt-4o-mini`). Se validan de forma tipada
  vía `astro:env`, así que si falta la key el build/arranque lo va a advertir.
- El endpoint valida el tamaño de los mensajes y aplica un límite simple de
  requests por IP (en memoria, por proceso).

## Deploy

El sitio corre en una VPS propia, no en Vercel/Netlify/Cloudflare.

```bash
npm install
npm run build          # genera dist/client (estáticos) y dist/server (SSR)
cp .env.example .env   # completar OPENAI_API_KEY antes de arrancar
node ./dist/server/entry.mjs
```

El server Node standalone escucha en `HOST`/`PORT` (por defecto `0.0.0.0:4321`).
En producción conviene:

1. Mantenerlo vivo con un process manager (`pm2 start dist/server/entry.mjs
   --name becode`) para que se reinicie solo ante caídas o reboots.
2. Ponerlo detrás de Nginx como reverse proxy (TLS, dominio, gzip) apuntando al
   puerto del proceso Node.
3. Cargar las variables de entorno del paso anterior (`OPENAI_API_KEY`,
   `OPENAI_MODEL`, `PORT`) en el entorno del proceso, no solo en `.env` local.
