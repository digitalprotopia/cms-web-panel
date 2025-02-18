import {
  gql, useQuery,
} from '@apollo/client';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { MaterialReactTable } from 'material-react-table';
import Link from "next/link";

function BotsPage() {
  const router = useRouter();
  const { loading, error, data, refetch } = useQuery(gql`
       query {
        getBots {
           id
           name
           title
           favicon
           url
           apiKey
           platformID
           idInPlatform
           clientId
        }
       }
   `);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'ID бота',
        size: 150,
        Cell: ({ row }: { row: any }) => (<Link href={`bots/${row.original.id}`} className="cursor-pointer">{row.original.id}</Link>)
      },
      {
        accessorKey: 'name',
        header: 'Логин бота',
        size: 150,
      },
      {
        accessorKey: 'title',
        header: 'Имя бота',
        size: 150,
      },
      {
        accessorKey: 'url',
        header: 'URL',
        size: 200,
      },
      {
        accessorKey: 'platformID',
        header: 'Platform ID',
        size: 150,
      },
    ],
    [router],
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (<div>
      Error:
      {error.message}
    </div>);
  }

  if (!data || !data.getBots) {
    return <div>No data available</div>;
  }

  return (
    <div className="relative rounded p-4 shadow-lg bg-white">
      <MaterialReactTable
        columns={columns}
        data={data.getBots}
        enableColumnResizing
        enableFullScreenToggle={false}
        enableDensityToggle
        enableColumnFilters
        enablePagination
        enableSorting
        muiTableProps={{
          sx: {
            tableLayout: 'fixed',
          },
        }}
        renderTopToolbarCustomActions={() => (
          <div className="px-4 py-2">
            <h1 className="text-xl font-bold">Боты</h1>
          </div>
        )}
      />

      <button
        className="fixed bottom-4 right-4 bg-green-500 text-white font-bold py-2 px-4 rounded-full shadow-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
        onClick={() => router.push('/admin/bots/add-bot')}
      >
        Создать бот
      </button>
    </div>
  );
}

export default BotsPage;
