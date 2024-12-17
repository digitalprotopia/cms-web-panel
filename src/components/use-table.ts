import { useQuery, gql, useMutation } from '@apollo/client';
import {
  FieldType, IField, IFieldOptions,
} from './entities/IField';

interface TableField {
  id: string;
  name: string;
  type: string;
  dbName: string;
  oneToManyLinkOneTable?: {
    id: string;
    dbName: string;
  };
  oneToManyLinkManyTable?: {
    id: string;
    dbName: string;
  };
  manyToManyLinkFirstTable?: {
    id: string;
    dbName: string;
  };
  manyToManyLinkSecondTable?: {
    id: string;
    dbName: string;
  };
}

interface TableMeta {
  id: string;
  name: string;
  dbName: string;
  createdAt: string;
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
      fields {
        id
        name
        type
        dbName
        oneToManyLinkOneTable {
          id
          dbName
        }
        oneToManyLinkManyTable {
          id
          dbName
        }
        manyToManyLinkFirstTable {
          id
          dbName
        }
        manyToManyLinkSecondTable {
          id
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
      createdAt
      fields {
        id
        name
        type
        dbName
        oneToManyLinkOneTable {
          id
          dbName
        }
        oneToManyLinkManyTable {
          id
          dbName
        }
        manyToManyLinkFirstTable {
          id
          dbName
        }
        manyToManyLinkSecondTable {
          id
          dbName
        }
      }
    }
  }
`;

export const generateGetTableDataQuery = (
  tableName: string,
  fields: TableField[],
) => {
  const tables: string[] = [];
  fields.forEach((field) => {
    if (field.type === FieldType.ONE_TO_MANY_ONE
      && !tables.includes(field.oneToManyLinkManyTable!.dbName)) {
      tables.push(field.oneToManyLinkManyTable!.dbName);
    }
    if (field.type === FieldType.ONE_TO_MANY_MANY
      && !tables.includes(field.oneToManyLinkOneTable!.dbName)) {
      tables.push(field.oneToManyLinkOneTable!.dbName);
    }
    if (field.type === FieldType.MANY_TO_MANY_FIRST
      && !tables.includes(field.manyToManyLinkSecondTable!.dbName)) {
      tables.push(field.manyToManyLinkSecondTable!.dbName);
    }
    if (field.type === FieldType.MANY_TO_MANY_SECOND
      && !tables.includes(field.manyToManyLinkFirstTable!.dbName)) {
      tables.push(field.manyToManyLinkFirstTable!.dbName);
    }
  });
  return gql`
      query GetTableData {
        ${tables.map((table) => `getAll${table} { id _cms_title }`).join('\n')}
          getAll${tableName} {
          id
          createdAt
          _cms_title
          ${fields.map((field) => {
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
    if (field.type === FieldType.FILE) {
      return `${field.dbName} { id name extension }`;
    }
    return field.dbName;
  }).join('\n        ')}
      }
      }
  `;
// if (field.type === 'geo') {
//   return `${field.dbName} { lat lon }`;
// }
};

interface UseTableOptions {
  onMetaLoaded?: (meta: TableMeta) => void;
  onDataLoaded?: (data: TableData[]) => void;
}

const useTable = (tableId: string, options?: UseTableOptions, tableDbName?: string) => {
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

  const {
    data: tableData,
    loading: dataLoading,
    error: dataError,
    refetch: refetchData,
  } = useQuery(
    generateGetTableDataQuery(tableMeta?.dbName || '', tableMeta?.fields || []),
    {
      skip: !tableMeta?.dbName || !tableMeta?.fields?.length,
      onCompleted: (data) => {
        options?.onDataLoaded?.(data[`getAll${tableMeta!.dbName}`]);
      },
    },
  );

  const processData = (data: any) => {
    const tables: string[] = [];
    tableMeta?.fields.forEach((field) => {
      if (field.type === FieldType.ONE_TO_MANY_ONE
        && !tables.includes(field.oneToManyLinkManyTable!.dbName)) {
        tables.push(field.oneToManyLinkManyTable!.dbName);
      }
      if (field.type === FieldType.ONE_TO_MANY_MANY
        && !tables.includes(field.oneToManyLinkOneTable!.dbName)) {
        tables.push(field.oneToManyLinkOneTable!.dbName);
      }
      if (field.type === FieldType.MANY_TO_MANY_FIRST
        && !tables.includes(field.manyToManyLinkSecondTable!.dbName)) {
        tables.push(field.manyToManyLinkSecondTable!.dbName);
      }
      if (field.type === FieldType.MANY_TO_MANY_SECOND
        && !tables.includes(field.manyToManyLinkFirstTable!.dbName)) {
        tables.push(field.manyToManyLinkFirstTable!.dbName);
      }
    });
    const objects: any = {};
    tables.forEach((table) => {
      data[`getAll${table}`].forEach((row: any) => {
        objects[row.id] = row;
      });
    });

    tableMeta?.fields.forEach((field) => {
      if (field.type === FieldType.ONE_TO_MANY_ONE) {
        data[`getAll${tableMeta!.dbName}`].forEach((row: any) => {
          row[field.dbName] = objects[row[`${field.dbName}Id`]];
        });
      }
      if (field.type === FieldType.ONE_TO_MANY_MANY || field.type === FieldType.MANY_TO_MANY_FIRST
        || field.type === FieldType.MANY_TO_MANY_SECOND) {
        data[`getAll${tableMeta!.dbName}`].forEach((row: any) => {
          row[field.dbName] = row[`${field.dbName}Ids`].map((id: string) => objects[id]);
        });
      }
    });

    return data[`getAll${tableMeta!.dbName}`];
  };

  const loading = metaLoading || dataLoading;
  const error = metaError || dataError;

  const refetch = async () => {
    try {
      const metaResult = await refetchMeta();
      const newMeta = metaResult.data.getTable;

      if (newMeta?.dbName && newMeta?.fields?.length) {
        const dataResult = await refetchData();
        return {
          meta: newMeta,
          data: processData(dataResult.data),
        };
      }
    } catch (_error) {
      console.error('Error refetching table data:', _error);
      throw _error;
    }
  };

  return {
    meta: tableMeta,
    data: tableData ? processData(tableData) : null,
    loading,
    error,
    refetch,
  } as const;
};

export const useTableByDbName = (tableDbName?: string, options?: UseTableOptions) => {
  const result = useTable('', options, tableDbName);
  return result;
};

export const useAddRow = (dbName: string) => {
  const [addRow] = useMutation(gql`
    mutation($input: ${dbName}Input!) {
      create${dbName}(input: $input) {
        id
        createdAt
      }
    }
`);

  return (data: any) => addRow({
    variables: {
      input: data,
    },
  });
};

export const useEditRow = (dbName: string) => {
  const [addRow] = useMutation(gql`
    mutation($id: String $input: ${dbName}Input!) {
      edit${dbName}(id: $id input: $input) {
        id
        createdAt
      }
    }
`);

  return (id: string, data: any) => addRow({
    variables: {
      id,
      input: data,
    },
  });
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

export type {
  TableMeta, TableField, TableData, UseTableOptions,
};
export default useTable;
