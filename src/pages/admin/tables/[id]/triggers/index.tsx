import { ITableTrigger, TableTriggerType } from '@/components/entities/ITableTrigger';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material';
import { MaterialReactTable } from 'material-react-table';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';

export default function Triggers() {
  const router = useRouter();
  const { data, refetch } = useQuery(
    gql`
        query($id: ID!) {
            getTable(id: $id) {
                id
                name
                dbName
                tableTriggers {
                    id
                    title
                    type
                }
            }
        }
    `,
    {
      variables: {
        id: router.query.id,
      },
    },
  );
  const [createTableTrigger] = useMutation(gql`
        mutation($input: TableTriggerInput! $script: ServerScriptInput!) {
            createTableTrigger(input: $input script: $script) {
                id
                title
            }
        }
    `);

  const [createForm, setCreateForm] = useState<Partial<ITableTrigger>>({});
  const [dialogOpen, setDialogOpen] = useState(false);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
      },
      {
        accessorKey: 'title',
        header: 'Имя',
        Cell: ({ row }: { row: any }) => (
          <Link href={`/admin/tables/${router.query.id}/triggers/${row.original.id}`}>
            {row.original.title}
          </Link>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Тип',
      },
    ],
    [data],
  );

  if (!data) {
    return null;
  }
  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <div className="px-4 py-2">
        <h1 className="text-xl font-bold">
          Триггеры таблицы
          {' '}
          {data.getTable.name}
        </h1>
        <div className="mb-4">
          <Button
            variant="contained"
            onClick={() => setDialogOpen(true)}
          >
            Создать триггер
          </Button>
        </div>
        <MaterialReactTable
          columns={columns}
          data={data.getTable.tableTriggers}
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
              <h1 className="text-xl font-bold">
                Триггеры таблицы
                {' '}
                {data.getTable.name}
              </h1>
            </div>
          )}
        />
      </div>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Создать триггер</DialogTitle>
        <DialogContent>
          <div>
            <TextField
              variant="standard"
              label="Название триггера"
              className="w-full"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              slotProps={{
                htmlInput: { maxLength: 255 },
              }}
            />
          </div>
          <div>
            <TextField
              select
              variant="standard"
              label="Тип"
              className="w-full"
              value={createForm.type}
              onChange={(e) => setCreateForm(
                { ...createForm, type: e.target.value as TableTriggerType },
              )}
            >
              {Object.values(TableTriggerType).map((type) => (
                <MenuItem value={type}>{type}</MenuItem>
              ))}
            </TextField>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={async () => {
              await createTableTrigger({
                variables: {
                  input: {
                    title: createForm.title,
                    type: createForm.type,
                    tableId: data.getTable.id,
                  },
                  script: {
                    title: createForm.title,
                    code: '',
                  },
                },
              });
              await refetch();
              setDialogOpen(false);
            }}
          >
            Добавить
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
