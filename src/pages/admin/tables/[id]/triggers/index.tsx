import { ITableTrigger, TableTriggerType } from '@/components/entities/ITableTrigger';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

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
        <div>
          <Button
            variant="contained"
            onClick={() => setDialogOpen(true)}
          >
            Создать триггер
          </Button>
        </div>
        {data.getTable.tableTriggers.map((trigger: ITableTrigger) => (
          <div>
            <Link href={`/admin/tables/${router.query.id}/triggers/${trigger.id}`}>
              {trigger.title}
            </Link>
          </div>
        ))}
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
