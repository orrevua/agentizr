export interface TreeNode {
  name: string;
  path?: string;
  children: TreeNode[];
}

export function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode = { name: '', children: [] };

  for (const path of paths) {
    const parts = path.split('/').filter(Boolean);
    let cursor = root;
    parts.forEach((part, i) => {
      const isLeaf = i === parts.length - 1;
      let child = cursor.children.find((c) => c.name === part);
      if (!child) {
        child = { name: part, children: [], ...(isLeaf ? { path } : {}) };
        cursor.children.push(child);
      }
      cursor = child;
    });
  }

  const sort = (nodes: TreeNode[]): TreeNode[] => {
    nodes.sort((a, b) => {
      const aDir = a.children.length > 0;
      const bDir = b.children.length > 0;
      if (aDir !== bDir) return aDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => sort(n.children));
    return nodes;
  };

  return sort(root.children);
}
