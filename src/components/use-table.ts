import { useQuery, gql, useMutation } from '@apollo/client';
import { FieldType, IField, IFieldOneToManyOptions } from './entities/IField';

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
      }
    }
  }
`;

export const generateGetTableDataQuery = (
  tableName: string,
  fields: TableField[],
) => gql`
      query GetTableData {
          getAll${tableName} {
          id
          createdAt
          _cms_title
          ${fields.map((field) => {
    if (field.type === FieldType.ONE_TO_MANY_ONE || field.type === FieldType.ONE_TO_MANY_MANY) {
      return `${field.dbName} { id _cms_title }`;
    }
    return field.dbName;
  }).join('\n        ')}
      }
      }
  `;
// if (field.type === 'geo') {
//   return `${field.dbName} { lat lon }`;
// }

interface UseTableOptions {
  onMetaLoaded?: (meta: TableMeta) => void;
  onDataLoaded?: (data: TableData[]) => void;
}

const useTable = (tableId: string, options?: UseTableOptions) => {
  const {
    data: tableMetaData,
    loading: metaLoading,
    error: metaError,
    refetch: refetchMeta,
  } = useQuery<{ getTable: TableMeta }>(GET_TABLE_BY_ID, {
    variables: { id: tableId },
    onCompleted: (data) => {
      options?.onMetaLoaded?.(data.getTable);
    },
    skip: !tableId,
  });

  const tableMeta = tableMetaData?.getTable;

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
          data: dataResult.data[`getAll${newMeta.dbName}`],
        };
      }
    } catch (_error) {
      console.error('Error refetching table data:', _error);
      throw _error;
    }
  };

  return {
    meta: tableMeta,
    data: tableData ? tableData[`getAll${tableMeta!.dbName}`] : null,
    loading,
    error,
    refetch,
  } as const;
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
  const [addField] = useMutation(query);

  return (data: Partial<IField>, options?: IFieldOneToManyOptions) => addField({
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
