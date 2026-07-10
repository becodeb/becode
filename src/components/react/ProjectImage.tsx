export interface ProjectImageProps {
  name: string;
  category: string;
  screenshot?: string | undefined;
  priority?: boolean;
  variant?: number;
}

export function ProjectImage({
  name,
  category,
  screenshot,
  priority = false,
  variant,
}: ProjectImageProps) {
  if (screenshot) {
    return (
      <img
        src={screenshot}
        alt={`Vista previa de ${name}`}
        width={1280}
        height={800}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className="h-full w-full object-cover"
      />
    );
  }

  const resolvedVariant =
    variant ??
    Array.from(name).reduce(
      (sum, character) => sum + character.charCodeAt(0),
      0,
    ) % 4;
  const projectCode = name.replace(/\s/g, '').slice(0, 3).toUpperCase();

  return (
    <div
      className={`project-placeholder project-placeholder--${resolvedVariant % 4}`}
      aria-hidden="true"
    >
      <div className="placeholder-toolbar">
        <span className="placeholder-logo">b/</span>
        <span>{category}</span>
        <span>{projectCode}</span>
      </div>
      <div className="placeholder-content">
        <div className="placeholder-copy">
          <span>Producto digital</span>
          <strong>{name}</strong>
          <i />
          <i />
        </div>
        <div className="placeholder-panel">
          <div />
          <div />
          <div />
          <div />
        </div>
      </div>
    </div>
  );
}
