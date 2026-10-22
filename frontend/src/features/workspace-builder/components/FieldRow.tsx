'use client';

import type { ReactNode } from 'react';
import { Label } from '@/shared/ui/label';

interface Props {
  htmlFor?: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function FieldRow({ htmlFor, label, hint, error, children }: Props) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-[var(--color-muted-foreground)]">{hint}</p>
      )}
      {error && <p className="text-xs text-[var(--color-destructive)]">{error}</p>}
    </div>
  );
}
