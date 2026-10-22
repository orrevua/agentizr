'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import type { CatalogPresetItem } from '../types';

interface Response {
  presets: CatalogPresetItem[];
}

export function usePresetsQuery() {
  return useQuery({
    queryKey: ['catalog', 'presets'],
    queryFn: () => api<Response>('/catalog/presets'),
    select: (d) => d.presets,
  });
}
