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
import useTable, { TableField } from './use-table';
import FormField from './form';
import { ITable } from './entities/ITable';
import { IField } from './entities/IField';
import DndComponent from './guiElements/DndComponent';

function FormEdit({ id, onClose }: {
  id?: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState<
  {
    name: string;
    title: string;
    tableId: string;
    fields: any[];
    cssClass: string;
  }
  >({
    name: '',
    title: '',
    tableId: '',
    fields: [],
    cssClass: '',
  });

  const tables = useQuery(gql`
    query {
      getTables {
        id
        name
      }
    }
  `);

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
            cssClass: '',
            formFieldType: 'string',
            tableFieldId: field.id,
            position: field.position,
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
          cssClass
          createdAt
          table {
            id
            name
            dbName
          }
          fields {
            name
            title
            cssClass
            position
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
          cssClass: formData.cssClass,
          tableId: formData.table.id,
          fields: formData.fields.map((field: any) => ({
            name: field.name,
            title: field.title,
            formFieldType: field.formFieldType,
            tableFieldId: field.tableFieldId,
            position: field.position,
            cssClass: field.cssClass,
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
        cssClass: form.cssClass,
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

  const fields = [...form.fields];

  fields.sort((a, b) => a.position - b.position);

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

        <TextField
          label="CSS class"
          value={form.cssClass}
          onChange={(e) => setForm((prev) => ({ ...prev, cssClass: e.target.value }))}
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
            {tables.data?.getTables.map((_table: ITable) => (
              <MenuItem key={_table.id} value={_table.id}>
                {_table.name}
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
            <DndComponent
              items={
            fields.map((field, index) => {
              const tableField = table.meta?.fields.find(
                (f: IField) => f.id === field.tableFieldId,
              );
              return {
                id: index.toString(),
                component: (
                  <Card key={index} className="p-4">
                    <div className="flex items-center gap-4">
                      <TextField
                        label={`Название поля (${tableField?.name})`}
                        value={field.title}
                        onChange={(e) => {
                          const newFields = [...fields];
                          newFields[index] = { ...field, title: e.target.value };
                          setForm((prev) => ({ ...prev, fields: newFields }));
                        }}
                        fullWidth
                      />
                      <TextField
                        label="CSS class"
                        value={field.cssClass}
                        onChange={(e) => {
                          const newFields = [...fields];
                          newFields[index] = { ...field, cssClass: e.target.value };
                          setForm((prev) => ({ ...prev, fields: newFields }));
                        }}
                        fullWidth
                      />
                      <FormField
                        title={field.title}
                        field={tableField as TableField}
                        value=""
                        onChange={() => {}}
                      />
                      <IconButton
                        onClick={() => {
                          const newFields = [...fields];
                          newFields.splice(index, 1);
                          setForm((prev) => ({ ...prev, fields: newFields }));
                        }}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </div>
                  </Card>
                ),
              };
            })
}
              onDrop={(newIndexes) => {
                const newFields: any[] = [];
                newIndexes.forEach((index) => {
                  newFields.push(fields[parseInt(index, 10)]);
                  newFields[newFields.length - 1].position = newFields.length - 1;
                });
                setForm((prev) => ({ ...prev, fields: newFields }));
              }}
            />
          </div>

          {table.meta?.fields && (
            <div className="mt-4">
              <Typography variant="h6">Доступные поля</Typography>
              <div className="grid grid-cols-1 gap-4 mt-2">
                {table.meta.fields.map((field: IField) => (
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
                          position: form.fields.length,
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
