interface TableField {
  id: string;
  name: string;
  type: string;
  dbName: string;
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

import { gql } from "@apollo/client";

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
      }
    }
  }
`;

export const generateGetTableDataQuery = (
  tableName: string,
  fields: TableField[],
) => {
  return gql`
    query GetTableData {
        getAll${tableName} {
        id
        createdAt
        ${fields.map((field) => field.dbName).join("\n      ")}
    }
    }
`;
};

import { useQuery } from "@apollo/client";

interface UseTableOptions {
  onMetaLoaded?: (meta: TableMeta) => void;
  onDataLoaded?: (data: TableData[]) => void;
}

const useTable = (tableId: string, options?: UseTableOptions) => {
  const {
    data: tableMetaData,
    loading: metaLoading,
    error: metaError,
  } = useQuery<{ getTable: TableMeta }>(GET_TABLE_BY_ID, {
    variables: { id: tableId },
    onCompleted: (data) => {
      options?.onMetaLoaded?.(data.getTable);
    },
  });

  const tableMeta = tableMetaData?.getTable;

  const {
    data: tableData,
    loading: dataLoading,
    error: dataError,
    refetch: refetchData,
  } = useQuery(
    generateGetTableDataQuery(tableMeta?.dbName || "", tableMeta?.fields || []),
    {
      pollInterval: 0,
      onCompleted: (data) => {
        options?.onDataLoaded?.(data[`getAll${tableMeta!.dbName}`]);
      },
    },
  );

  const loading = metaLoading || dataLoading;
  const error = metaError || dataError;

  return {
    meta: tableMeta,
    data: tableData ? tableData[`getAll${tableMeta!.dbName}`] : null,
    loading,
    error,
    refetch: refetchData,
  } as const;
};

export type { TableMeta, TableField, TableData, UseTableOptions };
export default useTable;
