import { gql, useQuery } from '@apollo/client';
import { Typography } from '@mui/material';
import { MaterialReactTable, MRT_ColumnDef } from 'material-react-table';
import { useMemo } from 'react';

function FeedTargetsPage() {
  const { loading, data, refetch } = useQuery(gql`
        query {
        getFeedTargets {
            id
            title
            name
            url
            idInPlatform
            subIdInPlatform
            defaultClientId
        }
        }
    `);

  const columns: MRT_ColumnDef<any, any>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 400,
      },
      {
        accessorKey: 'title',
        header: 'Имя',
        size: 150,
      },
      {
        accessorKey: 'url',
        header: 'URL',
        size: 150,
      },
      {
        accessorKey: 'idInPlatform',
        header: 'ID в платформе',
        size: 150,
      },
      {
        accessorKey: 'subIdInPlatform',
        header: 'Sub ID в платформе',
        size: 150,
      },
      {
        accessorKey: 'defaultClientId',
        header: 'Client ID',
        size: 150,
      },
    ],
    [refetch],
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <MaterialReactTable
        columns={columns}
        data={data.getFeedTargets}
        enableColumnResizing
        enableFullScreenToggle={false}
        enableDensityToggle
        enableColumnFilters
        enablePagination
        enableSorting
        initialState={{
          columnVisibility: {
            id: false,
          },
        }}
        muiTableProps={{
          sx: {
            tableLayout: 'fixed',
          },
        }}
        renderTopToolbarCustomActions={() => (
          <div className="flex items-center gap-4">
            <Typography variant="h4">Ленты публикаций</Typography>
          </div>
        )}
      />
    </div>
  );
}

export default FeedTargetsPage;
