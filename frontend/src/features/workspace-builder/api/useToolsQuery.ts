'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import type { CatalogToolItem } from '../types';

interface Response {
  tools: CatalogToolItem[];
}

export function useToolsQuery() {
  return useQuery({
    queryKey: ['catalog', 'tools'],
    queryFn: () => api<Response>('/catalog/tools'),
    select: (d) => d.tools,
  });
}
