import { gql, useApolloClient, useQuery } from '@apollo/client';
import { Delete } from '@mui/icons-material';
import {
  Button,
  Checkbox, FormControl, FormControlLabel, IconButton, TextField,
} from '@mui/material';
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
  const [tablesData, setTablesData] = useState({});
  const client = useApolloClient();

  const refetchData = async (tables) => {
    const _tablesData = {};
    for (const i in tables.getTables) {
      const table = tables.getTables[i];
      const tableData = (await client.query({
        query: gql`
          query {
            getAll${table.dbName} {
              id createdAt
              ${table.fields.map((field) => field.dbName).join(' ')}
            }
          }
        `,
      })).data[`getAll${table.dbName}`];
      _tablesData[table.dbName] = tableData;
    }
    setTablesData(_tablesData);
  };

  const { loading, data, refetch } = useQuery(gql`query {
    getTables {
      id
      name
      dbName
      createdAt
      fields {
        id
        name
        type
        dbName
      }
    }
  }`, {
    onCompleted: refetchData,
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white">
      {data.getTables.map((table) => (
        <div key={table.id}>
          <h2 className="text-2xl">{table.name}</h2>
          <table>
            <tr>
              {table.fields.map((field) => (
                <th key={field.id}>{field.name}</th>
              ))}
            </tr>
            {
              tablesData[table.dbName]?.map((row, i) => (
                <tr key={i}>
                  {table.fields.map((field) => (
                    <td key={field.id}>{row[field.dbName]?.toString()}</td>
                  ))}
                  <td>
                    <IconButton onClick={async () => {
                      await client.mutate({
                        mutation: gql`
                mutation {
                  delete${table.dbName}(id: "${row.id}")
                }
              `,
                      });
                      refetchData(data);
                    }}
                    >
                      <Delete />
                    </IconButton>
                  </td>
                </tr>
              ))
            }
          </table>
          <AddRow table={table} refetchData={() => refetchData(data)} />
        </div>
      ))}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default Home;
