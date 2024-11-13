import {
  gql, useMutation, useQuery,
} from '@apollo/client';
import React, { useState } from 'react';
import {
  Button,
  Card,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import useTable from './use-table';
import { FormField } from './form';
import { FieldType } from './entities/IField';

function FormEdit({ id, onClose, tables }) {
  const [form, setForm] = useState({
    name: '',
    title: '',
    tableId: '',
    fields: [],
  });

  const [createForm] = useMutation(gql`
    mutation ($input: FormInput!, $fields: [FormFieldInput]!) {
      createForm(input: $input, fields: $fields) {
        id
      }
    }
  `);

  const [editForm] = useMutation(gql`
    mutation ($id: ID!, $input: FormInput!, $fields: [FormFieldInput]!) {
      editForm(id: $id, input: $input, fields: $fields) {
        id
      }
    }
  `);

  const table = useTable(form.tableId, {
    onMetaLoaded: (meta) => {
      if (!id) {
        setForm((prev) => ({
          ...prev,
          fields: meta.fields.map((field) => ({
            name: field.name,
            title: field.name,
            formFieldType: 'string',
            tableFieldId: field.id,
          })),
        }));
      }
    },
  });

  useQuery(
    gql`
      query ($id: ID!) {
        getForm(id: $id) {
          id
          name
          title
          createdAt
          table {
            id
            name
            dbName
          }
          fields {
            name
            title
            formFieldType
            tableFieldId
          }
        }
      }
    `,
    {
      variables: { id },
      skip: !id,
      onCompleted: (data) => {
        const formData = data.getForm;
        setForm({
          name: formData.name,
          title: formData.title,
          tableId: formData.table.id,
          fields: formData.fields.map((field) => ({
            name: field.name,
            title: field.title,
            formFieldType: field.formFieldType,
            tableFieldId: field.tableFieldId,
          })),
        });
      },
    },
  );

  const handleSave = async () => {
    const variables = {
      input: {
        name: form.name,
        title: form.title,
        tableId: form.tableId,
      },
      fields: form.fields,
    };

    try {
      if (id) {
        await editForm({ variables: { id, ...variables } });
      } else {
        await createForm({ variables });
      }
      onClose();
    } catch (error) {
      console.error('Error saving form:', error);
    }
  };

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Название"
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          fullWidth
        />

        <TextField
          label="Код"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          fullWidth
        />
      </div>

      {!id && (
        <FormControl fullWidth>
          <InputLabel>Таблица</InputLabel>
          <Select
            value={form.tableId}
            onChange={(e) => setForm((prev) => ({ ...prev, tableId: e.target.value }))}
            label="Таблица"
          >
            {tables.map((table) => (
              <MenuItem key={table.id} value={table.id}>
                {table.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {form.tableId && (
        <>
          <Typography variant="h6" className="mt-4">
            Поля формы
          </Typography>

          <div className="grid grid-cols-1 gap-4">
            {form.fields.map((field, index) => {
              const tableField = table.meta?.fields.find(
                (f) => f.id === field.tableFieldId,
              );
              return (
                <Card key={index} className="p-4">
                  <div className="flex items-center gap-4">
                    <TextField
                      label={`Название поля (${tableField?.name})`}
                      value={field.title}
                      onChange={(e) => {
                        const newFields = [...form.fields];
                        newFields[index] = { ...field, title: e.target.value };
                        setForm((prev) => ({ ...prev, fields: newFields }));
                      }}
                      fullWidth
                    />
                    <FormField
                      title={field.title}
                      type={(tableField?.type as FieldType) || 'string'}
                      value=""
                      onChange={() => {}}
                    />
                    <IconButton
                      onClick={() => {
                        const newFields = [...form.fields];
                        newFields.splice(index, 1);
                        setForm((prev) => ({ ...prev, fields: newFields }));
                      }}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </div>
                </Card>
              );
            })}
          </div>

          {table.meta?.fields && (
            <div className="mt-4">
              <Typography variant="h6">Доступные поля</Typography>
              <div className="grid grid-cols-1 gap-4 mt-2">
                {table.meta.fields.map((field) => (
                  <Button
                    key={field.id}
                    variant="outlined"
                    onClick={() => {
                      if (
                        !form.fields.find((f) => f.tableFieldId === field.id)
                      ) {
                        const newFields = [...form.fields];
                        newFields.push({
                          name: field.name,
                          title: field.name,
                          formFieldType: field.type,
                          tableFieldId: field.id,
                        });
                        setForm((prev) => ({ ...prev, fields: newFields }));
                      }
                    }}
                    disabled={form.fields.some(
                      (f) => f.tableFieldId === field.id,
                    )}
                  >
                    {field.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex justify-end gap-2 mt-4">
        <Button onClick={onClose}>Отмена</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!form.name || !form.title || !form.tableId}
        >
          {id ? 'Сохранить' : 'Создать'}
        </Button>
      </div>
    </div>
  );
}

export default FormEdit;
