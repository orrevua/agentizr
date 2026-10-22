'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import type { TreeNode } from '../hooks/useFileTree';

interface Props {
  nodes: TreeNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  level?: number;
}

export function FileTree({ nodes, selectedPath, onSelect, level = 0 }: Props) {
  return (
    <ul className="select-none text-sm">
      {nodes.map((node) => (
        <TreeRow
          key={`${level}-${node.name}`}
          node={node}
          level={level}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

function TreeRow({
  node,
  level,
  selectedPath,
  onSelect,
}: {
  node: TreeNode;
  level: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}) {
  const isFolder = node.children.length > 0;
  const [open, setOpen] = useState(level < 2);
  const selected = node.path && node.path === selectedPath;

  if (isFolder) {
    return (
      <li>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-1 rounded px-1 py-0.5 hover:bg-[var(--color-accent)]"
          style={{ paddingLeft: `${level * 12 + 4}px` }}
        >
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          {open ? <FolderOpen className="h-3.5 w-3.5" /> : <Folder className="h-3.5 w-3.5" />}
          <span>{node.name}</span>
        </button>
        {open && (
          <FileTree
            nodes={node.children}
            selectedPath={selectedPath}
            onSelect={onSelect}
            level={level + 1}
          />
        )}
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => node.path && onSelect(node.path)}
        className={cn(
          'flex w-full items-center gap-1 rounded px-1 py-0.5 hover:bg-[var(--color-accent)]',
          selected && 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary)]',
        )}
        style={{ paddingLeft: `${level * 12 + 20}px` }}
      >
        <FileText className="h-3.5 w-3.5" />
        <span>{node.name}</span>
      </button>
    </li>
  );
}
