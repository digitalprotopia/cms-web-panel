import { gql, useMutation, useQuery } from '@apollo/client';
import { useState } from 'react';
import {
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { ITable } from '@/components/entities/ITable';
import dayjs from 'dayjs';
import useTable from './use-table';
import DynamicParse from './DynamicParse';
import { FieldType } from './entities/IField';

const GET_TABLES = gql`
  query {
    getTables {
      id
      name
      dbName
      createdAt
    }
  }
`;

const GET_TEMPLATE = gql`
  query GetTemplate($id: ID!) {
    getTemplate(id: $id) {
      id
      name
      title
      createdAt
      tableView {
        table {
          id
          name
          dbName
          createdAt
        }
      }
      template {
        id
        html
      }
    }
  }
`;

const CREATE_TEMPLATE = gql`
  mutation CreateTemplate(
    $input: TemplateInput!
    $tableView: TableViewInput!
    $template: TemplateInput!
  ) {
    createTemplate(
      input: $input
      tableViewInput: $tableView
      templateInput: $template
    ) {
      id
    }
  }
`;

const UPDATE_TEMPLATE = gql`
  mutation EditTemplate(
    $id: ID!
    $input: TemplateInput!
    $tableView: TableViewInput!
    $template: TemplateInput!
  ) {
    editTemplate(
      id: $id
      input: $input
      tableViewInput: $tableView
      templateInput: $template
    ) {
      id
    }
  }
`;

interface TemplateEditProps {
  id?: string;
  tableId?: string;
  onClose: () => void;
//   tables: ITable[];
}

function TemplateEdit({ id, tableId, onClose }: TemplateEditProps) {
  const [form, setForm] = useState({
    name: '',
    title: '',
    tableId: tableId || '',
    templateHtml: '',
  });

  const isEditMode = Boolean(id && tableId);

  const { loading: templateLoading } = useQuery(GET_TEMPLATE, {
    variables: { id },
    skip: !isEditMode,
    onCompleted: (data) => {
      setForm({
        name: data.getTemplate.name,
        title: data.getTemplate.title,
        tableId: data.getTemplate.tableView.table.id,
        templateHtml: data.getTemplate.template.html,
      });
    },
  });

  const { data: tablesQuery, loading: tablesLoading } = useQuery(GET_TABLES);

  const [createTemplate] = useMutation(CREATE_TEMPLATE);
  const [updateTemplate] = useMutation(UPDATE_TEMPLATE);

  const templateTable = useTable(form.tableId);

  if ((isEditMode && templateLoading && tablesLoading) || tablesLoading) {
    return <div>Loading...</div>;
  }

  const handleSave = () => {
    const variables = {
      input: {
        name: form.name,
        title: form.title,
      },
      tableView: {
        title: form.title,
        name: form.name,
        tableId: form.tableId,
      },
      template: {
        title: form.title,
        html: form.templateHtml,
      },
    };

    if (isEditMode) {
      updateTemplate({ variables: { id, ...variables } }).then(() => {
        onClose();
      });
    } else {
      createTemplate({ variables }).then(() => {
        onClose();
      });
    }
  };

  const row = templateTable.data?.[0] || {};
  templateTable.meta?.fields.forEach((field) => {
    if (field.type === FieldType.DATE) {
      row[field.dbName] = dayjs(row[field.dbName]).format('YYYY-MM-DD HH:mm');
    }
    if (field.type === FieldType.BOOLEAN) {
      row[field.dbName] = row[field.dbName] ? 'Да' : 'Нет';
    }
  });

  return (
    <div className="flex flex-col gap-4 py-2">
      <TextField
        label="Название"
        variant="outlined"
        fullWidth
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <TextField
        label="Код"
        variant="outlined"
        fullWidth
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      <FormControl fullWidth variant="outlined">
        <InputLabel id="table-select-label">Выберите таблицу</InputLabel>
        <Select
          labelId="table-select-label"
          label="Выберите таблицу"
          value={form.tableId}
          onChange={(e) => setForm({ ...form, tableId: e.target.value })}
        >
          {tablesQuery?.getTables.map((table: ITable) => (
            <MenuItem key={table.id} value={table.id}>
              {table.name}
              {' '}
              (
              {table.dbName}
              )
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label="HTML"
        variant="outlined"
        fullWidth
        multiline
        rows={4}
        value={form.templateHtml}
        onChange={(e) => setForm({ ...form, templateHtml: e.target.value })}
      />

      <div style={{
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: 4,
        borderColor: 'black',
        padding: 8,
      }}
      >
        <DynamicParse
          html={form.templateHtml}
          replace={row}
        />

      </div>

      <div className="flex flex-wrap gap-2">
        {templateTable.meta?.fields.map((field) => (
          <Button
            key={field.id}
            variant="contained"
            color="primary"
            onClick={() => setForm({
              ...form,
              templateHtml: `${form.templateHtml}{${field.dbName}}`,
            })}
          >
            {`{${field.dbName}}`}
          </Button>
        ))}
        {templateTable.meta?.fields.length === 0 && (
          <span>В таблице нет полей</span>
        )}
      </div>

      <Button
        variant="contained"
        className="w-full mt-4"
        onClick={handleSave}
        disabled={
          !form.name || !form.title! || !form.tableId || !form.templateHtml
        }
      >
        {isEditMode ? 'Сохранить' : 'Создать'}
      </Button>
    </div>
  );
}

TemplateEdit.defaultProps = {
  id: '',
  tableId: '',
};

export default TemplateEdit;
