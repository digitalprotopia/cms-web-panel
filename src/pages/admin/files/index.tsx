import {
  gql, useMutation, useQuery,
} from '@apollo/client';
import {
  Button,
  IconButton,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useState, useMemo } from 'react';
import { MaterialReactTable } from 'material-react-table';
import { IFile } from '@/components/entities/IFile';
import { toBase64 } from '@/components/form';
import { Delete } from '@mui/icons-material';

function FilesPage() {
  const router = useRouter();
  const { loading, data, refetch } = useQuery(gql`
    query {
      getFiles {
        id
        name
        size
        extension
        createdAt
        updatedAt
      }
    }
  `);
  const [createFile] = useMutation(gql`
    mutation createFile($input: FileInput!) {
      createFile(input: $input) {
        id
      }
    }
    `);
  const [deleteFile] = useMutation(gql`
    mutation deleteFile($id: ID!) {
      deleteFile(id: $id)
    }
  `);

  const [form, setForm] = useState<Partial<IFile>>({});

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
      {
        accessorKey: 'size',
        header: 'Размер',
        size: 150,
      },
      {
        accessorKey: 'actions',
        header: 'Действия',
        size: 300,
        Cell: ({ row }: { row: any }) => (
          <div className="flex gap-2">
            {['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(row.original.extension) ? (
              <img
                src={`${window.config.server}/download/?id=${row.original.id}`}
                alt={row.original.name}
                className="w-20 h-20"
              />
            ) : null}
            <Button
              onClick={() => router.push(`${window.config.server}/download/?id=${row.original.id}`)}
            >
              Скачать
            </Button>
            <IconButton onClick={async () => {
              if (window.confirm('Вы уверены?')) {
                await deleteFile({
                  variables: {
                    id: row.original.id,
                  },
                });
                await refetch();
              }
            }}
            >
              <Delete />
            </IconButton>
          </div>
        ),
      },
    ],
    [router],
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <div className="mb-4">
        <input
          type="file"
          onChange={async (e) => {
            if (e.target.files?.[0]) {
              setForm({
                file: await toBase64(e.target.files[0]) as string,
                name: e.target.files[0].name,
              });
            }
          }}
        />
        <Button
          variant="contained"
          className="mb-4 normal-case"
          onClick={async () => {
            await createFile({
              variables: {
                input: form,
              },
            });
            await refetch();
          }}
          disabled={!form.file}
        >
          Добавить файл
        </Button>
      </div>

      <MaterialReactTable
        columns={columns}
        data={data.getFiles}
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
            <h1 className="text-xl font-bold">Файлы</h1>
          </div>
        )}
      />
    </div>
  );
}

export default FilesPage;
