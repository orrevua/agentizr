'use client';

import { useMutation } from '@tanstack/react-query';
import { env } from '@/shared/lib/env';
import type { WorkspaceDefinitionInput } from '@/features/workspace-builder/schema';

interface ZipResponse {
  blob: Blob;
  filename: string;
}

const FILENAME_RE = /filename="?([^";]+)"?/i;

function parseFilename(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const match = FILENAME_RE.exec(header);
  return match?.[1] ?? fallback;
}

export function useGenerateMutation() {
  return useMutation<ZipResponse, Error, WorkspaceDefinitionInput>({
    mutationFn: async (def) => {
      const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(def),
      });
      if (!res.ok) throw new Error(`Generate failed: ${res.status}`);
      const blob = await res.blob();
      const filename = parseFilename(res.headers.get('Content-Disposition'), 'agentizr.zip');
      return { blob, filename };
    },
  });
}
