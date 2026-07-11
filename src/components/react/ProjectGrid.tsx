import { useEffect, useMemo, useRef, useState } from 'react';
import { animate, onScroll } from 'animejs';
import { ProjectImage } from './ProjectImage';

export interface ProjectData {
  id: string;
  name: string;
  url: string;
  description: string;
  stack: string[];
  category: 'Productos' | 'EdTech' | 'Gestión' | 'Web' | 'Experimentos';
  status: 'En producción' | 'En lanzamiento';
  order: number;
  screenshot?: string | undefined;
}

export interface ProjectGridProps {
  projects: ProjectData[];
}

interface ProjectCardProps {
  project: ProjectData;
  index: number;
  prominence: 'primary' | 'featured' | 'compact';
}

const filters = [
  'Todos',
  'Productos',
  'EdTech',
  'Gestión',
  'Web',
  'Experimentos',
] as const;
type Filter = (typeof filters)[number];

function ProjectCard({ project, index, prominence }: ProjectCardProps) {
  const isPrimary = prominence === 'primary';
  const isFeatured = prominence !== 'compact';

  return (
    <article
      className={`project-card project-card--${prominence} ${
        isFeatured ? 'project-card--spotlight' : ''
      } min-w-0`}
    >
      <a
        href={project.url}
        target="_blank"
        rel="noreferrer"
        className="project-visual border-line bg-surface block overflow-hidden rounded-[var(--radius-ui)] border"
        data-project-reveal
        aria-label={`Visitar ${project.name}, abre en una pestaña nueva`}
      >
        <div
          className={
            isPrimary
              ? 'project-frame aspect-[16/9]'
              : 'project-frame aspect-[16/10]'
          }
        >
          <ProjectImage
            name={project.name}
            category={project.category}
            screenshot={project.screenshot}
            priority={index < 3}
            variant={index}
          />
        </div>
        <span className="project-curtain" aria-hidden="true">
          <span>load.project_{String(index + 1).padStart(2, '0')}</span>
        </span>
      </a>

      <div className="project-copy" data-project-copy>
        {isFeatured && (
          <div className="project-meta flex items-center justify-between gap-4">
            <span className="project-index text-muted font-mono text-xs">
              {String(index + 1).padStart(2, '0')} / 03
            </span>
            <a
              href={project.url}
              target="_blank"
              rel="noreferrer"
              className="project-arrow border-ink hover:bg-ink hover:text-surface grid shrink-0 place-items-center rounded-[var(--radius-ui)] border font-bold transition-colors"
              aria-label={`Abrir ${project.name} en una pestaña nueva`}
              title="Abrir proyecto"
            >
              ↗
            </a>
          </div>
        )}
        <div className="project-heading mt-2 flex min-w-0 items-start justify-between gap-4">
          <h3 className="project-name font-display font-semibold">
            {project.name}
          </h3>
          {!isFeatured && (
            <a
              href={project.url}
              target="_blank"
              rel="noreferrer"
              className="project-arrow border-ink hover:bg-ink hover:text-surface grid shrink-0 place-items-center rounded-[var(--radius-ui)] border font-bold transition-colors"
              aria-label={`Abrir ${project.name} en una pestaña nueva`}
              title="Abrir proyecto"
            >
              ↗
            </a>
          )}
        </div>
        <p className="project-description text-muted mt-3 leading-6">
          {project.description}
        </p>
        <ul
          className="project-stack mt-4 flex flex-wrap gap-x-3 gap-y-1"
          aria-label={`Tecnologías de ${project.name}`}
        >
          {project.stack.map((technology) => (
            <li key={technology} className="text-muted font-mono">
              {technology}
            </li>
          ))}
        </ul>
        {isFeatured && (
          <span className="project-category mt-7 block font-mono text-[0.65rem] uppercase">
            {project.category}
          </span>
        )}
      </div>
    </article>
  );
}

export default function ProjectGrid({ projects }: ProjectGridProps) {
  const [activeFilter, setActiveFilter] = useState<Filter>('Todos');
  const [showAllProjects, setShowAllProjects] = useState(false);
  const portfolioRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const visibleProjects = useMemo(
    () =>
      activeFilter === 'Todos'
        ? projects
        : projects.filter((project) => project.category === activeFilter),
    [activeFilter, projects],
  );

  const featuredProjects = visibleProjects.slice(0, 3);
  const compactProjects = visibleProjects.slice(3);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setShowAllProjects(false);
    const portfolio = portfolioRef.current;
    if (!portfolio) return;
    const top = portfolio.getBoundingClientRect().top + window.scrollY - 80;
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [activeFilter]);

  useEffect(() => {
    const portfolio = portfolioRef.current;
    if (
      !portfolio ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const animations = Array.from(
      portfolio.querySelectorAll<HTMLElement>('[data-project-reveal]'),
    ).flatMap((visual, index) => {
      const frame = visual.querySelector<HTMLElement>('.project-frame');
      const curtain = visual.querySelector<HTMLElement>('.project-curtain');
      const card = visual.closest<HTMLElement>('.project-card');
      if (!frame || !curtain || !card) return [];

      const isSpotlight = card.classList.contains('project-card--spotlight');
      const copy = card.querySelector<HTMLElement>('[data-project-copy]');
      const direction = index % 2 === 0 ? -1 : 1;
      const useLateralMotion = window.matchMedia('(min-width: 64rem)').matches;
      const scrollSettings = {
        target: visual,
        enter: 'bottom top',
        leave: '35% top',
        sync: isSpotlight ? 'out(3)' : 'out(2)',
      } as const;

      const projectAnimations = [
        animate(frame, {
          x: [direction * (isSpotlight ? 48 : 32), 0],
          y: [isSpotlight ? 36 : 26, 0],
          scale: [isSpotlight ? 0.96 : 0.98, 1],
          rotate: isSpotlight ? [direction * 0.65, 0] : 0,
          ease: 'out(4)',
          autoplay: onScroll(scrollSettings),
        }),
        animate(curtain, {
          scaleX: [1, 0],
          ease: 'inOut(3)',
          autoplay: onScroll(scrollSettings),
        }),
      ];

      if (isSpotlight && copy) {
        projectAnimations.push(
          animate(copy, {
            x: useLateralMotion ? [direction * -34, 0] : 0,
            y: [18, 0],
            ease: 'out(4)',
            autoplay: onScroll(scrollSettings),
          }),
        );
      }

      return projectAnimations;
    });

    return () => {
      animations.forEach((animation) => animation.revert());
    };
  }, [activeFilter, visibleProjects.length, showAllProjects]);

  return (
    <div ref={portfolioRef}>
      <div
        className="filter-strip mb-12 flex gap-1.5 overflow-x-auto pb-2"
        role="group"
        aria-label="Filtrar proyectos"
      >
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            aria-pressed={activeFilter === filter}
            onClick={() => setActiveFilter(filter)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors active:translate-y-px ${
              activeFilter === filter
                ? 'border-ink bg-ink text-surface'
                : 'bg-paper text-muted hover:border-line hover:text-ink border-transparent'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        {visibleProjects.length} proyectos visibles
      </p>

      <div className="featured-projects">
        {featuredProjects.map((project, index) => (
          <ProjectCard
            key={project.id}
            project={project}
            index={index}
            prominence={index === 0 ? 'primary' : 'featured'}
          />
        ))}
      </div>

      {compactProjects.length > 0 && (
        <div className="project-outro border-line mt-20 border-t pt-12 sm:mt-24 sm:pt-14">
          <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-8">
            <div>
              <p className="eyebrow text-signal mb-4">Siguiente paso</p>
              <h3 className="font-display text-3xl font-semibold sm:text-4xl">
                ¿Viste suficiente?
              </h3>
              <p className="text-muted mt-4 max-w-md leading-7">
                Hay muchos otros proyectos para recorrer. Podés seguir mirando o
                vamos directo a hablar del tuyo.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {!showAllProjects && (
                <button
                  type="button"
                  onClick={() => setShowAllProjects(true)}
                  className="border-ink hover:bg-ink hover:text-surface rounded-[var(--radius-ui)] border px-6 py-3.5 font-bold transition-colors active:translate-y-px"
                >
                  Ver otros proyectos
                </button>
              )}
              <a
                href="#contacto"
                className="bg-signal text-surface hover:bg-signal-dark rounded-[var(--radius-ui)] px-6 py-3.5 font-bold transition-colors active:translate-y-px"
              >
                Sí, hablemos <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {compactProjects.length > 0 && showAllProjects && (
        <div className="compact-projects">
          <div className="compact-heading border-line mb-8 flex items-end justify-between gap-6 border-t pt-8">
            <h3 className="font-display text-2xl font-semibold">
              Más proyectos
            </h3>
            <span className="text-muted font-mono text-xs">
              Selección ampliada
            </span>
          </div>
          <div className="project-compact-grid grid gap-x-8 gap-y-16 lg:grid-cols-2">
            {compactProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index + featuredProjects.length}
                prominence="compact"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
