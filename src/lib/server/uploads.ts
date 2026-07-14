import { randomBytes } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { UPLOADS_DIR } from 'astro:env/server';

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

// Tipos que el brief permite adjuntar: logos, manuales de marca, documentos,
// imágenes y videos.
const ALLOWED_MIME_PREFIXES = ['image/', 'video/'];
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
]);

export function isAllowedMimeType(mimeType: string): boolean {
  return (
    ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix)) ||
    ALLOWED_MIME_TYPES.has(mimeType)
  );
}

function uploadsRoot(): string {
  return path.resolve(UPLOADS_DIR);
}

/** Persiste el archivo en disco y devuelve el nombre almacenado. */
export async function storeFile(file: File): Promise<string> {
  const extension = path
    .extname(file.name)
    .slice(0, 12)
    .replace(/[^.\w-]/g, '');
  const storedName = `${randomBytes(16).toString('hex')}${extension}`;
  const root = uploadsRoot();
  await mkdir(root, { recursive: true });
  await writeFile(
    path.join(root, storedName),
    Buffer.from(await file.arrayBuffer()),
  );
  return storedName;
}

export function storedFilePath(storedName: string): string {
  // El nombre viene de la DB (generado por storeFile), pero igual se
  // normaliza para impedir cualquier path traversal.
  const safe = path.basename(storedName);
  return path.join(uploadsRoot(), safe);
}

export async function deleteStoredFile(storedName: string): Promise<void> {
  await unlink(storedFilePath(storedName)).catch(() => {});
}
