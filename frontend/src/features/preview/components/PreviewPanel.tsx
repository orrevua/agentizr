'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { buildTree } from '../hooks/useFileTree';
import type { GenerationResult } from '../types';
import { CodeView } from './CodeView';
import { FileTree } from './FileTree';
import { WarningsBanner } from './WarningsBanner';

interface Props {
  result: GenerationResult | null;
  isLoading: boolean;
  error: string | null;
}

export function PreviewPanel({ result, isLoading, error }: Props) {
  const t = useTranslations('preview');
  const tErr = useTranslations('errors');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const tree = useMemo(() => buildTree(result?.files.map((f) => f.path) ?? []), [result]);
  const selectedFile = result?.files.find((f) => f.path === selectedPath) ?? null;

  useEffect(() => {
    if (result && result.files.length > 0 && !selectedPath) {
      setSelectedPath(result.files[0].path);
    }
  }, [result, selectedPath]);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-md border border-dashed border-[var(--color-border)] text-sm text-[var(--color-muted-foreground)]">
        {t('files')}…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-[var(--color-destructive)] bg-red-50 p-3 text-sm text-[var(--color-destructive)]">
        {tErr('previewFailed')}: {error}
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-md border border-dashed border-[var(--color-border)] text-sm text-[var(--color-muted-foreground)]">
        {t('empty')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <WarningsBanner warnings={result.warnings} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr]">
        <aside className="rounded-md border border-[var(--color-border)] p-2">
          <h3 className="mb-2 text-xs font-semibold uppercase text-[var(--color-muted-foreground)]">
            {t('files')}
          </h3>
          <FileTree nodes={tree} selectedPath={selectedPath} onSelect={setSelectedPath} />
        </aside>
        <section className="min-h-[400px] overflow-hidden rounded-md border border-[var(--color-border)]">
          {selectedFile ? (
            <CodeView file={selectedFile} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted-foreground)]">
              {t('noFiles')}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
