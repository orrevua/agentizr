'use client';

import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/ui/button';
import { highlight } from '../lib/shiki';
import type { GeneratedFile } from '../types';

interface Props {
  file: GeneratedFile;
}

export function CodeView({ file }: Props) {
  const t = useTranslations('common');
  const [html, setHtml] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    highlight(file.content, file.language).then((out) => {
      if (!cancelled) setHtml(out);
    });
    return () => {
      cancelled = true;
    };
  }, [file]);

  const copy = async () => {
    await navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2">
        <code className="text-xs text-[var(--color-muted-foreground)]">{file.path}</code>
        <Button type="button" size="sm" variant="ghost" onClick={copy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          <span className="ml-1">{copied ? t('copied') : t('copy')}</span>
        </Button>
      </div>
      <div
        className="flex-1 overflow-auto p-3 text-sm [&_pre]:bg-transparent [&_pre]:p-0"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
