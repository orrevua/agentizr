'use client';

import { useMemo, useState } from 'react';
import { ChevronsUpDown, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/shared/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';

export interface CatalogComboboxItem {
  name: string;
  description: string;
  platforms?: string[];
  subtools?: { name: string; description: string }[];
}

interface FlatEntry {
  value: string;
  label: string;
  description: string;
  parent?: string;
}

function flatten(items: CatalogComboboxItem[]): FlatEntry[] {
  return items.flatMap((tool) => {
    const parentEntry: FlatEntry = {
      value: tool.name,
      label: tool.name,
      description: tool.description,
    };
    const subs: FlatEntry[] = (tool.subtools ?? []).map((s) => ({
      value: `${tool.name}/${s.name}`,
      label: s.name,
      description: s.description,
      parent: tool.name,
    }));
    return [parentEntry, ...subs];
  });
}

function filterEntries(entries: FlatEntry[], search: string): FlatEntry[] {
  const q = search.trim().toLowerCase();
  if (!q) return entries;
  const slash = q.indexOf('/');
  if (slash === -1) {
    return entries.filter((e) => e.value.toLowerCase().includes(q));
  }
  const parent = q.slice(0, slash);
  const sub = q.slice(slash + 1);
  return entries.filter(
    (e) => e.parent?.toLowerCase() === parent && (!sub || e.label.toLowerCase().includes(sub)),
  );
}

interface Props {
  items: CatalogComboboxItem[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  emptyLabel: string;
  loading?: boolean;
}

export function CatalogCombobox({
  items,
  value,
  onChange,
  placeholder,
  emptyLabel,
  loading,
}: Props) {
  const t = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const entries = useMemo(() => flatten(items), [items]);
  const visible = useMemo(() => filterEntries(entries, search), [entries, search]);

  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((n) => n !== v) : [...value, v]);
  };
  const remove = (v: string) => onChange(value.filter((n) => n !== v));

  const hasValue = value.length > 0;

  return (
    <TooltipProvider delayDuration={150}>
      <div>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              role="combobox"
              aria-expanded={open}
              disabled={loading}
              className="flex w-full min-h-9 cursor-pointer items-center justify-between gap-2 rounded-md border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-sm hover:bg-[var(--color-muted)]/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="flex flex-1 flex-wrap items-center gap-1 text-left">
                {hasValue ? (
                  value.map((name) => (
                    <Badge key={name} variant="secondary" className="pr-1">
                      <span>{name}</span>
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={`${t('remove')} ${name}`}
                        className="cursor-pointer rounded-sm p-0.5 text-[var(--color-muted-foreground)] hover:bg-red-500/15 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(name);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            remove(name);
                          }
                        }}
                      >
                        <X className="h-3 w-3" />
                      </span>
                    </Badge>
                  ))
                ) : (
                  <span className="text-[var(--color-muted-foreground)]">{placeholder}</span>
                )}
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder={placeholder}
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>{emptyLabel}</CommandEmpty>
                <CommandGroup>
                  {visible.map((entry) => {
                    const selected = value.includes(entry.value);
                    return (
                      <CommandItem
                        key={entry.value}
                        value={entry.value}
                        onSelect={() => toggle(entry.value)}
                        data-selected-state={selected ? 'on' : 'off'}
                        className={entry.parent ? 'pl-8' : ''}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex flex-1 items-center">
                              {entry.parent && (
                                <span className="text-[var(--color-muted-foreground)]">
                                  {entry.parent}/
                                </span>
                              )}
                              {entry.label}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="right" sideOffset={12} className="max-w-xs">
                            {entry.description}
                          </TooltipContent>
                        </Tooltip>
                        {selected && (
                          <span className="text-xs text-[var(--color-muted-foreground)]">✓</span>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </TooltipProvider>
  );
}
