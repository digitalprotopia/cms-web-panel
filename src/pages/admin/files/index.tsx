import {
  gql, useMutation, useQuery,
} from '@apollo/client';
import {
  Button,
  IconButton,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useState, useMemo } from 'react';
import { MaterialReactTable, MRT_ColumnDef, MRT_RowData } from 'material-react-table';
import { IFile } from '@/components/entities/IFile';
import toBase64 from '@/components/utils/toBase64';
import { Delete } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import Image from 'next/image';

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
        type
      }
    }
  `);
  const { enqueueSnackbar } = useSnackbar();
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

  const columns = useMemo<MRT_ColumnDef<MRT_RowData, any>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 350,
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
        accessorKey: 'createdAt',
        header: 'Дата добавления',
        size: 200,
        Cell: ({ cell }) => dayjs(cell.getValue()).format('DD.MM.YYYY'),
      },
      {
        accessorKey: 'type',
        header: 'Тип',
        size: 150,
      },
      {
        accessorKey: 'actions',
        header: 'Действия',
        size: 300,
        Cell: ({ row }: { row: any }) => (
          <div className="flex gap-2">
            {['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(row.original.extension) ? (
              <a href={`${window.config.server}/download/?id=${row.original.id}&mode=view`} target="_blank" rel="noreferrer">
                <Image
                  src={`${window.config.server}/download/?id=${row.original.id}&mode=view`}
                  alt={row.original.name}
                  width={80}
                  height={80}
                  className="w-20 h-20"
                  unoptimized
                />
              </a>
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
    [router, deleteFile, refetch],
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
            enqueueSnackbar('Выбранный файл добавлен', { variant: 'success', autoHideDuration: 3000 });
          }}
          disabled={!form.file}
        >
          Добавить файл
        </Button>
      </div>

      <MaterialReactTable
        columns={columns}
        data={data?.getFiles || []}
        enableColumnResizing
        enableFullScreenToggle={false}
        enableDensityToggle
        enableColumnFilters
        enablePagination
        enableSorting
        initialState={{
          sorting: [{ id: 'createdAt', desc: true }],
        }}
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
