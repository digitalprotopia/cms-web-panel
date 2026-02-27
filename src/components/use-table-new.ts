import { useQuery, gql, useMutation } from '@apollo/client';
import { useState, useCallback, useMemo } from 'react';
import {
  FieldType, IField, IFieldOptions,
} from './entities/IField';
import { IEntity } from './entities/IEntity';
import { ISiteItem } from './entities/ISiteItem';
import { ISiteMenuItem, ISiteMenuItemType } from './entities/ISiteMenuItem';

type TableField = IField & {
  id: string;
  name: string;
  type: string;
  dbName: string;
  oneToManyLinkOneTable?: {
    id: string;
    isSystem: boolean;
    dbName: string;
  };
  oneToManyLinkManyTable?: {
    id: string;
    isSystem: boolean;
    dbName: string;
  };
  manyToManyLinkFirstTable?: {
    id: string;
    isSystem: boolean;
    dbName: string;
  };
  manyToManyLinkSecondTable?: {
    id: string;
    isSystem: boolean;
    dbName: string;
  };
};

interface TableMeta {
  id: string;
  name: string;
  dbName: string;
  createdAt: string;
  isSystem: boolean;
  fields: TableField[];
}

interface TableData {
  id: string;
  createdAt: string;
  [key: string]: any;
}

export const GET_TABLE_BY_ID = gql`
  query GetTable($id: ID!) {
    getTable(id: $id) {
      id
      name
      dbName
      createdAt
      isSystem
      fields {
        id
        name
        type
        dbName
        isSystem
        position
        oneToManyLinkOneTable {
          id
          isSystem
          dbName
        }
        oneToManyLinkManyTable {
          id
          isSystem
          dbName
        }
        manyToManyLinkFirstTable {
          id
          isSystem
          dbName
        }
        manyToManyLinkSecondTable {
          id
          isSystem
          dbName
        }
      }
    }
  }
`;

export const GET_TABLE_BY_DB_NAME = gql`
  query GetTableByDbName($dbName: String!) {
    getTableByDbName(dbName: $dbName) {
      id
      name
      dbName
      isSystem
      createdAt
      fields {
        id
        name
        type
        dbName
        isSystem
        position
        oneToManyLinkOneTable {
          id
          isSystem
          dbName
        }
        oneToManyLinkManyTable {
          id
          isSystem
          dbName
        }
        manyToManyLinkFirstTable {
          id
          isSystem
          dbName
        }
        manyToManyLinkSecondTable {
          id
          isSystem
          dbName
        }
      }
    }
  }
`;

const getDbName = (table: {
  id: string;
  isSystem: boolean;
  dbName: string;
}) => {
  if (table.isSystem) {
    return `SystemTable${table.dbName}`;
  }
  return table.dbName;
};

const generateFieldSelection = (fields: TableField[]) => fields.map((field) => {
  if (field.type === FieldType.ONE_TO_MANY_ONE) {
    return `${field.dbName}Id`;
  }
  if (field.type === FieldType.ONE_TO_MANY_MANY
        || field.type === FieldType.MANY_TO_MANY_FIRST
        || field.type === FieldType.MANY_TO_MANY_SECOND) {
    return `${field.dbName}Ids`;
  }
  if (field.type === FieldType.USER_CREATOR) {
    return `${field.dbName} { id name }`;
  }
  if (field.type === FieldType.USER) {
    return `${field.dbName} { id name }`;
  }
  if (field.type === FieldType.FILE) {
    return `${field.dbName} { id name extension }`;
  }
  if (field.type === FieldType.FILE_GALLERY) {
    return `${field.dbName} { id name extension }`;
  }
  return field.dbName;
}).join('\n        ');

export const generateGetTableDataQuery = (
  tableName: string,
  fields: TableField[],
  isSystem = false,
) => {
  const tables: string[] = [];
  if (isSystem) {
    tableName = `SystemTable${tableName}`;
  }
  fields.forEach((field) => {
    if (field.type === FieldType.ONE_TO_MANY_ONE
            && !tables.includes(getDbName(field.oneToManyLinkManyTable!))) {
      tables.push(getDbName(field.oneToManyLinkManyTable!));
    }
    if (field.type === FieldType.ONE_TO_MANY_MANY
            && !tables.includes(getDbName(field.oneToManyLinkOneTable!))) {
      tables.push(getDbName(field.oneToManyLinkOneTable!));
    }
    if (field.type === FieldType.MANY_TO_MANY_FIRST
            && !tables.includes(getDbName(field.manyToManyLinkSecondTable!))) {
      tables.push(getDbName(field.manyToManyLinkSecondTable!));
    }
    if (field.type === FieldType.MANY_TO_MANY_SECOND
            && !tables.includes(getDbName(field.manyToManyLinkFirstTable!))) {
      tables.push(getDbName(field.manyToManyLinkFirstTable!));
    }
  });
  return gql`
      query GetTableData($search: ${tableName}Search $offset: Int $count: Int 
        $orderBy: String $orderDirection: OrderDirectionInput
        $orderMany: [OrderClause]
      ) {
        getUsers {
          id
          name
        }
        ${tables.map((table) => `getAll${table} { id _cms_title }`).join('\n')}
          getAll${tableName} (search: $search offset: $offset count: $count 
            orderBy: $orderBy orderDirection: $orderDirection
            orderMany: $orderMany
          ) {
          id
          createdAt
          updatedAt
          createdById
          updatedById
          _cms_title
          ${generateFieldSelection(fields)}
      }
      }
  `;
};

interface UseTableNewOptions {
  onMetaLoaded?: (meta: TableMeta) => void;
  onDataLoaded?: (data: TableData[]) => void;
  search?: any;
  offset?: number;
  count?: number;
  orderMany?: {
    field: string;
    direction: 'asc' | 'desc';
  }[];
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

const useTableNew = (tableId: string, options?: UseTableNewOptions, tableDbName?: string) => {
  const {
    data: tableMetaData,
    loading: metaLoading,
    error: metaError,
    refetch: refetchMeta,
  } = useQuery(tableDbName ? GET_TABLE_BY_DB_NAME : GET_TABLE_BY_ID, {
    variables: tableDbName ? { dbName: tableDbName } : { id: tableId },
    onCompleted: (data) => {
      options?.onMetaLoaded?.(data.getTable || data.getTableByDbName);
    },
    skip: !tableId && !tableDbName,
  });

  const tableMeta = tableMetaData?.getTable || tableMetaData?.getTableByDbName;

  const [lookups, setLookups] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);

  const processRow = useCallback((row: any, fields: TableField[], _lookups: any, _users: any[]) => {
    const newRow = { ...row };
    fields.forEach((field) => {
      if (field.type === FieldType.ONE_TO_MANY_ONE) {
        newRow[field.dbName] = _lookups[newRow[`${field.dbName}Id`]];
      }
      if (field.type === FieldType.ONE_TO_MANY_MANY || field.type === FieldType.MANY_TO_MANY_FIRST
                || field.type === FieldType.MANY_TO_MANY_SECOND) {
        newRow[field.dbName] = (newRow[`${field.dbName}Ids`] || []).map((id: string) => _lookups[id]);
      }
    });

    newRow.createdBy = _users.find((user: any) => user.id === newRow.createdById);
    newRow.updatedBy = _users.find((user: any) => user.id === newRow.updatedById);
    return newRow;
  }, []);

  const extractLookups = useCallback((data: any) => {
    const tables: string[] = [];
    tableMeta?.fields.forEach((field: any) => {
      if (field.type === FieldType.ONE_TO_MANY_ONE
                && !tables.includes(getDbName(field.oneToManyLinkManyTable!))) {
        tables.push(getDbName(field.oneToManyLinkManyTable!));
      }
      if (field.type === FieldType.ONE_TO_MANY_MANY
                && !tables.includes(getDbName(field.oneToManyLinkOneTable!))) {
        tables.push(getDbName(field.oneToManyLinkOneTable!));
      }
      if (field.type === FieldType.MANY_TO_MANY_FIRST
                && !tables.includes(getDbName(field.manyToManyLinkSecondTable!))) {
        tables.push(getDbName(field.manyToManyLinkSecondTable!));
      }
      if (field.type === FieldType.MANY_TO_MANY_SECOND
                && !tables.includes(getDbName(field.manyToManyLinkFirstTable!))) {
        tables.push(getDbName(field.manyToManyLinkFirstTable!));
      }
    });
    const objects: any = {};
    tables.forEach((table) => {
      (data[`getAll${table}`] || []).forEach((row: any) => {
        objects[row.id] = row;
      });
    });
    return {
      objects,
      users: data.getUsers || [],
    };
  }, [tableMeta]);

  const processData = useCallback((data: any, _lookups: any, _users: any[]) => {
    const rows = data[`getAll${tableMeta!.isSystem ? 'SystemTable' : ''}${tableMeta!.dbName}`] || [];
    return rows.map((row: any) => processRow(row, tableMeta!.fields, _lookups, _users));
  }, [tableMeta, processRow]);

  const [localData, setLocalData] = useState<any[] | null>(null);

  const {
    loading: dataLoading,
    error: dataError,
    refetch: refetchData,
    data: tableData,
  } = useQuery(
    generateGetTableDataQuery(tableMeta?.dbName || '', tableMeta?.fields || [], tableMeta?.isSystem),
    {
      skip: !tableMeta?.dbName || !tableMeta?.fields,
      onCompleted: (data) => {
        const { objects, users: _users } = extractLookups(data);
        setLookups(objects);
        setUsers(_users);
        const processed = processData(data, objects, _users);
        setLocalData(processed);
        options?.onDataLoaded?.(processed);
      },
      variables: {
        search: options?.search,
        offset: options?.offset,
        count: options?.count,
        orderMany: options?.orderMany,
        orderBy: options?.orderBy,
        orderDirection: options?.orderDirection,
      },
    },
  );

  const loading = metaLoading || dataLoading;
  const error = metaError || dataError;

  const refetch = useCallback(async () => {
    try {
      const metaResult = await refetchMeta();
      const newMeta = metaResult.data.getTable || metaResult.data.getTableByDbName;

      if (newMeta?.dbName && newMeta?.fields?.length) {
        const dataResult = await refetchData();
        const { objects, users: _users } = extractLookups(dataResult.data);
        setLookups(objects);
        setUsers(_users);
        const processed = processData(dataResult.data, objects, _users);
        setLocalData(processed);
        return {
          meta: newMeta,
          data: processed,
        };
      }
    } catch (_error) {
      console.error('Error refetching table data:', _error);
      throw _error;
    }
  }, [refetchMeta, refetchData, extractLookups, processData]);

  const updateRow = useCallback((rowId: string, updatedRow: any) => {
    setLocalData((prev) => {
      if (!prev) return prev;
      return prev.map((row) => {
        if (row.id === rowId) {
          const merged = { ...row, ...updatedRow };
          return processRow(merged, tableMeta!.fields, lookups, users);
        }
        return row;
      });
    });
  }, [tableMeta, lookups, users, processRow]);

  const addRowToData = useCallback((newRow: any) => {
    const processed = processRow(newRow, tableMeta!.fields, lookups, users);
    setLocalData((prev) => {
      if (!prev) return [processed];
      return [...prev, processed];
    });
  }, [tableMeta, lookups, users, processRow]);

  const removeRow = useCallback((rowId: string) => {
    setLocalData((prev) => {
      if (!prev) return prev;
      return prev.filter((row) => row.id !== rowId);
    });
  }, []);

  const data = useMemo(() => {
    if (localData !== null) return localData;
    if (!tableData) return null;
    const { objects, users: _users } = extractLookups(tableData);
    return processData(tableData, objects, _users);
  }, [localData, tableData, extractLookups, processData]);

  return {
    meta: tableMeta,
    data,
    loading,
    error,
    refetch,
    updateRow,
    addRowToData,
    removeRow,
  } as const;
};

export const useTableNewByDbName = (tableDbName?: string, options?: UseTableNewOptions) => {
  const result = useTableNew('', options, tableDbName);
  return result;
};

export const useAddRow = (dbName: string, fields?: TableField[]) => {
  const fieldSelection = fields ? generateFieldSelection(fields) : '';
  const [addRow] = useMutation(gql`
    mutation($input: ${dbName}Input!) {
      create${dbName}(input: $input) {
        id
        createdAt
        ${fieldSelection}
      }
    }
`);

  return async (data: any) => {
    const result = await addRow({
      variables: {
        input: data,
      },
    });
    return result.data?.[`create${dbName}`];
  };
};

export const useEditRow = (dbName: string, fields?: TableField[]) => {
  const fieldSelection = fields ? generateFieldSelection(fields) : '';
  const [editRowMutation] = useMutation(gql`
    mutation($id: String $input: ${dbName}Input!) {
      edit${dbName}(id: $id input: $input) {
        id
        createdAt
        ${fieldSelection}
      }
    }
`);

  return async (id: string, data: any) => {
    const result = await editRowMutation({
      variables: {
        id,
        input: data,
      },
    });
    return result.data?.[`edit${dbName}`];
  };
};

export const useAddField = (
  tableId: string,
  fieldType: FieldType,
) => {
  let query = gql`
    mutation($tableId: ID! $input: FieldInput!) {
      addField(tableId: $tableId input: $input) {
        id
        name
        type
        tableId
      }
    }
  `;
  if (fieldType === FieldType.ONE_TO_MANY_ONE) {
    query = gql`
      mutation($tableId: ID! $input: FieldInput! $options: FieldOneToManyOptions!) {
        addOneToManyField(tableId: $tableId input: $input options: $options) {
          id
          name
          type
          tableId
        }
      }
    `;
  }

  if (fieldType === FieldType.MANY_TO_MANY_FIRST) {
    query = gql`
      mutation($tableId: ID! $input: FieldInput! $options: FieldManyToManyOptions!) {
        addManyToManyField(tableId: $tableId input: $input options: $options) {
          id
          name
          type
          tableId
        }
      }
    `;
  }
  if (fieldType === FieldType.SLUG) {
    query = gql`
  mutation($tableId: ID! $input: FieldInput! $options: FieldSlugOptions!) {
    addSlugField(tableId: $tableId input: $input options: $options) {
      id
      name
      type
      tableId
    }
  }
  `;
  }
  const [addField] = useMutation(query);

  return (data: Partial<IField>, options?: IFieldOptions) => addField({
    variables: {
      input: {
        ...data,
      },
      tableId,
      options,
    },
  });
};

export const useEditField = () => {
  const [editField] = useMutation(gql`
    mutation($id: ID! $input: FieldInput!) {
      editField(id: $id input: $input) {
        id
        name
        type
        tableId
    }
  }
`);

  return (id: string, data: Partial<IField>) => editField({
    variables: {
      id,
      input: {
        ...data,
      },
    },
  });
};

export const useDeleteField = () => {
  const [deleteField] = useMutation(gql`
    mutation($id: ID!) {
      deleteField(id: $id)
    }
`);

  return (id: string) => deleteField({
    variables: {
      id,
    },
  });
};

export interface ListParams<T> {
  count?: number,
  offset?: number,
  orderBy?: keyof T,
  orderDirection?: 'asc' | 'desc',
}

export const usePosts = (params?: ListParams<IEntity>) => {
  const result = useQuery(gql`
    query GetPosts($params: ListParamsInput) {
      getPosts(params: $params) {
        id
        title
        slug
        content
        blockContent
        preview
        createdAt
        updatedAt
        createdBy {
          id
          name
        }
        updatedBy {
          id
          name
        }
        categories {
          id
          slug
          title
        }
        tags {
          id
          slug
          title
        }
      }
    }
  `, {
    variables: {
      params,
    },
  });

  return result;
};

export const usePostsByTagSlug = (slug: string, params?: ListParams<IEntity>) => {
  const result = useQuery(gql`
    query GetPostsByTagSlug($slug: String! $params: ListParamsInput) {
      getPostsByTagSlug(slug: $slug params: $params) {
        id
        title
        slug
        content
        blockContent
        preview
        createdAt
        updatedAt
        createdBy {
          id
          name
        }
        updatedBy {
          id
          name
        }
        categories {
          id
          slug
          title
        }
        tags {
          id
          slug
          title
        }
      }
    }
  `, {
    variables: {
      slug,
      params,
    },
  });

  return result;
};

export const usePostsByCategorySlug = (slug: string, params?: ListParams<IEntity>) => {
  const result = useQuery(gql`
    query GetPostsByCategorySlug($slug: String! $params: ListParamsInput) {
      getPostsByCategorySlug(slug: $slug params: $params) {
        id
        title
        slug
        content
        blockContent
        preview
        createdAt
        updatedAt
        createdBy {
          id
          name
        }
        updatedBy {
          id
          name
        }
        categories {
          id
          slug
          title
        }
        tags {
          id
          slug
          title
        }
      }
    }
  `, {
    variables: {
      slug,
      params,
    },
  });

  return result;
};

export const useTags = () => {
  const result = useQuery(gql`
    query GetTags {
      getTags {
        id
        title
        slug
        postsCount
        createdAt
      }
    }
  `);

  return result;
};

export const useCategories = () => {
  const result = useQuery(gql`
    query GetCategories {
      getCategories {
        id
        title
        slug
        postsCount
        createdAt
      }
    }
  `);

  return result;
};

export const getSiteItemUrl = (siteItem: ISiteItem, siteItems: ISiteItem[]) => {
  let { url } = siteItem;
  let currentItem: (ISiteItem | null) = siteItem;
  while (currentItem?.parentId) {
    // eslint-disable-next-line @typescript-eslint/no-loop-func
    currentItem = siteItems.find((p) => p.id === currentItem!.parentId) || null;
    url = `${currentItem?.url}/${url}`;
  }
  return `/${url}`;
};

export const useSiteMenu = (siteMenuName: string) => {
  const [result, setResult] = useState<ISiteMenuItem[]>([]);

  useQuery(gql`
  query ($name: String!) {
    getSiteMenuByName(name: $name) {
      id
      name
      title
      items {
        id
        title
        type
        url
        position
        parentId
        siteItemId
        siteItem {
          id
          parentId
          url
          title
        }
        createdAt
      }
      createdAt
      updatedAt
    }
    getAllSiteItems {
      id
      parentId
      url
    }
  }
    `, {
    variables: {
      name: siteMenuName,
    },
    onCompleted: (data) => {
      if (!data) {
        return;
      }
      const { items } = data.getSiteMenuByName;
      items.forEach((item: ISiteMenuItem) => {
        if (item.parentId) {
          const parent = items.find((p: ISiteItem) => p.id === item.parentId);
          if (parent) {
            if (!parent.children) {
              parent.children = [];
            }
            parent.children.push(item);
          }
        }
        item.url = item.type === ISiteMenuItemType.URL ? item.url
          : getSiteItemUrl((item as any).siteItem, data.getAllSiteItems);
      });
      setResult(items.filter((item: ISiteMenuItem) => !item.parentId));
    },
  });

  return result;
};

export type {
  TableMeta, TableField, TableData, UseTableNewOptions,
};
export default useTableNew;
