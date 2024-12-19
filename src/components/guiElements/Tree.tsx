import { useState } from 'react';

interface ItemWithParentId {
  id: string;
  parentId?: string;
  title: string;
}

interface IIndexedNestedItem extends ItemWithParentId {
  children?: {
    [key: string]: IIndexedNestedItem;
  };
}

export class NestedItem<T extends ItemWithParentId = ItemWithParentId> {
  id = '';

  parentId?: string;

  title = '';

  children: NestedItem[] = [];

  constructor(item: T) {
    this.id = item.id;
    this.parentId = item.parentId;
    this.title = item.title;
  }
}

export function makeTree<T extends ItemWithParentId>(items: T[]): NestedItem<T>[] {
  const result: NestedItem<T>[] = [];
  const itemsMap = new Map<string, NestedItem<T>>();

  // First pass: create all nodes
  items.forEach((item) => {
    itemsMap.set(item.id, new NestedItem(item));
  });

  // Second pass: establish parent-child relationships
  items.forEach((item) => {
    const node = itemsMap.get(item.id)!;
    if (!item.parentId) {
      result.push(node);
    } else {
      const parent = itemsMap.get(item.parentId)!;
      parent.children.push(node);
    }
  });

  return result;
}

export function makeIndexedTree<T extends ItemWithParentId>(items: T[]): IIndexedNestedItem[] {
  const result: IIndexedNestedItem[] = [];
  items.forEach((item) => {
    if (!item.parentId) {
      result.push(item);

      return;
    }

    const parentInResult = result.find((i) => i.id === item.parentId);
    const parent = parentInResult || items.find((i) => i.id === item.parentId);

    if (!parent) {
      throw new Error('Parent not found');
    }

    const nestedParent = parent as IIndexedNestedItem;

    if (!nestedParent.children) {
      nestedParent.children = {};
    }

    if (!nestedParent.children[item.id]) {
      nestedParent.children[item.id] = item as IIndexedNestedItem;
    }
  });

  return result;
}

export function TreeList({ list }: { list: NestedItem[] }) {
  return (
    <ul>
      {list && list.length
        ? list.map((listItem) => (
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          <TreeItem key={listItem.id} item={listItem} />
        ))
        : null}
    </ul>
  );
}

export function TreeItem({ item }: { item: NestedItem }) {
  const [displayCurrentChildren, setDisplayCurrentChildren] = useState(
    {} as Record<string, boolean>,
  );

  function handleToggleChildren(getCurrentlabel: string) {
    setDisplayCurrentChildren({
      ...displayCurrentChildren,
      [getCurrentlabel]: !displayCurrentChildren[getCurrentlabel],
    });
  }

  return (
    <li className="rounded p-2 shadow-lg bg-white">
      <div className="menu-item">
        <p>
          {item && item.children && item.children.length ? (
            <span onClick={() => handleToggleChildren(item.title)}>
              {
              displayCurrentChildren[item.title] ? '➖ ' : '➕ '
            }
            </span>
          ) : null}
          {item.title}

        </p>
      </div>

      {item && item.children && item.children.length > 0 && displayCurrentChildren[item.title] ? (
        <TreeList list={item.children} />
      ) : null}
    </li>
  );
}
