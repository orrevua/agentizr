'use client';

import { useState } from 'react';
import { PreviewPanel } from '@/features/preview/components/PreviewPanel';
import type { GenerationResult } from '@/features/preview/types';
import { WorkspaceForm } from './WorkspaceForm';

export function WorkspaceBuilder() {
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <WorkspaceForm
        onPreviewResult={(r, l, e) => {
          setResult(r);
          setLoading(l);
          setError(e);
        }}
      />
      <PreviewPanel result={result} isLoading={isLoading} error={error} />
    </div>
  );
}
