'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import type { CatalogModelItem } from '../types';

interface Response {
  models: CatalogModelItem[];
}

export function useModelsQuery() {
  return useQuery({
    queryKey: ['catalog', 'models'],
    queryFn: () => api<Response>('/catalog/models'),
    select: (d) => d.models,
  });
}
