'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import type { CatalogMcpItem } from '../types';

interface Response {
  servers: CatalogMcpItem[];
}

export function useMcpServersQuery() {
  return useQuery({
    queryKey: ['catalog', 'mcp-servers'],
    queryFn: () => api<Response>('/catalog/mcp-servers'),
    select: (d) => d.servers,
  });
}
