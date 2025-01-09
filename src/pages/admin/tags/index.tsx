import {
  gql, useQuery,
} from '@apollo/client';
import { useRouter } from 'next/router';
import { useState, useMemo } from 'react';
import { MaterialReactTable } from 'material-react-table';
import TableEditor from '@/components/table-editor';

function TagsPage() {
  const router = useRouter();
  const { loading, data, refetch } = useQuery(gql`
    query {
      getTags {
        title
        slug
      }
    }
  `);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Название',
        size: 150,
      },
      {
        accessorKey: 'slug',
        header: 'Адрес',
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
        data={data.getTags}
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
            <h1 className="text-xl font-bold">Теги</h1>
          </div>
        )}
      />
    </div>
  );
}

export default TagsPage;
