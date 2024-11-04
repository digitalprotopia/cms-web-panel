import {
  gql, useLazyQuery, useMutation, useQuery,
} from '@apollo/client';
import { useState } from 'react';
import {
  Button, IconButton, MenuItem, TextField,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import useTable from './use-table';
import DynamicParse from './DynamicParse';
import { FormField } from './form';
import { FieldType } from './entities/IField';

function FormEdit(props: {
  id?: string;
  tableId?: string;
}) {
  const [form, setForm] = useState<{
    name: string;
    title: string;
    tableId: string;
    fields: {
      name: string;
      title: string;
      formFieldType: string;
      tableFieldId: string;
    }[]
  }>({
    name: '',
    title: '',
    tableId: props.id ? '' : props.tableId as string,
    fields: [],
  });
  const { data, loading } = useQuery(gql`
    query($id: ID!) {
      getForm(id: $id) {
        id
        name
        title
        createdAt
        table {
          id
          name
          dbName
          createdAt
        }
        fields {
          name
          title
          formFieldType
          tableFieldId
        }
      }
    }
  `, {
    variables: { id: props.id },
    onCompleted: (_data) => {
      setForm({
        name: _data.getForm.name,
        title: _data.getForm.title,
        tableId: _data.getForm.table.id,
        fields: _data.getForm.fields.map((field) => ({
          name: field.name,
          title: field.title,
          formFieldType: field.formFieldType,
          tableFieldId: field.tableFieldId,
        })),
      });
    },
    skip: !props.id,
  });
  const [createForm] = useMutation(gql`
    mutation($input: FormInput! $fields: [FormFieldInput]!) {
      createForm(input: $input fields: $fields) {
        id
      }
    }
  `);

  const [editForm] = useMutation(gql`
    mutation($id: ID! $input: FormInput! $fields: [FormFieldInput]!) {
      editForm(id: $id input: $input fields: $fields) {
        id
      }
    }
  `);

  const table = useTable(form.tableId || '', {
    onMetaLoaded(meta) {
      if (!props.id) {
        setForm({
          ...form,
          fields: meta.fields.map((field) => ({
            name: field.name,
            title: field.name,
            formFieldType: 'string',
            tableFieldId: field.id,
          })),
        });
      }
    },
  });
  if (!table.data) {
    return 'Loading';
  }
  return (
    <div>
      <div>
        <TextField
          label="Название"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>
      <div>
        <TextField
          label="Код"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      {form.fields.map((field, index) => {
        const tableField = table.meta?.fields.find((f) => f.id === field.tableFieldId);
        return (
          <div key={index}>
            <TextField
              label={`Название поля ${tableField?.name}`}
              value={field.title}
              onChange={(e) => {
                const newFields = [...form.fields];
                newFields[index] = { ...field, title: e.target.value };
                setForm({ ...form, fields: newFields });
              }}
            />
            <FormField title={field.title} type={tableField?.type as FieldType || 'string'} value="" onChange={() => {}} />
            <IconButton
              onClick={() => {
                const newFields = [...form.fields];
                newFields.splice(index, 1);
                setForm({ ...form, fields: newFields });
              }}
            >
              <Delete />
            </IconButton>
          </div>
        );
      })}
      {table.meta?.fields.map((field) => (
        <div
          key={field.id}
        >
          <MenuItem
            onClick={(e) => {
              // setForm({ ...form, templateHtml: `${form.templateHtml}{${field.dbName}}` });
              const newFields = [...form.fields];
              newFields.push({
                name: field.name,
                title: field.name,
                formFieldType: field.type,
                tableFieldId: field.id,
              });
              setForm({ ...form, fields: newFields });
            }}
          >
            {`Add ${field.dbName}`}
          </MenuItem>
        </div>
      ))}
      <div>
        <Button onClick={() => {
          const variables = {
            input: {
              name: form.name,
              title: form.title,
              tableId: form.tableId,
            },
            fields: form.fields.map((field) => ({
              name: field.name,
              title: field.title,
              formFieldType: field.formFieldType,
              tableFieldId: field.tableFieldId,
            })),
          };
          if (props.id) {
            editForm({
              variables: {
                id: props.id,
                ...variables,
              },
            });
          } else {
            createForm({ variables });
          }
        }}
        >
          {props.id ? 'Сохранить' : 'Создать'}
        </Button>
      </div>
    </div>
  );
}

export default FormEdit;
