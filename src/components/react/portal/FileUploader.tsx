import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { requestJson } from '@/lib/client/api';

interface FileItem {
  id: string;
  filename: string;
  size: number;
  canDelete: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUploader({
  files,
  projectId,
  canUpload,
}: {
  files: FileItem[];
  projectId?: string;
  canUpload: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(selected: FileList | null) {
    if (!selected || selected.length === 0 || uploading) return;
    setError(null);
    setUploading(true);

    for (const file of Array.from(selected)) {
      const form = new FormData();
      form.append('file', file);
      if (projectId) form.append('projectId', projectId);

      try {
        const response = await fetch('/api/files', {
          method: 'POST',
          body: form,
        });
        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(data?.error ?? 'No pudimos subir el archivo.');
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'No pudimos subir el archivo.',
        );
        setUploading(false);
        return;
      }
    }

    window.location.reload();
  }

  async function handleDelete(id: string) {
    const result = await requestJson(`/api/files/${id}`, { method: 'DELETE' });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    window.location.reload();
  }

  return (
    <div className="space-y-3">
      {files.length === 0 ? (
        <p className="text-muted text-sm">Todavía no subiste archivos.</p>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="border-line bg-paper flex items-center justify-between gap-2 rounded-[var(--radius-ui)] border px-3 py-2"
            >
              <a
                href={`/api/files/${file.id}`}
                className="hover:text-signal min-w-0 flex-1 truncate text-sm font-medium"
                download
              >
                {file.filename}
              </a>
              <span className="text-dim shrink-0 font-mono text-[0.65rem]">
                {formatSize(file.size)}
              </span>
              {file.canDelete && (
                <button
                  type="button"
                  onClick={() => handleDelete(file.id)}
                  aria-label={`Eliminar ${file.filename}`}
                  className="text-muted hover:text-signal grid h-7 w-7 shrink-0 place-items-center rounded transition-colors"
                  title="Eliminar archivo"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-signal text-xs">
          {error}
        </p>
      )}

      {canUpload && (
        <>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="sr-only"
            aria-label="Elegir archivos"
            onChange={(e) => void handleFiles(e.target.files)}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="border-line hover:border-ink text-muted hover:text-ink flex w-full items-center justify-center gap-2 rounded-[var(--radius-ui)] border border-dashed px-4 py-4 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Upload size={16} aria-hidden="true" />
            {uploading ? 'Subiendo…' : 'Elegir archivos'}
          </button>
          <p className="text-dim text-xs">Hasta 25 MB por archivo.</p>
        </>
      )}
    </div>
  );
}
