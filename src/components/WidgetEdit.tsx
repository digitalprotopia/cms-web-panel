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
import useTable, { TableField } from './use-table';
import { FieldType } from './entities/IField';
import { renderWidget } from './ParsePage';

interface WidgetEditProps {
  id?: string;
  tableId?: string;
  onClose: () => void;
}

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

const GET_WIDGET = gql`
  query GetWidget($id: ID!) {
    getWidget(id: $id) {
      id
      name
      title
      createdAt
      widgetViewType
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

const CREATE_WIDGET = gql`
  mutation CreateWidget(
    $input: WidgetInput!
    $tableView: TableViewInput!
    $template: TemplateInput!
  ) {
    createWidget(
      input: $input
      tableViewInput: $tableView
      templateInput: $template
    ) {
      id
    }
  }
`;

const UPDATE_WIDGET = gql`
  mutation EditWidget(
    $id: ID!
    $input: WidgetInput!
    $tableView: TableViewInput!
    $template: TemplateInput!
  ) {
    editWidget(
      id: $id
      input: $input
      tableViewInput: $tableView
      templateInput: $template
    ) {
      id
    }
  }
`;

function WidgetEdit({ id, tableId, onClose }: WidgetEditProps) {
  const [form, setForm] = useState({
    name: '',
    title: '',
    tableId: tableId || '',
    templateHtml: '',
    widgetViewType: 'list',
  });

  const isEditMode = Boolean(id && tableId);

  const { loading: widgetLoading } = useQuery(GET_WIDGET, {
    variables: { id },
    skip: !isEditMode,
    onCompleted: (data) => {
      setForm({
        name: data.getWidget.name,
        title: data.getWidget.title,
        tableId: data.getWidget.tableView.table.id,
        templateHtml: data.getWidget.template.html,
        widgetViewType: data.getWidget.widgetViewType,
      });
    },
  });

  const { data: tablesQuery, loading: tablesLoading } = useQuery(GET_TABLES);

  const [createWidget] = useMutation(CREATE_WIDGET);
  const [updateWidget] = useMutation(UPDATE_WIDGET);

  const widgetTable = useTable(form.tableId);

  if ((isEditMode && widgetLoading && tablesLoading) || tablesLoading) {
    return <div>Loading...</div>;
  }

  const handleSave = () => {
    const variables = {
      input: {
        name: form.name,
        title: form.title,
        widgetViewType: form.widgetViewType,
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
      updateWidget({ variables: { id, ...variables } }).then(() => {
        onClose();
      });
    } else {
      createWidget({ variables }).then(() => {
        onClose();
      });
    }
  };

  const row = widgetTable.data?.[0] || {};
  widgetTable.meta?.fields.forEach((field) => {
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
        select
        label="Тип виджета"
        variant="outlined"
        fullWidth
        value={form.widgetViewType}
        onChange={(e) => setForm({ ...form, widgetViewType: e.target.value })}
      >
        {['list', 'map'].map((type) => (
          <MenuItem key={type} value={type}>
            {type}
          </MenuItem>
        ))}
      </TextField>

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
        {widgetTable.meta
          ? renderWidget(
            form.widgetViewType,
            form.templateHtml,
            widgetTable.meta?.fields as TableField[],
            [row],
          ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {widgetTable.meta?.fields.map((field) => (
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
        {widgetTable.meta?.fields.length === 0 && (
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

export default WidgetEdit;
