# Feature: public site redesign as an education brand

Locator: `odd/tasks/sitio-educacion.md` · Engram mirror: `odd/sitio-educacion/tasks` (project `becode`)
Branch: `feat/sitio-educacion` (from `master` @ ea88321)

## Objective

Turn becode.com.ar from a "custom software agency" into the public face of an education brand:
tools for teachers made from inside the school. The brand BeCode stays; positioning changes.

## Why

The agency never got clients. The team (three Northfield School alumni who now work there as tech
assistants and programming/robotics teachers) found its real work in education. Melina Massnatta
presents the case on 2026-10-09 to ~300 teachers and then to the Chubut Ministry of Education; the
site must tell the same story as the deck and let teachers follow what the team ships.

Brief: `~/projects/_briefs/becode-educacion/` (contexto, estadisticas, competencia, marcas, deck).

## Scope

- Public site only: `/`, `/terminos-y-condiciones`, new public pages if needed.
- Main tools with real screenshots: Kodu, Testra (demo `/demo`), Echo (name must be data only), Loop.
- Classroom resources and experiments with direct links.
- Tracking ("bitácora"): adding a project = adding one content entry with date, status, link.
- Contact / join path for teachers and schools.
- Remove the old client portfolio from the public site.

## Constraints

- Do not break `/login`, `/registro`, `/recuperar`, `/app/*`, `/admin/*`, `/api/*`.
  Portal incoherences are reported to the user, not deleted.
- Only numbers from the brief, with source. No invented stats, testimonials or metrics.
- Non-educational apps listed in `contexto.md` stay out.
- Visual: deck palette (paper, ink, red #d3311d, Outfit + Manrope) as the base; no generic AI look.
- Mobile first. Rioplatense Spanish copy (the site's audience language).
- No push, no deploy without asking.

## Decisions

- **Catalog storage: Astro content collection, not a DB table + admin.** The repo already has a
  `projects` collection; the public pages are prerendered (`prerender = true`) and the middleware
  skips the DB for them on purpose. A Prisma table would make the public home depend on Postgres at
  build/request time, add a migration and an admin screen, for a list that changes a few times a
  month and is edited by developers. One JSON file per project + one screenshot is the cheapest
  correct path. Revisit if non-developers need to publish.
- **Echo rename = data only:** product names, colors and URLs live in the entry; components never
  hardcode a product name.
- **Public chatbot removed from the public layout:** its prompt (`src/data/company-context.md`) sells
  the agency. Portal keeps it. Reported to the user.
- **Separate stylesheet for the public site** (`site.css`) so the portal's `global.css` stays intact.

## TDD

Mode: off. Source: no project/session TDD configuration; the repo has no test runner or test files.
Checks instead: `npm run check` (astro check), `npm run lint`, `npm run build` (with dummy env as in
the Dockerfile), and browser verification (Playwright + system Chromium) at 390px and 1440px, light
and dark, plus smoke of `/login`, `/registro`, `/recuperar`.

## Delivery

Strategy: ask-on-risk. Work-unit commits on `feat/sitio-educacion`; push/PR/deploy are the user's call.
RDD: off globally since 2026-09-23 (user decision) → no review ceremony; ordinary checks apply.

## Tasks

- [x] T1 Content model: new `proyectos` collection (schema, entries, optimized screenshots); old
      portfolio entries and screenshots removed. Route: delegated (writer, 2+ files).
      Commit: 1472a60 feat(content): replace projects collection with education proyectos.
- [x] T2 Public layout and tokens: `site.css`, `BaseLayout` without chatbot, header and footer.
      Route: delegated (same writer). Committed together with T3 (inseparable).
- [x] T3 Home sections: hero, team, tools, resources, bitácora, join/contact. Route: delegated.
      Commit: 1d5544c feat(site): redesign public site as education brand.
      Checks: `npm run check` (48 pre-existing baseline errors in app/brief.astro and
      app/mensajes.astro from Prisma schema drift, unrelated to this change, confirmed
      identical on master before this branch; zero new errors), `npm run lint` (clean),
      `npx astro build` (completes; the gated `npm run build` script only fails because
      its `astro check &&` prefix hits the same pre-existing baseline). Browser-checked at
      390x844 and 1440x900, light and dark, full page: fixed two bugs found this way (dark
      mode not applying because `@theme` cannot be nested in `@media` in Tailwind v4 — fixed
      by overriding plain `--color-*` custom properties instead; the "el margen" red line
      was drawing as separate short bars per section instead of one continuous line — fixed
      by making `<main>` the single grid and `display:contents` sections). `/login`,
      `/registro`, `/recuperar`, `/terminos-y-condiciones`, `/` all return 200 on the dev
      server.
- [x] Desktop review fixes (coordinator pass): stale local Prisma client was the actual
      cause of the 48 `astro check` errors, not a baseline — ran `npx prisma generate`,
      `npm run check` now gives 0 errors and `npm run build` (dummy env) passes fully.
      Fixed: (1) the red "el margen" line only spanned the hero row because
      `grid-row: 1 / -1` resolves against the explicit grid (which had 0 explicit rows),
      not the implicit one — measured via `getBoundingClientRect` (line was 647px of
      main's 6115px); switched the line to an absolutely-positioned child of `<main>`
      instead of a grid-row span; re-measured after the fix: line top/bottom now exactly
      match `<main>`'s own top/bottom (both 88.28 to 6811.6px). (2) `display: contents` on
      each section voided its own Tailwind padding, so desktop sections touched — moved to
      `row-gap: 8rem` on the shared grid (mobile keeps its own `padding-block: 2.5rem` per
      section, i.e. ~5rem between). (3) hero's margin date now sits beside the "Lo último"
      row via a `.margen-nota` (position:absolute, offset back into the margin column from
      a `position:relative` wrapper) instead of the section-level mark; same technique
      drives each bitácora entry's date. Hero mobile thumbnail now 112×70 `object-top`.
      (4) bitácora rebuilt: grouped by month (heading in content column, year not repeated
      per entry), ruled background removed, thumbnail in a fixed-width flex cell so rows no
      longer zigzag. (5) Loop's herramientas image now `aspect-[4/5] object-top` like the
      others, closing the row-1 height gap. (6) Kodu's `capturaMovil` replaced with the new
      gallery mobile capture. (7) confirmed via Playwright (`img.complete && naturalWidth >
      0` over every `document.images`) that all 20 images on `/` loaded after a stepped
      scroll-to-bottom before the full-page capture, in all 4 combinations (1440/390 ×
      light/dark) — 20/20 ok each time; the earlier blank captures were a screenshot-timing
      artifact (native lazy-loading needs scroll proximity), not a real asset failure.
      (8) Camino's resumen copy updated to the unverified-claim-free wording.
      Checks re-run: `npm run check` (0 errors), `npm run lint` (clean), `npm run build`
      with dummy env (completes). Routes still 200. Commit: see git log.
- [ ] CHECKPOINT: show visual direction (2–3 lines + home screenshot) and ask about doubtful apps.
- [ ] T4 Remaining pages: full bitácora view if needed, terms page on the new layout, OG image, meta.
- [ ] T5 Cleanup: delete unused public components/assets; keep portal-shared pieces.
- [ ] T6 Verification: check, lint, build, browser at 390/1440 light/dark, auth/portal smoke.
- [ ] T7 Report portal incoherences and open data questions to the user.

## Acceptance criteria

- A teacher on a phone understands who the team is within the first screen.
- Four main tools shown with real screenshots and working links; Echo's name changes by editing data.
- Resources listed with level, status and direct link.
- Adding a project = one JSON file (+ screenshot); it appears in tools/resources and in the bitácora.
- Contact path works (mailto) for teachers and schools.
- No old client portfolio on the public site. Portal/admin/auth routes still respond.

## Progress

- 2026-10-01: brief read; repo mapped; live apps probed; screenshots of tools and resources captured
  (scratchpad). Branch created.

- 2026-10-01: T1-T3 done by delegated writer + parent fixes. Commits: 1472a60 (content model),
  1d5544c (layout + home), 974df29 (margin line, spacing, bitácora), f5b9dd2 (grid, thumbnails, dates).
  Evidence: astro check 0 errors (after `prisma generate`; the earlier 48 were a stale local client),
  lint clean, full build OK; prod build serves / , /terminos-y-condiciones, /login, /registro,
  /recuperar = 200; /app, /admin = 302. Captures 1440/390 light+dark, no horizontal overflow
  (scrollWidth == clientWidth), red line height == main height, 20/20 images load.
- Echo estado set to "piloto" provisionally (no real use yet); statuses of resources default to
  "experimento" pending confirmation; dates = first git commit of each repo.

## Next step

Direction checkpoint sent to the user (with question about doubtful apps: analitica, smartcampus,
academia, mentelab). Wait for the answer before T4.
