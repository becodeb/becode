# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Dummy secrets so Prisma generate and Astro env validation pass during build.
# Real values are injected at runtime via docker-compose or orchestration.
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV OPENAI_API_KEY=sk-dummy-build-key

# Copy lockfiles and prisma schema first so `postinstall` can generate the client.
COPY package.json package-lock.json ./
COPY prisma.config.ts ./
COPY prisma/ ./prisma/

RUN npm ci

# Now copy the rest of the source and build.
COPY tsconfig.json astro.config.mjs eslint.config.js .prettierrc.mjs ./
COPY src/ ./src/
COPY public/ ./public/

RUN npm run build

# Remove devDependencies; keep only what the runner needs.
RUN npm prune --omit=dev


# ── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# PostgreSQL client tools for pg_isready in the entrypoint.
RUN apk add --no-cache postgresql-client

# Non‑root user.
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Runtime dependencies and built artifacts.
COPY --from=builder /app/node_modules       ./node_modules
COPY --from=builder /app/dist               ./dist
COPY --from=builder /app/package.json       ./
COPY --from=builder /app/prisma             ./prisma
COPY --from=builder /app/prisma.config.ts   ./

# Entrypoint that waits for the DB and runs migrations before starting.
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Persistent uploads directory.
RUN mkdir -p /app/uploads && chown appuser:appgroup /app/uploads

USER appuser

EXPOSE 4321

ENV PORT=4321
ENV HOST=0.0.0.0
ENV NODE_ENV=production

ENTRYPOINT ["./docker-entrypoint.sh"]
