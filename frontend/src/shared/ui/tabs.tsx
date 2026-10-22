'use client';

import * as React from 'react';
import { cn } from '@/shared/lib/cn';

interface TabsContextValue {
  value: string;
  onValueChange: (next: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs(): TabsContextValue {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error('Tabs components must be used inside <Tabs>');
  return ctx;
}

export function Tabs({
  value,
  onValueChange,
  className,
  children,
}: {
  value: string;
  onValueChange: (next: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const ctxValue = React.useMemo(() => ({ value, onValueChange }), [value, onValueChange]);
  return (
    <TabsContext.Provider value={ctxValue}>
      <div className={cn('flex flex-col', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex items-center gap-1 border-b border-[var(--color-border)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

export function TabsTrigger({ value, className, children, ...rest }: TabsTriggerProps) {
  const ctx = useTabs();
  const active = ctx.value === value;
  return (
    <div
      role="tab"
      aria-selected={active}
      tabIndex={0}
      onClick={() => ctx.onValueChange(value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          ctx.onValueChange(value);
        }
      }}
      className={cn(
        'inline-flex cursor-pointer items-center gap-2 rounded-t-md border-b-2 px-3 py-1.5 text-sm transition-colors',
        active
          ? 'border-[var(--color-primary)] text-[var(--color-foreground)]'
          : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function TabsContent({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = useTabs();
  if (ctx.value !== value) return null;
  return <div className={cn('pt-4', className)}>{children}</div>;
}
