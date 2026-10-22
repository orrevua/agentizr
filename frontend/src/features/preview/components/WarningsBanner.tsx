'use client';

import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/shared/ui/badge';
import type { GenerationWarning } from '../types';

interface Props {
  warnings: GenerationWarning[];
}

export function WarningsBanner({ warnings }: Props) {
  const t = useTranslations('preview');
  if (warnings.length === 0) return null;

  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
      <div className="mb-2 flex items-center gap-2 font-medium text-amber-900">
        <AlertTriangle className="h-4 w-4" />
        {t('warnings')} ({warnings.length})
      </div>
      <ul className="space-y-1">
        {warnings.map((w, i) => (
          <li key={i} className="flex items-start gap-2 text-amber-900">
            <Badge variant="outline" className="border-amber-400 text-amber-900">
              {w.code}
            </Badge>
            <span className="flex-1">{w.message}</span>
            {w.platform && (
              <Badge variant="outline" className="border-amber-400 text-amber-900">
                {w.platform}
              </Badge>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
