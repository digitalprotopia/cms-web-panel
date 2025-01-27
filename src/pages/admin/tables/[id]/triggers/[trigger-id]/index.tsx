import { TableTriggerType } from '@/components/entities/ITableTrigger';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Editor } from '@monaco-editor/react';
import { Button, Checkbox, FormControlLabel, MenuItem, TextField } from '@mui/material';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import { useMemo, useState } from 'react';

export default function TableTrigger() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: '',
    code: '',
    enabled: false,
    type: TableTriggerType.AFTER_CREATE,
  });

  const [args, setArgs] = useState<string>('{}');

  const [result, setResult] = useState<string>('');

  const { data } = useQuery(gql`
    query($tableId: ID!, $tableTriggerId: ID!) {
        getTable(id: $tableId) {
            id
            name
        }
        getTableTrigger(id: $tableTriggerId) {
            id
            title
            enabled
            type
            serverScript {
               code
            }
        }
    }
    `, {
    variables: {
      tableId: router.query.id,
      tableTriggerId: router.query['trigger-id'],
    },
    onCompleted: (_data) => {
      setForm({
        title: _data.getTableTrigger.title,
        code: _data.getTableTrigger.serverScript.code,
        enabled: _data.getTableTrigger.enabled,
        type: _data.getTableTrigger.type,
      });
    },
  });
  const [save] = useMutation(gql`
    mutation($id: ID! $input: TableTriggerInput! $script: ServerScriptInput!) {
        editTableTrigger(id: $id input: $input script: $script) {
            id
            title
        }
    }
    `);

  const [deleteTrigger] = useMutation(gql`
        mutation($id: ID!) {
            deleteTableTrigger(id: $id)
        }
    `);

  const [runServerScriptCode] = useMutation(gql`
    mutation($args: JSON $code: String!) {
        runServerScriptCode(args: $args code: $code)
    }
`);

  const { enqueueSnackbar } = useSnackbar();
  if (!data) {
    return null;
  }

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <div className="px-4 py-2">
        <h1 className="text-xl font-bold">
          Триггер таблицы
          {' '}
          {data.getTable.name}
        </h1>
        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1 }}>
            <TextField
              label="Название"
              value={form.title}
              fullWidth
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <FormControlLabel
              control={(
                <Checkbox
                  checked={form.enabled}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                />
                )}
              label="Включен"
            />
          </div>
        </div>
        <div>
          <TextField
            select
            variant="standard"
            label="Тип"
            className="w-full"
            value={form.type}
            onChange={(e) => setForm(
              { ...form,
                type: e.target.value as TableTriggerType },
            )}
          >
            {Object.values(TableTriggerType).map((type) => (
              <MenuItem value={type}>{type}</MenuItem>
            ))}
          </TextField>
        </div>
        <div style={{ display: 'flex', width: '100%' }}>
          <div style={{ flex: 1 }}>
            <Editor
              height={200}
              defaultLanguage="javascript"
              value={form.code}
              onChange={(value) => setForm({ ...form, code: value! })}
            />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <Editor
              width={200}
              height={80}
              defaultLanguage="json"
              value={args}
              onChange={(value) => setArgs(value!)}
            />
            <Button
              variant="contained"
              onClick={async () => {
                try {
                  const res = await runServerScriptCode({
                    variables: {
                      args: JSON.parse(args),
                      code: form.code,
                    },
                  });
                  setResult(res.data.runServerScriptCode);
                } catch (e) {
                  setResult((e as any).message);
                }
              }}
            >
              Запустить
            </Button>
            <pre style={{
              overflow: 'auto',
            }}
            >
              {result}
            </pre>
          </div>
        </div>
        <div>
          <Button
            variant="contained"
            onClick={() => {
              save({
                variables: {
                  id: router.query['trigger-id'],
                  input: {
                    title: form.title,
                    enabled: form.enabled,
                    type: form.type,
                  },
                  script: {
                    code: form.code,
                  },
                },
              });
              enqueueSnackbar('Триггер сохранен', { variant: 'success' });
            }}
          >
            Сохранить
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              if (!window.confirm('Удалить триггер?')) {
                return;
              }
              await deleteTrigger({
                variables: {
                  id: router.query['trigger-id'],
                },
              });
              router.push(`/admin/tables/${router.query.id}/triggers`);
            }}
          >
            Удалить
          </Button>
        </div>
      </div>
    </div>
  );
}
