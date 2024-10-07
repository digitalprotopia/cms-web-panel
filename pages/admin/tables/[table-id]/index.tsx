import { useRouter } from 'next/router';
import {
  Button, Checkbox, FormControlLabel, IconButton, TextField,
} from '@mui/material';
import { gql, useApolloClient } from '@apollo/client';
import { Delete } from '@mui/icons-material';
import { useState } from 'react';
import useTableData from '../../../../components/useTableData.ts';

function AddRow(props) {
  const [form, setForm] = useState({});
  const client = useApolloClient();
  return (
    <tr>
      {props.meta.fields.map((field) => {
        if (field.type === 'string') {
          return (
            <td key={field.id}>
              <TextField
                variant="standard"
                value={form[field.dbName] || ''}
                onChange={(e) => setForm({ ...form, [field.dbName]: e.target.value })}
              />
            </td>
          );
        }
        if (field.type === 'boolean') {
          return (
            <td key={field.id}>
              <Checkbox
                checked={form[field.dbName] || false}
                onChange={(e) => setForm({ ...form, [field.dbName]: e.target.checked })}
              />
            </td>
          );
        }
        if (field.type === 'date') {
          return (
            <td key={field.id}>
              <TextField
                variant="standard"
                value={form[field.dbName] || ''}
                onChange={(e) => setForm({ ...form, [field.dbName]: e.target.value })}
                type="datetime-local"
              />
            </td>
          );
        }
        return null;
      })}
      <td>
        <Button
          onClick={async () => {
            await client.mutate({
              mutation: gql`
            mutation($input: ${props.meta.dbName}Input!) {
              create${props.meta.dbName}(input: $input) {
                id
                createdAt
              }
            }
          `,
              variables: { input: form },
            });
            props.refetch();
          }}
        >
          Add
        </Button>
      </td>
    </tr>
  );
}

function TablePage(props) {
  const router = useRouter();
  const tableId = router.query['table-id'] as string;
  const client = useApolloClient();
  const { data, meta, refetch } = useTableData(tableId);
  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white">
      <div>
        <h2 className="text-2xl">{meta.name}</h2>
        <table>
          <tr>
            {meta.fields.map((field) => (
              <th key={field.id}>{field.name}</th>
            ))}
          </tr>
          {
              data.map((row, i) => (
                <tr key={i}>
                  {meta.fields.map((field) => (
                    <td key={field.id}>{row[field.dbName]?.toString()}</td>
                  ))}
                  <td>
                    <IconButton onClick={async () => {
                      await client.mutate({
                        mutation: gql`
                mutation {
                  delete${meta.dbName}(id: "${row.id}")
                }
              `,
                      });
                      refetch(data);
                    }}
                    >
                      <Delete />
                    </IconButton>
                  </td>
                </tr>
              ))
            }
          <AddRow meta={meta} refetch={refetch} />
        </table>
      </div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default TablePage;
