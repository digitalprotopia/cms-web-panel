import { gql, useApolloClient, useQuery } from '@apollo/client';
import { useState } from 'react';

const useTableData = (
  tableName: string,
  onCompletedMeta?: (meta: any) => void,
  onCompletedData?: (data: any) => void,
) => {
  const [tableData, setTableData] = useState<any>(null);
  const [tableMeta, setTableMeta] = useState<any>(null);

  const client = useApolloClient();

  const refetchData = async (newTableMeta: any) => {
    const newTableData = (await client.query({
      query: gql`
          query {
            getAll${tableName} {
              id createdAt
              ${newTableMeta.fields.map((field) => field.dbName).join(' ')}
            }
          }
        `,
    })).data[`getAll${tableName}`];
    setTableData(newTableData);
    if (onCompletedData) {
      onCompletedData(newTableData);
    }
  };

  const { loading, data, refetch } = useQuery(gql`
  query($tableName: String!) {
    getTableByDbName(dbName: $tableName) {
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
  }`, {
    variables: {
      tableName,
    },
    onCompleted: (newTableMeta) => {
      setTableMeta(newTableMeta.getTableByDbName);
      refetchData(newTableMeta.getTableByDbName);
      if (onCompletedMeta) {
        onCompletedMeta(newTableMeta.getTableByDbName);
      }
    },
  });
  return { data: tableData, meta: tableMeta, refetch: () => refetchData(tableMeta) };
};

export default useTableData;
