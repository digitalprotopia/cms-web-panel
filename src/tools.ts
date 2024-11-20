interface ItemWithParentId {
  id: string;
  parentId?: string;
}

interface INestedItem extends ItemWithParentId {
  children?: {
    [key: string]: INestedItem;
  };
}

export default function makeTree<T extends ItemWithParentId>(items: T[]): INestedItem[] {
  const result: INestedItem[] = [];
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

    const nestedParent = parent as INestedItem;

    if (!nestedParent.children) {
      nestedParent.children = {};
    }

    if (!nestedParent.children[item.id]) {
      nestedParent.children[item.id] = item as INestedItem;
    }
  });

  return result;
}
