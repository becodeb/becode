# becode

Sitio oficial de becode + plataforma de gestión de clientes (CRM y portal),
construido con Astro 5, React Islands, Tailwind CSS v4, Prisma y PostgreSQL.

## Qué incluye

- **Landing** (`/`): la página comercial de siempre, prerenderizada. El botón
  "Comenzar proyecto" lleva al registro.
- **Portal de clientes** (`/app`): el cliente se registra, completa el brief
  inteligente en 3–5 minutos, sube archivos, sigue el estado del proyecto
  (checklist + timeline) y chatea con el equipo.
- **CRM** (`/admin`, solo rol OWNER): dashboard con métricas, gestión de
  clientes con filtros y etiquetas, vista de cliente en tres columnas,
  notas internas, checklist, mensajes y biblioteca de conocimiento
  (plantillas de prompts + referencias visuales).
- **Motor de IA**: al aprobar un cliente se generan automáticamente los
  prompts especializados (diseño, frontend, backend, Prisma, SEO, deploy,
  testing, prompt maestro y análisis ejecutivo) a partir del brief.

## Desarrollo

```bash
# 1. Base de datos local
docker run -d --name becode-pg -e POSTGRES_PASSWORD=becode \
  -e POSTGRES_USER=becode -e POSTGRES_DB=becode -p 5434:5432 postgres:16-alpine

# 2. Dependencias y schema
npm install            # corre `prisma generate` vía postinstall
cp .env.example .env   # completar OPENAI_API_KEY
npm run db:push        # sincroniza el schema con la base
npm run db:seed        # crea el usuario OWNER y las etiquetas base

# 3. Servidor
npm run dev
```

`npm run db:seed` imprime la contraseña del OWNER si no definiste
`OWNER_PASSWORD` en el entorno. Cambiala en producción.

## Scripts

- `npm run dev`: servidor local.
- `npm run build`: validación de tipos y build (estáticos + SSR).
- `npm run preview`: vista previa del build.
- `npm run lint` / `npm run format`: calidad de código.
- `npm run db:push`: aplica el schema de Prisma a la base.
- `npm run db:migrate`: crea migraciones versionadas (recomendado en prod).
- `npm run db:seed`: seed de OWNER + etiquetas.
- `npm run db:studio`: explorador visual de la base.

## Arquitectura

```
prisma/schema.prisma        Modelo de datos (usuarios, empresas, proyectos,
                            briefs, archivos, mensajes, timeline, notas,
                            etiquetas, prompts, historial IA, plantillas)
src/lib/server/ai/client.ts Servicio de IA ÚNICO (OpenAI). El chatbot del
                            sitio y la generación de prompts lo comparten:
                            no crear otra integración de IA.
src/lib/server/ai/          site-assistant (prompt del bot) y
                            prompt-generator (documentación por brief)
src/lib/server/auth/        Sesiones en DB + cookie HttpOnly, bcrypt,
                            tokens de recuperación
src/lib/server/             db (Prisma singleton), validación zod,
                            rate limiting, uploads, timeline
src/middleware.ts           Carga de sesión, guardias /app y /admin,
                            chequeo CSRF de origen
src/pages/api/              Endpoints REST (auth, brief, files, messages,
                            admin/*)
src/pages/app/              Portal del cliente
src/pages/admin/            CRM (solo OWNER)
src/layouts/PortalLayout    Shell del portal con dark mode
```

Los archivos subidos van a `UPLOADS_DIR` (default `./uploads`), fuera de git.
El cliente Prisma se genera en `src/generated/` (tampoco se versiona).

## Asistente del sitio (bot de IA)

El chat flotante (`src/components/react/ChatBot.tsx`) responde preguntas
sobre becode usando el endpoint propio `src/pages/api/chat.ts`, que consume
el mismo servicio de IA que el resto de la plataforma.

- **Contexto del bot**: `src/data/company-context.md`. Los proyectos se toman
  automáticamente de `src/content/projects/`.
- **Variables de entorno** (ver `.env.example`): `OPENAI_API_KEY`,
  `OPENAI_MODEL`, `DATABASE_URL`, `UPLOADS_DIR`. Se validan de forma tipada
  vía `astro:env`.
- Todos los endpoints aplican validación con zod y rate limiting simple por
  IP (en memoria, por proceso).

## Agregar un proyecto a la landing

Creá un archivo JSON en `src/content/projects/`. El schema exige `name`,
`url`, `description`, `stack`, `category`, `status` y `order`.

## Deploy

El sitio corre en una VPS propia.

```bash
npm install
npm run build
npm run db:migrate     # o db:push la primera vez
node ./dist/server/entry.mjs
```

El server standalone **no lee `.env` por sí solo**: cargá las variables en el
entorno del proceso (pm2 `env`, systemd `EnvironmentFile`, o
`node --env-file=.env`). En producción conviene:

1. Process manager (`pm2 start "node --env-file=.env dist/server/entry.mjs" --name becode`).
2. Nginx como reverse proxy (TLS, dominio, gzip) apuntando al puerto Node.
3. PostgreSQL gestionado o en la misma VPS con backups.

**Importante**: `astro.config.mjs` define `security.allowedDomains` con
`becode.com.ar`. Si cambiás el dominio, actualizá esa lista: sin el host
permitido, Astro descarta el header Host y rompe las URLs absolutas y el
chequeo CSRF de formularios.
