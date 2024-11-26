import {
  gql, useQuery,
} from '@apollo/client';
import { useRouter } from 'next/router';
import { useState, useMemo } from 'react';
import { MaterialReactTable } from 'material-react-table';
import TableEditor from '@/components/table-editor';

function AccountsPage() {
  const router = useRouter();
  const { loading, data, refetch } = useQuery(gql`
    query {
      getUsers {
        id
        name
      }
    }
  `);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 400,
      },
      {
        accessorKey: 'name',
        header: 'Имя',
        size: 150,
      },
    ],
    [router],
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <TableEditor
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          refetch();
          setIsModalOpen(false);
        }}
        mode="create"
      />

      <MaterialReactTable
        columns={columns}
        data={data.getUsers}
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
            <h1 className="text-xl font-bold">Аккаунты</h1>
          </div>
        )}
      />
    </div>
  );
}

export default AccountsPage;
