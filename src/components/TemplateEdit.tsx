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

interface TemplateFormData {
  id: string;
  title: string;
  tableId: string;
  templateHtml: string;
}

interface TemplateEditProps {
  initialData: TemplateFormData | null;
  onClose: () => void;
  //   tables: ITable[];
}

function TemplateEdit({ initialData, onClose }: TemplateEditProps) {
  const [template, setTemplate] = useState<TemplateFormData>({
    id: initialData?.id || '',
    title: initialData?.title || '',
    tableId: initialData?.tableId || '',
    templateHtml: initialData?.templateHtml || '',
  });

  const isEditMode = Boolean(template.id && template.tableId);

  const { loading: templateLoading } = useQuery(GET_TEMPLATE, {
    variables: { id },
    skip: !isEditMode,
    onCompleted: (data) => {
      setTemplate({
        id: data.getTemplate.name,
        title: data.getTemplate.title,
        tableId: data.getTemplate.tableView.table.id,
        templateHtml: data.getTemplate.template.html,
      });
    },
  });

  const { data: tablesQuery, loading: tablesLoading } = useQuery(GET_TABLES);

  const [createTemplate] = useMutation(CREATE_TEMPLATE);
  const [updateTemplate] = useMutation(UPDATE_TEMPLATE);

  const templateTable = useTable(template.tableId);

  if ((isEditMode && templateLoading && tablesLoading) || tablesLoading) {
    return <div>Loading...</div>;
  }

  const handleSave = () => {
    const variables = {
      input: {
        name: template.id,
        title: template.title,
      },
      tableView: {
        title: template.title,
        name: template.id,
        tableId: template.tableId,
      },
      template: {
        title: template.title,
        html: template.templateHtml,
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
        value={template.title}
        onChange={(e) => setTemplate({ ...template, title: e.target.value })}
      />

      <TextField
        label="Код"
        variant="outlined"
        fullWidth
        value={template.id}
        onChange={(e) => setTemplate({ ...template, id: e.target.value })}
      />

      <FormControl fullWidth variant="outlined">
        <InputLabel id="table-select-label">Выберите таблицу</InputLabel>
        <Select
          labelId="table-select-label"
          label="Выберите таблицу"
          value={template.tableId}
          onChange={(e) => setTemplate({ ...template, tableId: e.target.value })}
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
        value={template.templateHtml}
        onChange={(e) => setTemplate({ ...template, templateHtml: e.target.value })}
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
          html={template.templateHtml}
          replace={row}
        />

      </div>

      <div className="flex flex-wrap gap-2">
        {templateTable.meta?.fields.map((field) => (
          <Button
            key={field.id}
            variant="contained"
            color="primary"
            onClick={() => setTemplate({
              ...template,
              templateHtml: `${template.templateHtml}{${field.dbName}}`,
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
          !template.id || !template.title! || !template.tableId || !template.templateHtml
        }
      >
        {isEditMode ? 'Сохранить' : 'Создать'}
      </Button>
    </div>
  );
}

export default TemplateEdit;
