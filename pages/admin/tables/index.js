import { gql, useApolloClient, useQuery } from '@apollo/client';
import { Delete } from '@mui/icons-material';
import {
  Button,
  Checkbox, FormControl, FormControlLabel, IconButton, TextField,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useState } from 'react';

function AddRow(props) {
  const [form, setForm] = useState({});
  const client = useApolloClient();
  return (
    <>
      {props.table.fields.map((field) => {
        if (field.type === 'string') {
          return (
            <div key={field.id}>
              <TextField
                label={field.name}
                value={form[field.dbName] || ''}
                onChange={(e) => setForm({ ...form, [field.dbName]: e.target.value })}
              />
            </div>
          );
        }
        if (field.type === 'boolean') {
          return (
            <div key={field.id}>
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={form[field.dbName] || false}
                    onChange={(e) => setForm({ ...form, [field.dbName]: e.target.checked })}
                  />
)}
                label={field.name}
              />
            </div>
          );
        }
        if (field.type === 'date') {
          return (
            <div key={field.id}>
              <TextField
                label={field.name}
                value={form[field.dbName] || ''}
                onChange={(e) => setForm({ ...form, [field.dbName]: e.target.value })}
                type="date"
              />
            </div>
          );
        }
        return null;
      })}
      <div>
        <Button
          onClick={async () => {
            await client.mutate({
              mutation: gql`
            mutation($input: ${props.table.dbName}Input!) {
              create${props.table.dbName}(input: $input) {
                id
                createdAt
              }
            }
          `,
              variables: { input: form },
            });
            props.refetchData();
          }}
        >
          Add
        </Button>
      </div>
    </>
  );
}

function Home(props) {
  const router = useRouter();
  const { loading, data, refetch } = useQuery(gql`query {
    getTables {
      id
      name
      dbName
      createdAt
    }
  }`);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white">
      {data.getTables.map((table) => (
        <div key={table.id}>
          <h2 className="text-2xl">{table.name}</h2>
          <Button onClick={() => router.push(`/admin/tables/${table.dbName}`)}>View</Button>
        </div>
      ))}
    </div>
  );
}

export default Home;
