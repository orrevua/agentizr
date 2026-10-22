'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { api } from '@/shared/lib/api-client';

interface RawCondition {
  id: string;
  labelEn: string;
  labelPtBr: string;
}

interface Response {
  conditions: RawCondition[];
}

export interface HandoffCondition {
  id: string;
  label: string;
}

export function useHandoffConditions(): {
  data: HandoffCondition[];
  isLoading: boolean;
} {
  const locale = useLocale();
  const query = useQuery({
    queryKey: ['catalog', 'handoff-conditions'],
    queryFn: () => api<Response>('/catalog/handoff-conditions'),
  });
  const data = (query.data?.conditions ?? []).map((c) => ({
    id: c.id,
    label: locale === 'pt-br' ? c.labelPtBr : c.labelEn,
  }));
  return { data, isLoading: query.isLoading };
}
