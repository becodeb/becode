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

- [ ] T1 Content model: new `proyectos` collection (schema, entries, optimized screenshots); old
      portfolio entries and screenshots removed. Route: delegated (writer, 2+ files).
- [ ] T2 Public layout and tokens: `site.css`, `BaseLayout` without chatbot, header and footer.
      Route: delegated (same writer).
- [ ] T3 Home sections: hero, team, tools, resources, bitácora, join/contact. Route: delegated.
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

## Next step

T1–T3 via one delegated writer, then the direction checkpoint.
