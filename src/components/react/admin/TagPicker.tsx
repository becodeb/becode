import { useState } from 'react';
import { requestJson } from '@/lib/client/api';

interface TagOption {
  id: string;
  name: string;
  color: string;
}

export default function TagPicker({
  projectId,
  tags,
  assignedIds,
}: {
  projectId: string;
  tags: TagOption[];
  assignedIds: string[];
}) {
  const [busy, setBusy] = useState(false);

  async function toggleTag(tag: TagOption) {
    if (busy) return;
    setBusy(true);
    const assigned = assignedIds.includes(tag.id);
    await requestJson(`/api/admin/projects/${projectId}/tags`, {
      method: assigned ? 'DELETE' : 'POST',
      body: { tagId: tag.id },
    });
    window.location.reload();
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => {
        const assigned = assignedIds.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            disabled={busy}
            aria-pressed={assigned}
            onClick={() => void toggleTag(tag)}
            className="rounded-full border px-2.5 py-1 text-xs font-semibold transition-opacity disabled:opacity-50"
            style={
              assigned
                ? {
                    background: tag.color,
                    borderColor: tag.color,
                    color: '#fff',
                  }
                : { borderColor: `${tag.color}66`, color: tag.color }
            }
          >
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
