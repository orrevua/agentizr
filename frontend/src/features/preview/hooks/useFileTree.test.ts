import { describe, expect, it } from 'vitest';
import { buildTree } from './useFileTree';

describe('buildTree', () => {
  it('returns empty array for no paths', () => {
    expect(buildTree([])).toEqual([]);
  });

  it('nests directories from paths', () => {
    const tree = buildTree(['a/b/c.md', 'a/b/d.md', 'a/e.md']);
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('a');
    const aChildren = tree[0].children;
    expect(aChildren.map((c) => c.name).sort()).toEqual(['b', 'e.md']);
  });

  it('marks leaves with their full path', () => {
    const tree = buildTree(['x/y.md']);
    const y = tree[0].children[0];
    expect(y.path).toBe('x/y.md');
    expect(y.children).toEqual([]);
  });

  it('sorts directories before files alphabetically', () => {
    const tree = buildTree(['z.md', 'a/b.md']);
    expect(tree.map((n) => n.name)).toEqual(['a', 'z.md']);
  });
});
