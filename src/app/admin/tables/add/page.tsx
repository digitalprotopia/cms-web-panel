'use client';

import { gql, useMutation } from '@apollo/client';
import { Button, MenuItem, TextField } from '@mui/material';
import { useState } from 'react';

function AddTable(props) {
  const [createTable] = useMutation(gql`
    mutation ($input: TableInput!) {
      createTable(input: $input) {
        id
        name
      }
    }
  `);

  const [form, setForm] = useState({
    name: '',
    dbName: '',
    fields: [],
  });

  const changeForm = (changeCallback) => {
    setForm((_form) => {
      _form = JSON.parse(JSON.stringify(_form));
      changeCallback(_form);
      return _form;
    });
  };

  return (
    <div>
      <div>
        <TextField
          label="Name"
          value={form.name}
          onChange={(e) => changeForm((_form) => (_form.name = e.target.value))}
        />
      </div>
      <div>
        <TextField
          label="Database Name"
          value={form.dbName}
          onChange={(e) => changeForm((_form) => (_form.dbName = e.target.value))}
        />
      </div>
      {form.fields.map((field, index) => (
        <div key={index}>
          <TextField
            label="Name"
            value={field.name}
            onChange={(e) => changeForm((_form) => (_form.fields[index].name = e.target.value))}
          />
          <TextField
            label="Database Name"
            value={field.dbName}
            onChange={(e) => changeForm(
              (_form) => (_form.fields[index].dbName = e.target.value),
            )}
          />
          <TextField
            select
            label="Type"
            value={field.type}
            onChange={(e) => changeForm((_form) => (_form.fields[index].type = e.target.value))}
          >
            <MenuItem value="string">String</MenuItem>
            <MenuItem value="boolean">Boolean</MenuItem>
            <MenuItem value="date">Date</MenuItem>
          </TextField>
        </div>
      ))}
      <div>
        <Button
          onClick={() => changeForm((_form) => _form.fields.push({ name: '', dbName: '', type: '' }))}
        >
          Add Field
        </Button>
      </div>
      <div>
        <Button
          onClick={async () => {
            await createTable({ variables: { input: form } });
          }}
        >
          Create table
        </Button>
      </div>
    </div>
  );
}

export default AddTable;
