import { ISiteMenuItem } from '@/components/entities/ISiteMenuItem';
import { MenuItemNode } from '../types/types';

export function buildMenuTree(items: ISiteMenuItem[]): MenuItemNode[] {
  const itemMap = new Map<string, MenuItemNode>();
  const roots: MenuItemNode[] = [];

  // First, create all nodes
  items.forEach((item) => {
    itemMap.set(item.id, { ...item, children: [] });
  });

  // Then, build the tree
  items.forEach((item) => {
    const node = itemMap.get(item.id)!;
    if (item.parentId) {
      const parent = itemMap.get(item.parentId);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  // Sort each level by position
  const sortNodes = (nodes: MenuItemNode[]) => {
    nodes.sort((a, b) => a.position - b.position);
    nodes.forEach((node) => sortNodes(node.children));
  };
  sortNodes(roots);

  return roots;
}
